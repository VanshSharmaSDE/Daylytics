const mongoose = require('mongoose');

const editorFileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  view: {
    type: String,
    enum: ['window', 'console'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: ['html', 'css', 'javascript'],
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create compound index to ensure unique file names per user and view
editorFileSchema.index({ user: 1, view: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('EditorFile', editorFileSchema);
