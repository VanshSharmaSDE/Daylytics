const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  settings: { type: Object, default: { "daylytics-theme": "light" } },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
