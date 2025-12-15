const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  parentFolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  isPinned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
folderSchema.index({ user: 1, parentFolder: 1, createdAt: -1 });
folderSchema.index({ user: 1, isPinned: -1, createdAt: -1 });

module.exports = mongoose.model('Folder', folderSchema);
