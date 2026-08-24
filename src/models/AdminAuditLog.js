const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  },
  adminName: {
    type: String,
    default: 'System / Guest'
  },
  adminEmail: {
    type: String,
    default: ''
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  resource: {
    type: String,
    required: true,
    index: true
  },
  resourceId: {
    type: String,
    default: ''
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ip: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
