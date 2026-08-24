const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const { getRolesAndPermissions, createAdminUser, toggleAdminActive } = require('../controllers/adminRoleController');
const { requireAdminAuth } = require('../middleware/adminAuth');
const { requireRole } = require('../middleware/checkPermission');

router.use(requireAdminAuth);

router.get('/', requireRole(['SUPER_ADMIN', 'ADMIN']), getRolesAndPermissions);

router.get('/admins', requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const admins = await Admin.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, admins });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/permissions', requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ module: 1, name: 1 });
    return res.status(200).json({ success: true, permissions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/admins', requireRole(['SUPER_ADMIN', 'ADMIN']), createAdminUser);
router.post('/users', requireRole(['SUPER_ADMIN', 'ADMIN']), createAdminUser);
router.put('/admins/:id/toggle-active', requireRole(['SUPER_ADMIN', 'ADMIN']), toggleAdminActive);
router.put('/users/:id/toggle-active', requireRole(['SUPER_ADMIN', 'ADMIN']), toggleAdminActive);

module.exports = router;
