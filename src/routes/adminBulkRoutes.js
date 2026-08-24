const express = require('express');
const router = express.Router();
const {
  downloadStarterTemplate,
  parseAndValidateBulkImport,
  executeBulkImport,
  bulkUpdateProducts,
  bulkImageMapUpload
} = require('../controllers/adminBulkController');
const { requireAdminAuth } = require('../middleware/adminAuth');
const { requirePermission } = require('../middleware/checkPermission');
const { uploadSpreadsheet, uploadZipArchive } = require('../middleware/upload');

router.use(requireAdminAuth);

router.get('/template', requirePermission('PRODUCT_IMPORT'), downloadStarterTemplate);
router.post('/validate', requirePermission('PRODUCT_IMPORT'), uploadSpreadsheet.single('file'), parseAndValidateBulkImport);
router.post('/execute', requirePermission('PRODUCT_IMPORT'), executeBulkImport);
router.post('/bulk-update', requirePermission('PRODUCT_UPDATE'), bulkUpdateProducts);
router.post('/map-images', requirePermission('PRODUCT_IMPORT'), uploadZipArchive.single('zipFile'), bulkImageMapUpload);

module.exports = router;
