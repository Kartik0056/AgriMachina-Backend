const express = require('express');
const router = express.Router();
const {
  getAllReviews,
  moderateReview,
  approveReview,
  rejectReview,
  deleteReview
} = require('../controllers/adminReviewController');
const { requireAdminAuth } = require('../middleware/adminAuth');
const { sanitizeInput } = require('../middleware/sanitize');

router.use(requireAdminAuth);

router.get('/', getAllReviews);
router.put('/:id/moderate', sanitizeInput, moderateReview);
router.post('/:id/approve', sanitizeInput, approveReview);
router.post('/:id/reject', sanitizeInput, rejectReview);
router.delete('/:id', deleteReview);

module.exports = router;
