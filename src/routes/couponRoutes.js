const express = require('express');
const router = express.Router();
const {
  getActiveCoupons,
  applyCoupon
} = require('../controllers/couponController');
const { sanitizeInput } = require('../middleware/sanitize');

// Public Storefront Endpoints
router.get('/active', getActiveCoupons);
router.post('/apply', sanitizeInput, applyCoupon);
router.post('/validate', sanitizeInput, applyCoupon);

module.exports = router;
