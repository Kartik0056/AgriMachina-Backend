const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getProductReviews,
  checkReviewEligibility,
  submitVerifiedReview,
  updateMyReview,
  deleteMyReview
} = require('../controllers/reviewController');
const { requireUserAuth } = require('../middleware/auth');
const { reviewSubmitLimiter } = require('../middleware/rateLimiter');
const { sanitizeInput } = require('../middleware/sanitize');

// Collection routes
router.get('/', getProductReviews);
router.get('/eligibility', requireUserAuth, checkReviewEligibility);
router.post('/', requireUserAuth, reviewSubmitLimiter, sanitizeInput, submitVerifiedReview);

// Specific review update and delete
router.put('/:id', requireUserAuth, sanitizeInput, updateMyReview);
router.delete('/:id', requireUserAuth, deleteMyReview);

// Product param merged routes
router.get('/:productId', getProductReviews);
router.get('/:productId/reviews', getProductReviews);
router.get('/:productId/review-eligibility', requireUserAuth, checkReviewEligibility);
router.post('/:productId', requireUserAuth, reviewSubmitLimiter, sanitizeInput, submitVerifiedReview);
router.post('/:productId/reviews', requireUserAuth, reviewSubmitLimiter, sanitizeInput, submitVerifiedReview);
router.put('/:productId/reviews/:id', requireUserAuth, sanitizeInput, updateMyReview);
router.delete('/:productId/reviews/:id', requireUserAuth, deleteMyReview);

module.exports = router;
