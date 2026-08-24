const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required'],
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5,
    index: true
  },
  title: {
    type: String,
    default: '',
    trim: true
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true
  },
  farmContext: {
    farmType: { type: String, default: '' },
    cropGrown: { type: String, default: '' },
    acres: { type: Number, default: 0 }
  },
  images: [{
    type: String
  }],
  videoUrl: {
    type: String,
    default: ''
  },
  verifiedPurchase: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Hidden'],
    default: 'Approved',
    index: true
  },
  helpfulVotes: {
    type: Number,
    default: 0
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  moderatedAt: {
    type: Date
  },
  moderationNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index to quickly look up reviews by product or user
reviewSchema.index({ user: 1, product: 1 });

module.exports = mongoose.model('Review', reviewSchema);
