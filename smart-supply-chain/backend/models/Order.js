const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  order_id: { type: String, required: true },
  customer: { type: String, default: '' },
  sku: { type: String, trim: true, lowercase: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  location: String,
  pincode: String,
  items: [{
    product: { type: String, default: '' },
    sku: String,
    quantity: { type: Number, min: 1 },
    unitPrice: { type: Number, min: 0 },
    total: { type: Number, min: 0 }
  }],
  totalAmount: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  warehouse: String,
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  orderDate: { type: Date, default: Date.now },
  expectedDelivery: Date,
  notes: String,
  created_at: { type: Date, default: Date.now }
});

// Indexes
orderSchema.index({ userId: 1, order_id: 1 }, { unique: true });
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ userId: 1, warehouse: 1 });
orderSchema.index({ userId: 1, sku: 1 });
orderSchema.index({ userId: 1, orderDate: 1 });

module.exports = mongoose.model('Order', orderSchema);
