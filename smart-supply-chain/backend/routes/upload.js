const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const ImportHistory = require('../models/ImportHistory');
const {
  allowedDataTypes,
  buildGoogleSheetPreview,
  csvRequirements,
  fetchGoogleSheetRows,
  normalizeHeader,
  parseSheetId
} = require('../services/googleSheets');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Middleware to get userId from headers (optional for now)
const getUserId = (req, res, next) => {
  const userId = req.headers['x-user-id'] || 'demo-user'; // Default to demo-user if not provided
  req.userId = userId;
  next();
};

const ensureDatabaseConnected = (res) => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  res.status(503).json({
    error: 'MongoDB is not connected. CSV preview can still work, but saving or viewing imported data requires the database server.'
  });
  return false;
};

router.get('/health', (req, res) => {
  console.log('[upload] health route hit');
  res.json({
    ok: true,
    route: '/api/upload',
    previewEndpoint: '/api/upload/google-sheet/preview'
  });
});

const buildMappedRows = (rows, mapping = {}) =>
  rows.map((row) => {
    const mappedRow = {};
    Object.entries(mapping).forEach(([requiredField, csvColumn]) => {
      if (csvColumn && row[csvColumn] !== undefined) {
        mappedRow[requiredField] = row[csvColumn];
      }
    });
    return mappedRow;
  });

async function importMappedData(userId, csvData, dataType, mapping = {}, sourceMeta = {}) {
  if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
    throw new Error('Invalid CSV data');
  }

  if (!dataType || !allowedDataTypes.includes(dataType)) {
    throw new Error('Invalid data type');
  }

  const requirements = csvRequirements[dataType];
  const firstRow = csvData[0] || {};
  const normalizedFirstRow = Object.keys(firstRow).reduce((acc, key) => {
    acc[normalizeHeader(key)] = firstRow[key];
    return acc;
  }, {});
  const effectiveMapping = {};

  requirements.required.forEach((field) => {
    if (mapping[field]) {
      effectiveMapping[field] = normalizeHeader(mapping[field]);
    } else if (normalizedFirstRow[field] !== undefined) {
      effectiveMapping[field] = field;
    }
  });

  requirements.optional.forEach((field) => {
    if (mapping[field]) {
      effectiveMapping[field] = normalizeHeader(mapping[field]);
    } else if (normalizedFirstRow[field] !== undefined) {
      effectiveMapping[field] = field;
    }
  });

  const normalizedRows = csvData.map((row) => {
    const normalized = {};
    Object.keys(row).forEach((key) => {
      normalized[normalizeHeader(key)] = row[key];
    });
    return normalized;
  });

  const mappedRows = buildMappedRows(normalizedRows, effectiveMapping);
  const mappedFirstRow = mappedRows[0] || {};
  const missingRequired = requirements.required.filter((col) => !mappedFirstRow[col]);

  if (missingRequired.length > 0) {
    const error = new Error(`Missing required fields: ${missingRequired.join(', ')}`);
    error.statusCode = 400;
    error.payload = {
      required: requirements.required,
      provided: Object.keys(firstRow),
      mapping: effectiveMapping
    };
    throw error;
  }

  let Model;
  switch (dataType) {
    case 'inventory':
      Model = require('../models/Inventory');
      break;
    case 'orders':
      Model = require('../models/Order');
      break;
    case 'shipments':
      Model = require('../models/Shipment');
      break;
  }

  const transformedData = mappedRows.map((row) => {
    const transformed = { userId };

    if (dataType === 'orders') {
      transformed.order_id = row.order_id || row.order || `ORD-${Date.now()}-${Math.round(Math.random() * 1E6)}`;
      transformed.sku = row.sku?.toLowerCase().trim() || '';
      transformed.quantity = Math.max(parseFloat(row.quantity) || 0, 1);
      transformed.location = row.location || '';
      transformed.pincode = row.pincode || '';
      transformed.warehouse = row.warehouse || '';
      transformed.customer = row.customer || row.location || 'Sheet Import';
      transformed.totalAmount = Math.max(parseFloat(row.totalamount) || 0, 0);
      transformed.orderDate = row.date ? new Date(row.date) : new Date();
    } else if (dataType === 'inventory') {
      transformed.sku = row.sku?.toLowerCase().trim() || '';
      transformed.quantity = parseFloat(row.quantity) || 0;
      transformed.location = row.location || '';
      transformed.warehouse = row.warehouse || '';
      transformed.product = row.product || '';
      transformed.minStock = parseFloat(row.minstock) || 0;
      transformed.maxStock = parseFloat(row.maxstock) || 0;
    } else if (dataType === 'shipments') {
      transformed.order_id = row.order_id || '';
      transformed.sku = row.sku?.toLowerCase().trim() || '';
      transformed.from = row.from || '';
      transformed.to = row.to || '';
      transformed.status = row.status || 'pending';
      transformed.tracking_number = row.tracking_number || '';
      transformed.warehouse = row.warehouse || '';
      transformed.date = row.date || new Date().toISOString();
    }

    return transformed;
  });

  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < transformedData.length; i += batchSize) {
    const batch = transformedData.slice(i, i + batchSize);

    if (dataType === 'orders') {
      const operations = batch.map((doc) => ({
        updateOne: {
          filter: { userId, order_id: doc.order_id },
          update: { $set: doc },
          upsert: true
        }
      }));

      const result = await Model.bulkWrite(operations, { ordered: false });
      inserted += (result.upsertedCount || 0) + (result.modifiedCount || 0);
    } else {
      await Model.insertMany(batch, { ordered: false });
      inserted += batch.length;
    }
  }

  if (dataType === 'orders') {
    const Warehouse = require('../models/Warehouse');
    const uniqueWarehouses = new Set();

    mappedRows.forEach((row) => {
      const warehouse = row.warehouse?.trim();
      const location = row.location?.trim();
      const pincode = row.pincode?.trim();
      if (warehouse && location && pincode) {
        uniqueWarehouses.add(`${warehouse}|||${location}|||${pincode}`);
      } else if (location && pincode) {
        uniqueWarehouses.add(`${location} Warehouse|||${location}|||${pincode}`);
      }
    });

    for (const wh of uniqueWarehouses) {
      const [warehouseName, location, pincode] = wh.split('|||');
      await Warehouse.findOneAndUpdate(
        { userId, warehouse_name: warehouseName },
        {
          $setOnInsert: {
            userId,
            warehouse_name: warehouseName,
            location,
            pincode,
            capacity: 10000
          }
        },
        { upsert: true, new: true }
      );
    }
  }

  return {
    success: true,
    message: `Successfully imported ${inserted} records`,
    count: inserted,
    mapping: effectiveMapping
  };
}

