const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: '🌱'
  },
  tagline: {
    type: String,
    default: ''
  },
  startingPrice: {
    type: String,
    default: ''
  },
  emiStarting: {
    type: String,
    default: ''
  },
  features: [{
    type: String
  }],
  subcategories: [{
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: String
  }],
  seo: {
    seoTitle: String,
    metaDescription: String,
    focusKeyword: String,
    canonicalUrl: String,
    ogImage: String,
    faqs: [{
      question: String,
      answer: String
    }]
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);
