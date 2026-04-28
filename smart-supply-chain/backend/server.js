const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const uploadRouter = require('./routes/upload');

const ensureExpectedIndexes = async () => {
  const Order = require('./models/Order');
  const Shipment = require('./models/Shipment');
  const Warehouse = require('./models/Warehouse');

  const dropLegacyUniqueIndex = async (model, indexName) => {
    try {
      const indexes = await model.collection.indexes();
      const legacyIndex = indexes.find((index) => index.name === indexName && index.unique);

      if (!legacyIndex) {
        return;
      }

      await model.collection.dropIndex(indexName);
      console.log(`Dropped legacy unique index ${model.collection.collectionName}.${indexName}`);
    } catch (error) {
      console.error(`Failed to update index ${model.collection.collectionName}.${indexName}:`, error.message);
    }
  };

  await dropLegacyUniqueIndex(Order, 'order_id_1');
  await dropLegacyUniqueIndex(Shipment, 'shipment_id_1');
  await dropLegacyUniqueIndex(Warehouse, 'warehouse_name_1');

  try {
    await Order.syncIndexes();
    await Shipment.syncIndexes();
    await Warehouse.syncIndexes();
    console.log('MongoDB indexes synced');
  } catch (error) {
    console.error('MongoDB index sync error:', error.message);
  }
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/supply-chain', {
  serverSelectionTimeoutMS: 5000
})
.then(async () => {
  console.log('Connected to MongoDB');
  await ensureExpectedIndexes();
})
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  console.log('Continuing without MongoDB connection...');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/upload', uploadRouter);
app.use('/api/warehouses', require('./routes/warehouses'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/shipments', require('./routes/shipments'));
app.use('/api/demand-forecast', require('./routes/demand-forecast'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Uploaded data is too large to process in one request. Try a smaller CSV batch.'
    });
  }
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Upload router mounted at http://localhost:${PORT}/api/upload`);
  console.log(`Google Sheet preview endpoint ready at http://localhost:${PORT}/api/upload/google-sheet/preview`);
});
