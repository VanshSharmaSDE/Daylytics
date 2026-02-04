const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, maxlength: 500 },
  description: { type: String, maxlength: 2000 },
  done: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  category: { type: String, maxlength: 50 },
  dueDate: { type: Date },
  attachment: {
    fileId: { type: String },
    url: { type: String },
    originalName: { type: String },
    size: { type: Number },
    mimeType: { type: String }
  }
}, { timestamps: true });

// Index for faster queries
taskSchema.index({ user: 1, done: 1 });
taskSchema.index({ user: 1, priority: 1 });

module.exports = mongoose.model('Task', taskSchema);
