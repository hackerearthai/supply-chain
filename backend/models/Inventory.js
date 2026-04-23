const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  product: { type: String, required: true },
  sku: String,
  quantity: { type: Number, required: true, min: 0 },
  warehouse: String,
  location: String,
  minStock: { type: Number, default: 10 },
  maxStock: { type: Number, default: 1000 },
  unitCost: Number,
  lastUpdated: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
});

// Indexes
inventorySchema.index({ userId: 1, product: 1 });
inventorySchema.index({ userId: 1, sku: 1 });
inventorySchema.index({ userId: 1, warehouse: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);