const mongoose = require('mongoose');

const bucketFileSchema = new mongoose.Schema({
  fileId: { type: String, required: true, unique: true }, // Cloudinary public_id (or storage provider file id)
  url: { type: String, required: true }, // secure CDN URL returned by storage provider
  resourceType: { type: String, default: null }, // provider resource type (image, raw, video)
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

bucketFileSchema.index({ uploadedBy: 1, createdAt: -1 });

module.exports = mongoose.model('BucketFile', bucketFileSchema);
