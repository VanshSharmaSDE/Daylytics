const mongoose = require('mongoose');
const crypto = require('crypto');

const shareSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shareToken: { type: String, unique: true },
  name: { type: String, required: true }, // Name for the share
  
  // What is being shared
  files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
  folders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Folder' }],
  
  // Access control
  expiresAt: { type: Date }, // null = never expires
  maxAccessCount: { type: Number }, // null = unlimited
  accessCount: { type: Number, default: 0 },
  
  // Status
  isActive: { type: Boolean, default: true },
  
  // Tracking
  lastAccessedAt: { type: Date },
}, { timestamps: true });

// Generate unique share token
shareSchema.pre('save', async function(next) {
  if (!this.shareToken) {
    // Generate a unique token
    let token;
    let isUnique = false;
    
    while (!isUnique) {
      token = crypto.randomBytes(16).toString('hex');
      const existing = await mongoose.model('Share').findOne({ shareToken: token });
      if (!existing) {
        isUnique = true;
      }
    }
    
    this.shareToken = token;
  }
  next();
});

// Check if share is valid
shareSchema.methods.isValid = function() {
  if (!this.isActive) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  if (this.maxAccessCount && this.accessCount > this.maxAccessCount) return false;
  return true;
};

module.exports = mongoose.model('Share', shareSchema);
