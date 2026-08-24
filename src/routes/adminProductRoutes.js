const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  togglePublish,
  uploadProductMedia,
  getProductAnalytics
} = require('../controllers/adminProductController');
const { requireAdminAuth } = require('../middleware/adminAuth');
const { requirePermission } = require('../middleware/checkPermission');
const { uploadMedia } = require('../middleware/upload');
const { sanitizeInput } = require('../middleware/sanitize');

router.use(requireAdminAuth);

router.get('/', requirePermission('PRODUCT_CREATE'), getProducts);
router.get('/:id', requirePermission('PRODUCT_CREATE'), getProductById);
router.get('/:id/analytics', requirePermission('PRODUCT_CREATE'), getProductAnalytics);

router.post('/', requirePermission('PRODUCT_CREATE'), sanitizeInput, createProduct);
router.put('/:id', requirePermission('PRODUCT_UPDATE'), sanitizeInput, updateProduct);
router.delete('/:id', requirePermission('PRODUCT_DELETE'), deleteProduct);

router.post('/:id/duplicate', requirePermission('PRODUCT_CREATE'), duplicateProduct);
router.post('/:id/publish', requirePermission('PRODUCT_UPDATE'), togglePublish);

router.post('/media/upload', requirePermission('PRODUCT_CREATE'), uploadMedia.array('files', 10), uploadProductMedia);

module.exports = router;
