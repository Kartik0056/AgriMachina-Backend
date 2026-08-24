const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const AdminSession = require('../models/AdminSession');
const env = require('../config/env');

const requireAdminAuth = async (req, res, next) => {
  try {
    let token = null;

    // Check HttpOnly cookies first, then Authorization header
    if (req.cookies && req.cookies.admin_token) {
      token = req.cookies.admin_token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Admin authentication token required'
      });
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, env.ADMIN_JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid or expired admin session token'
      });
    }

    // Fetch Admin
    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Admin account does not exist or is disabled'
      });
    }

    // Check Session validity if sessionId provided
    if (decoded.sessionId) {
      const session = await AdminSession.findById(decoded.sessionId);
      if (!session || !session.isValid || session.expiresAt < new Date()) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Session expired or invalidated'
        });
      }
      req.adminSession = session;
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Authentication error: ${error.message}`
    });
  }
};

module.exports = {
  requireAdminAuth
};
