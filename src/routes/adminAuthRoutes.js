const express = require('express');
const router = express.Router();
const { login, logout, getProfile } = require('../controllers/adminAuthController');
const { requireAdminAuth } = require('../middleware/adminAuth');
const { adminLoginLimiter } = require('../middleware/rateLimiter');

router.post('/login', adminLoginLimiter, login);
router.post('/logout', requireAdminAuth, logout);
router.get('/me', requireAdminAuth, getProfile);

module.exports = router;
