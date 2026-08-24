const mongoose = require('mongoose');

const adminSessionSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true
  },
  tokenHash: {
    type: String,
    required: true,
    index: true
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // MongoDB TTL index for automatic expiration
  },
  isValid: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdminSession', adminSessionSchema);
