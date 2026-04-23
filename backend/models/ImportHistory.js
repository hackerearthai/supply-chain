const mongoose = require('mongoose');

const importHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  sourceType: { type: String, enum: ['csv', 'google_sheet'], required: true },
  sourceName: { type: String, required: true },
  sourceUrl: { type: String, default: '' },
  dataType: { type: String, enum: ['orders', 'inventory', 'shipments'], required: true },
  headers: { type: [String], default: [] },
  rowCount: { type: Number, default: 0 },
  rows: { type: [mongoose.Schema.Types.Mixed], default: [] },
  created_at: { type: Date, default: Date.now }
});

importHistorySchema.index({ userId: 1, created_at: -1 });

module.exports = mongoose.model('ImportHistory', importHistorySchema);