async function storeImportHistory(userId, rows, dataType, sourceMeta = {}) {
  const normalizedRows = (rows || []).map((row) => {
    const normalized = {};
    Object.keys(row || {}).forEach((key) => {
      normalized[normalizeHeader(key)] = row[key];
    });
    return normalized;
  });

  const headers = Object.keys(normalizedRows[0] || {});

  await ImportHistory.create({
    userId,
    sourceType: sourceMeta.sourceType || 'csv',
    sourceName: sourceMeta.sourceName || `${dataType}-import-${Date.now()}.csv`,
    sourceUrl: sourceMeta.sourceUrl || '',
    dataType,
    headers,
    rowCount: normalizedRows.length,
    rows: normalizedRows
  });
}

// Upload CSV and return headers
router.post('/', getUserId, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { dataType } = req.query;
    if (!dataType || !['orders', 'inventory', 'shipments'].includes(dataType)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid data type. Use: orders, inventory, or shipments' });
    }

    const results = [];
    const headers = new Set();

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('headers', (headerList) => {
        headerList.forEach(header => headers.add(header.toLowerCase().trim()));
      })
      .on('data', (data) => {
        // Normalize headers
        const normalized = {};
        for (const key in data) {
          normalized[key.toLowerCase().trim()] = data[key]?.toString().trim() || '';
        }
        results.push(normalized);
      })
      .on('end', () => {
        // Clean up the uploaded file
        fs.unlinkSync(req.file.path);

        const requirements = csvRequirements[dataType];
        const providedHeaders = Array.from(headers);
        const missingCols = requirements.required.filter(col => !providedHeaders.includes(col));

        res.json({
          success: true,
          dataType,
          requirements,
          headers: providedHeaders,
          provided: providedHeaders,
          missing: missingCols,
          needsMapping: missingCols.length > 0,
          message: missingCols.length > 0 ? `Some required columns are missing for ${dataType}. Please map your CSV columns.` : null,
          preview: results.slice(0, 5),
          data: results,
          uniqueSKUs: [...new Set(results.map(row => row.sku?.toLowerCase().trim()).filter(Boolean))],
          totalRows: results.length
        });
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        // Clean up the uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to parse CSV file' });
      });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

router.post('/google-sheet/preview', getUserId, express.json({ limit: '2mb' }), async (req, res) => {
  try {
    const preview = await buildGoogleSheetPreview(req.body || {});
    res.json(preview);
  } catch (error) {
    console.error('Google Sheet preview error:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to preview Google Sheet'
    });
  }
});

