const express = require('express');
const router = express.Router();
const {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus
} = require('../controllers/couponController');
const { requireAdminAuth } = require('../middleware/adminAuth');
const { sanitizeInput } = require('../middleware/sanitize');

router.use(requireAdminAuth);

router.get('/', getAllCoupons);
router.post('/', sanitizeInput, createCoupon);
router.put('/:id', sanitizeInput, updateCoupon);
router.delete('/:id', deleteCoupon);
router.patch('/:id/toggle', toggleCouponStatus);

module.exports = router;
