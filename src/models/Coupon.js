const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  discountType: {
    type: String,
    enum: ['FLAT', 'PERCENT', 'percentage', 'fixed'],
    default: 'FLAT'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  maxDiscountAmount: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    default: () => new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 months default
  },
  maxUsageLimit: {
    type: Number,
    default: 1000
  },
  usageLimit: {
    type: Number,
    default: 1000
  },
  usedCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