router.get('/history', getUserId, async (req, res) => {
  try {
    if (!ensureDatabaseConnected(res)) {
      return;
    }

    const history = await ImportHistory.find({ userId: req.userId })
      .sort({ created_at: -1 })
      .select('sourceType sourceName sourceUrl dataType headers rowCount created_at');

    res.json(history);
  } catch (error) {
    console.error('Import history error:', error);
    res.status(500).json({ error: 'Failed to fetch import history' });
  }
});

router.get('/history/:id', getUserId, async (req, res) => {
  try {
    if (!ensureDatabaseConnected(res)) {
      return;
    }

    const item = await ImportHistory.findOne({ _id: req.params.id, userId: req.userId });
    if (!item) {
      return res.status(404).json({ error: 'Imported dataset not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Import history item error:', error);
    res.status(500).json({ error: 'Failed to fetch imported dataset' });
  }
});

router.delete('/history/:id', getUserId, async (req, res) => {
  try {
    if (!ensureDatabaseConnected(res)) {
      return;
    }

    const deleted = await ImportHistory.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deleted) {
      return res.status(404).json({ error: 'Imported dataset not found' });
    }

    res.json({ success: true, message: 'Imported dataset removed from My Data.' });
  } catch (error) {
    console.error('Import history delete error:', error);
    res.status(500).json({ error: 'Failed to remove imported dataset' });
  }
});

// Store CSV data directly without mapping
router.post('/map-data', getUserId, express.json({ limit: '50mb' }), async (req, res) => {
  try {
    if (!ensureDatabaseConnected(res)) {
      return;
    }

    const { csvData, dataType, mapping = {}, sourceName = '', sourceUrl = '' } = req.body;
    const result = await importMappedData(req.userId, csvData, dataType, mapping, {
      sourceType: 'csv',
      sourceName,
      sourceUrl
    });
    await storeImportHistory(req.userId, csvData, dataType, {
      sourceType: 'csv',
      sourceName,
      sourceUrl
    });
    res.json(result);
  } catch (error) {
    console.error('Data mapping error:', error);
    if (error.statusCode === 400) {
      return res.status(400).json({
        error: error.message,
        ...(error.payload || {})
      });
    }
    const isDuplicateOrderId = error?.code === 11000 && error?.keyPattern?.order_id;
    res.status(500).json({
      error: isDuplicateOrderId ? 'Duplicate order_id detected in the uploaded data.' : 'Failed to store data',
      details: error.message
    });
  }
});

router.post('/google-sheet/map-data', getUserId, express.json({ limit: '5mb' }), async (req, res) => {
  try {
    if (!ensureDatabaseConnected(res)) {
      return;
    }

    const { sheetUrl, dataType, mapping = {} } = req.body;

    if (!dataType || !allowedDataTypes.includes(dataType)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }

    const { rows } = await fetchGoogleSheetRows(sheetUrl);

    const result = await importMappedData(req.userId, rows, dataType, mapping, {
      sourceType: 'google_sheet',
      sourceName: `Google Sheet ${parseSheetId(sheetUrl) || ''}`.trim(),
      sourceUrl: sheetUrl
    });
    await storeImportHistory(req.userId, rows, dataType, {
      sourceType: 'google_sheet',
      sourceName: `Google Sheet ${parseSheetId(sheetUrl) || ''}`.trim(),
      sourceUrl: sheetUrl
    });
    res.json(result);
  } catch (error) {
    console.error('Google Sheet import error:', error);
    if (error.statusCode === 400) {
      return res.status(400).json({
        error: error.message,
        ...(error.payload || {})
      });
    }
    const isDuplicateOrderId = error?.code === 11000 && error?.keyPattern?.order_id;
    res.status(500).json({
      error: isDuplicateOrderId ? 'Duplicate order_id detected in the Google Sheet data.' : 'Failed to import Google Sheet',
      details: error.message
    });
  }
});

module.exports = router;
