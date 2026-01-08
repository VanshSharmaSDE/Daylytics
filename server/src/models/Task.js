const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // store ISO date string YYYY-MM-DD
  title: { type: String, required: true, maxlength: 500 },
  done: { type: Boolean, default: false },
  attachment: {
    fileId: { type: String },
    url: { type: String },
    originalName: { type: String },
    size: { type: Number },
    mimeType: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
