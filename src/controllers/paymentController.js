const { createRazorpayOrder, verifyPaymentSignature, getComprehensiveEMIPlans } = require('../services/razorpayService');
const Order = require('../models/Order');
const { logAuditAction } = require('../services/auditService');

/**
 * @desc Create Razorpay Order
 * @route POST /api/payment/razorpay/create-order
 * @access Public / Authenticated
 */
async function createRazorpayOrderHandler(req, res, next) {
  try {
    const { amount, localOrderId, customerName, customerEmail, customerPhone } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount.' });
    }

    const receipt = localOrderId ? `rcpt_${localOrderId.slice(-8)}` : `rcpt_${Date.now()}`;
    const notes = {
      localOrderId: localOrderId || '',
      customerName: customerName || '',
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || ''
    };

    const razorpayOrder = await createRazorpayOrder(amount, receipt, notes);

    res.json({
      success: true,
      razorpayOrder
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc Verify Razorpay payment signature and mark Order as Paid
 * @route POST /api/payment/razorpay/verify-payment
 * @access Public / Authenticated
 */
async function verifyRazorpayPaymentHandler(req, res, next) {
  try {
    const {
      localOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentMethod = 'Online'
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Razorpay payment signature parameters.'
      });
    }

    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Razorpay payment signature. Payment verification failed.'
      });
    }

    // Update local Order if provided
    let updatedOrder = null;
    if (localOrderId) {
      updatedOrder = await Order.findById(localOrderId);
      if (updatedOrder) {
        updatedOrder.payment.status = 'Paid';
        updatedOrder.payment.transactionId = razorpay_payment_id;
        updatedOrder.payment.method = paymentMethod;
        updatedOrder.orderStatus = 'Confirmed';
        await updatedOrder.save();

        if (req.user) {
          await logAuditAction(req.user._id, 'ORDER_PAYMENT_VERIFIED', 'Order', updatedOrder._id, {
            razorpay_payment_id,
            razorpay_order_id,
            amount: updatedOrder.pricing.grandTotal
          }, req.ip);
        }
      }
    }

    res.json({
      success: true,
      message: 'Razorpay payment verified successfully.',
      order: updatedOrder,
      paymentDetails: {
        razorpay_order_id,
        razorpay_payment_id
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc Get comprehensive Razorpay multi-bank EMI plans & No-Cost options
 * @route GET /api/payment/razorpay/emi-plans
 * @access Public
 */
async function getEMIPlansHandler(req, res, next) {
  try {
    const amount = Number(req.query.amount) || 39999;
    const downPayment = Number(req.query.downPayment) || 0;

    const emiPlans = getComprehensiveEMIPlans(amount, downPayment);

    res.json({
      success: true,
      emiPlans
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createRazorpayOrderHandler,
  verifyRazorpayPaymentHandler,
  getEMIPlansHandler
};
