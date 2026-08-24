const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminDashboardController');
const { requireAdminAuth } = require('../middleware/adminAuth');

router.use(requireAdminAuth);
router.get('/stats', getDashboardStats);

module.exports = router;
