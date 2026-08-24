const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required'],
    select: false
  },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'ORDER_MANAGER', 'CONTENT_MANAGER', 'SUPPORT_AGENT'],
    default: 'ADMIN'
  },
  permissions: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  },
  lastLoginIP: {
    type: String
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true
});

// Compare password method
adminSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Check if locked
adminSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Transform to avoid sending passwordHash
adminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('Admin', adminSchema);
