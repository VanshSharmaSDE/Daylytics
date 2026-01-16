const mongoose = require('mongoose');

const sharedLinkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  file: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
  token: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Index for better query performance
sharedLinkSchema.index({ token: 1 });
sharedLinkSchema.index({ user: 1, isActive: 1 });
sharedLinkSchema.index({ file: 1 });

module.exports = mongoose.model('SharedLink', sharedLinkSchema);
