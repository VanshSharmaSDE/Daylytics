const mongoose = require('mongoose');

const archiveSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  total: { type: Number, default: 0 },
  completed: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('DailyArchive', archiveSchema);
