const express = require('express');
const router = express.Router();
const {
  getAdminSlides,
  createSlide,
  updateSlide,
  deleteSlide,
  reorderSlides
} = require('../controllers/adminBannerController');
const { requireAdminAuth } = require('../middleware/adminAuth');
const { requirePermission } = require('../middleware/checkPermission');
const { sanitizeInput } = require('../middleware/sanitize');

router.use(requireAdminAuth);

router.get('/', getAdminSlides);
router.post('/', requirePermission('PRODUCT_CREATE'), sanitizeInput, createSlide);
router.put('/reorder', requirePermission('PRODUCT_CREATE'), reorderSlides);
router.put('/:id', requirePermission('PRODUCT_CREATE'), sanitizeInput, updateSlide);
router.delete('/:id', requirePermission('PRODUCT_DELETE'), deleteSlide);

module.exports = router;
