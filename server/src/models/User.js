const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, default: '', maxlength: 30 },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  settings: { type: Object, default: { "daylytics-theme": "light", "task-view-mode": "list" } },
  storageUsed: { type: Number, default: 0 }, // in bytes
  storageLimit: { type: Number, default: 100 * 1024 * 1024 }, // 100MB in bytes
  pendingInlineImages: [{
    fileId: String,
    url: String,
    originalName: String,
    size: Number,
    uploadedAt: Date
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
