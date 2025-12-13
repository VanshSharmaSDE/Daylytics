const mongoose = require('mongoose');
const crypto = require('crypto');

const flowChartShareSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shareToken: { type: String, unique: true },
  name: { type: String, required: true },
  
  // Flowcharts being shared
  flowcharts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FlowChart' }],
  
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
flowChartShareSchema.pre('save', async function(next) {
  if (!this.shareToken) {
    let token;
    let isUnique = false;
    
    while (!isUnique) {
      token = crypto.randomBytes(16).toString('hex');
      const existing = await mongoose.model('FlowChartShare').findOne({ shareToken: token });
      if (!existing) {
        isUnique = true;
      }
    }
    
    this.shareToken = token;
  }
  next();
});

// Check if share is valid
flowChartShareSchema.methods.isValid = function() {
  if (!this.isActive) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  if (this.maxAccessCount && this.accessCount >= this.maxAccessCount) return false;
  return true;
};

module.exports = mongoose.model('FlowChartShare', flowChartShareSchema);
