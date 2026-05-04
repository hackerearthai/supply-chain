const Papa = require('papaparse');

const allowedDataTypes = ['inventory', 'orders', 'shipments'];

const csvRequirements = {
  orders: {
    required: ['quantity', 'sku', 'location', 'pincode'],
    optional: ['order_id', 'order', 'warehouse', 'date', 'customer', 'product', 'totalamount']
  },
  inventory: {
    required: ['sku', 'quantity', 'location'],
    optional: ['warehouse', 'date', 'product', 'minstock', 'maxstock']
  },
  shipments: {
    required: ['order_id', 'sku', 'from', 'to', 'status'],
    optional: ['warehouse', 'date', 'tracking_number']
  }
};

const normalizeHeader = (value = '') => value.toString().toLowerCase().trim();

const parseSheetId = (sheetUrl = '') => {
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

const parseGid = (sheetUrl = '') => {
  try {
    const url = new URL(sheetUrl);
    return url.searchParams.get('gid') || '0';
  } catch {
    return '0';
  }
};

const buildGoogleSheetCsvUrl = (sheetUrl = '') => {
  const sheetId = parseSheetId(sheetUrl);
  if (!sheetId) return null;

  const gid = parseGid(sheetUrl);
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
};

const parseCsvTextRows = (csvText = '') => {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true
  }); 

  if (parsed.errors?.length) {
    const fatalError = parsed.errors.find((error) => error.code !== 'UndetectableDelimiter');
    if (fatalError) {
      const error = new Error(fatalError.message || 'Failed to parse Google Sheet CSV');
      error.statusCode = 400;
      throw error;
    }
  }

  const columns = (parsed.meta.fields || []).map((header) => normalizeHeader(header));
  const rows = (parsed.data || []).map((row) => {
    const normalized = {};
    Object.keys(row || {}).forEach((key) => {
      normalized[normalizeHeader(key)] = row[key]?.toString().trim() || '';
    });
    return normalized;
  });

  return { columns, rows };
};

const buildPreviewPayload = (rows, dataType) => {
  const columns = Object.keys(rows[0] || {});
  const preview = rows.slice(0, 5);

  if (!dataType) {
    return {
      success: true,
      columns,
      preview,
      totalRows: rows.length
    };
  }

  const requirements = csvRequirements[dataType];
  const missingCols = requirements.required.filter((col) => !columns.includes(col));

  return {
    success: true,
    dataType,
    columns,
    headers: columns,
    requirements,
    provided: columns,
    missing: missingCols,
    needsMapping: missingCols.length > 0,
    message: missingCols.length > 0
      ? `Some required columns are missing for ${dataType}. Please map your sheet columns.`
      : null,
    preview,
    data: rows,
    uniqueSKUs: [...new Set(rows.map((row) => row.sku?.toLowerCase().trim()).filter(Boolean))],
    totalRows: rows.length
  };
};

const fetchGoogleSheetRows = async (sheetUrl) => {
  if (!sheetUrl || typeof sheetUrl !== 'string') {
    const error = new Error('Google Sheet URL is required');
    error.statusCode = 400;
    throw error;
  }

  const csvUrl = buildGoogleSheetCsvUrl(sheetUrl);
  if (!csvUrl) {
    const error = new Error('Invalid Google Sheet URL');
    error.statusCode = 400;
    throw error;
  }

  const response = await fetch(csvUrl);
  if (!response.ok) {
    const error = new Error('Failed to fetch Google Sheet. Ensure it is published or shared for link access.');
    error.statusCode = 400;
    throw error;
  }

  const csvText = await response.text();
  const { columns, rows } = parseCsvTextRows(csvText);

  if (!rows.length) {
    const error = new Error('Google Sheet is empty or has no readable rows');
    error.statusCode = 400;
    throw error;
  }

  return { csvUrl, columns, rows, sheetId: parseSheetId(sheetUrl) };
};

const buildGoogleSheetPreview = async ({ sheetUrl, dataType }) => {
  if (dataType && !allowedDataTypes.includes(dataType)) {
    const error = new Error('Invalid data type. Use: orders, inventory, or shipments');
    error.statusCode = 400;
    throw error;
  }

  const { rows } = await fetchGoogleSheetRows(sheetUrl);
  return buildPreviewPayload(rows, dataType);
};

module.exports = {
  allowedDataTypes,
  buildGoogleSheetCsvUrl,
  buildGoogleSheetPreview,
  buildPreviewPayload,
  csvRequirements,
  fetchGoogleSheetRows,
  normalizeHeader,
  parseCsvTextRows,
  parseSheetId
};
