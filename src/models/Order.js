const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  price: { type: Number, required: true },
  mrp: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: '' },
  gstPercent: { type: Number, default: 12 },
  gstAmount: { type: Number, default: 0 },
  subtotal: { type: Number, required: true }
}, { _id: true });

const statusUpdateSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'],
    required: true
  },
  note: { type: String, default: '' },
  updatedBy: { type: String, default: 'System' },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  items: [orderItemSchema],
  pricing: {
    subtotal: { type: Number, required: true },
    gstTotal: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    couponCode: { type: String, default: '' },
    grandTotal: { type: Number, required: true }
  },
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    villageCity: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  payment: {
    method: {
      type: String,
      enum: ['COD', 'UPI', 'NetBanking', 'Card', 'EMI', 'KisanCreditCard', 'Razorpay Online', 'Razorpay EMI', 'Razorpay'],
      default: 'COD'
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending'
    },
    transactionId: { type: String, default: '' },
    emiDetails: {
      isEmi: { type: Boolean, default: false },
      tenureMonths: { type: Number, default: 0 },
      monthlyEmi: { type: Number, default: 0 },
      interestRate: { type: Number, default: 0 },
      downPayment: { type: Number, default: 0 },
      financePartner: { type: String, default: '' }
    }
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'],
    default: 'Confirmed',
    index: true
  },
  tracking: {
    courierName: { type: String, default: 'AgriLogistics Express' },
    trackingNumber: { type: String, default: '' },
    estimatedDelivery: { type: String, default: '4-7 Days' },
    statusUpdates: [statusUpdateSchema]
  },
  deliveredAt: {
    type: Date
  },
  reviewedProductIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
