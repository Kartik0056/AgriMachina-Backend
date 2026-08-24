const express = require('express');
const router = express.Router();
const {
  createRazorpayOrderHandler,
  verifyRazorpayPaymentHandler,
  getEMIPlansHandler
} = require('../controllers/paymentController');

// Public / Authenticated Razorpay endpoints
router.post('/razorpay/create-order', createRazorpayOrderHandler);
router.post('/razorpay/verify-payment', verifyRazorpayPaymentHandler);
router.get('/razorpay/emi-plans', getEMIPlansHandler);

module.exports = router;
