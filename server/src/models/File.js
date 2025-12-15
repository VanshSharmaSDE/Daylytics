const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  title: { type: String, required: true, maxlength: 200 },
  content: { type: String, default: '', maxlength: 50000 },
  isPinned: { type: Boolean, default: false },
  tags: [{ type: String, maxlength: 30 }],
}, { timestamps: true });

// Index for better query performance
fileSchema.index({ user: 1, createdAt: -1 });
fileSchema.index({ user: 1, isPinned: -1, createdAt: -1 });
fileSchema.index({ user: 1, folder: 1, createdAt: -1 });

module.exports = mongoose.model('File', fileSchema);
