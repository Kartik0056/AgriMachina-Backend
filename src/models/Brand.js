const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
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
  logo: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  countryOfOrigin: {
    type: String,
    default: 'India'
  },
  website: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Brand', brandSchema);
