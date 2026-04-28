const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  shipment_id: { type: String, required: true },
  order_id: { type: String, required: true },
  carrier: { type: String, required: true },
  trackingNumber: String,
  status: { type: String, enum: ['pending', 'in_transit', 'delivered', 'delayed', 'cancelled'], default: 'pending' },
  origin: {
    warehouse: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  destination: {
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  items: [{
    product: { type: String, required: true },
    sku: String,
    quantity: { type: Number, required: true, min: 1 }
  }],
  shippedDate: Date,
  estimatedDelivery: Date,
  actualDelivery: Date,
  notes: String,
  created_at: { type: Date, default: Date.now }
});

// Indexes
shipmentSchema.index({ userId: 1, shipment_id: 1 }, { unique: true });
shipmentSchema.index({ userId: 1, status: 1 });
shipmentSchema.index({ userId: 1, order_id: 1 });

module.exports = mongoose.model('Shipment', shipmentSchema);
