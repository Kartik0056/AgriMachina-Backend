const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  senderName: {
    type: String,
    default: ''
  },
  text: {
    type: String,
    default: ''
  },
  images: [{
    type: String
  }],
  attachments: [{
    url: String,
    name: String,
    size: Number,
    fileType: String
  }],
  videoUrl: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    default: ''
  },
  userPhone: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  productTitle: {
    type: String,
    default: ''
  },
  productSku: {
    type: String,
    default: ''
  },
  inquiryType: {
    type: String,
    default: 'General Support'
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open',
    index: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  unreadByUser: {
    type: Number,
    default: 0
  },
  unreadByAdmin: {
    type: Number,
    default: 1
  },
  messages: [messageSchema],
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

supportTicketSchema.pre('save', function (next) {
  if (!this.ticketNumber) {
    this.ticketNumber = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
  }
  next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
