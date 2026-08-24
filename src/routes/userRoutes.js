const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  logout
} = require('../controllers/userAuthController');
const { requireUserAuth } = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/sanitize');

// Auth routes
router.post('/register', sanitizeInput, register);
router.post('/login', sanitizeInput, login);
router.post('/logout', logout);
router.post('/forgot-password', sanitizeInput, forgotPassword);
router.post('/reset-password', sanitizeInput, resetPassword);

// Profile management
router.get('/me', requireUserAuth, getProfile);
router.put('/profile', requireUserAuth, sanitizeInput, updateProfile);
router.put('/change-password', requireUserAuth, sanitizeInput, changePassword);

// Multiple Saved Delivery Addresses
router.post('/addresses', requireUserAuth, sanitizeInput, addAddress);
router.put('/addresses/:addressId', requireUserAuth, sanitizeInput, updateAddress);
router.delete('/addresses/:addressId', requireUserAuth, deleteAddress);
router.put('/addresses/:addressId/default', requireUserAuth, setDefaultAddress);

module.exports = router;
