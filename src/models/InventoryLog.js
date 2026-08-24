const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  productName: {
    type: String,
    default: ''
  },
  sku: {
    type: String,
    required: true,
    index: true
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  changeAmount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true,
    default: 'Manual Stock Adjustment'
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  },
  adminName: {
    type: String,
    default: 'System'
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
