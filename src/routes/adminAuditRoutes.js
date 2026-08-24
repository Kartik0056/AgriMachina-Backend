const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/adminAuditController');
const { requireAdminAuth } = require('../middleware/adminAuth');
const { requireRole } = require('../middleware/checkPermission');

router.use(requireAdminAuth);
router.get('/', requireRole(['SUPER_ADMIN', 'ADMIN']), getAuditLogs);

module.exports = router;
