const mongoose = require('mongoose');

const contactRequestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, default: '', trim: true },
  machineryInterest: { type: String, default: '' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  productTitle: { type: String, default: '' },
  productSku: { type: String, default: '' },
  inquiryType: {
    type: String,
    enum: ['General Inquiry', 'Product Query', 'Govt Subsidy Assistance', '0% EMI Financing', 'Field Demo Request', 'Bulk Purchase / Dealer'],
    default: 'General Inquiry'
  },
  farmType: { type: String, default: '' },
  acres: { type: Number, default: 0 },
  state: { type: String, default: '' },
  district: { type: String, default: '' },
  message: { type: String, default: '' },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'In Discussion', 'Closed', 'Spam'],
    default: 'New'
  },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('ContactRequest', contactRequestSchema);
