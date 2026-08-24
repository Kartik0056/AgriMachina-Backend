const rateLimit = require('express-rate-limit');

// Strict rate limiter for Admin Login to protect against brute-force attacks
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // Max 10 attempts per IP
  message: {
    success: false,
    message: 'Too many admin login attempts from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for Review submissions
const reviewSubmitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    message: 'Too many review requests submitted. Please slow down.'
  }
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.'
  }
});

module.exports = {
  adminLoginLimiter,
  reviewSubmitLimiter,
  apiLimiter
};
