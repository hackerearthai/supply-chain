const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  warehouse_name: { type: String, required: true },
  location: { type: String, required: true },
  pincode: { type: String, required: true },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  capacity: { type: Number, min: 0 },
  manager: String,
  contact: {
    phone: String,
    email: String
  },
  isActive: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

// Compound index for userId and warehouse_name
warehouseSchema.index({ userId: 1, warehouse_name: 1 }, { unique: true });

module.exports = mongoose.model('Warehouse', warehouseSchema);