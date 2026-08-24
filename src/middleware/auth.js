const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

const requireUserAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.user_token) {
      token = req.cookies.user_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid token.'
      });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or deactivated.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Authentication error: ${error.message}`
    });
  }
};

const optionalUserAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.user_token) {
      token = req.cookies.user_token;
    }

    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (err) {
    // Ignore invalid token in optional auth
  }
  next();
};

module.exports = {
  requireUserAuth,
  optionalUserAuth
};
