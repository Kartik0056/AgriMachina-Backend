const mongoose = require('mongoose');

const heroSlideSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  tagline: {
    type: String,
    default: '',
    trim: true
  },
  badge: {
    type: String,
    default: '🔥 SPECIAL OFFER • LIMITED TIME',
    trim: true
  },
  category: {
    type: String,
    default: 'Agricultural Machinery',
    trim: true
  },
  bgImage: {
    type: String,
    default: '/images/machinery/power_weeder.jpg'
  },
  productImage: {
    type: String,
    default: ''
  },
  videoUrl: {
    type: String,
    default: '',
    trim: true
  },
  isVideoBackground: {
    type: Boolean,
    default: false
  },
  specs: [{
    type: String,
    trim: true
  }],
  price: {
    type: Number,
    default: 0
  },
  mrp: {
    type: Number,
    default: 0
  },
  discountPercent: {
    type: Number,
    default: 0
  },
  monthlyEmi: {
    type: Number,
    default: 0
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  productSlug: {
    type: String,
    default: '',
    trim: true
  },
  ctaText: {
    type: String,
    default: 'Explore Full Machine Details',
    trim: true
  },
  ctaLink: {
    type: String,
    default: '',
    trim: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  countdownHours: {
    type: Number,
    default: 5
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HeroSlide', heroSlideSchema);
