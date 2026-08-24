const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Admin = require('../models/Admin');
const AdminSession = require('../models/AdminSession');
const { logAuditAction } = require('../services/auditService');
const env = require('../config/env');

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/Email and Password are required.'
      });
    }

    const cleanIdentifier = identifier.toLowerCase().trim();

    // Query admin with passwordHash included
    const admin = await Admin.findOne({
      $or: [{ email: cleanIdentifier }, { username: cleanIdentifier }]
    }).select('+passwordHash');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials.'
      });
    }

    // Check if account is locked
    if (admin.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to excessive failed attempts. Please try again later.'
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Admin account has been deactivated. Contact the Super Administrator.'
      });
    }

    // Verify Password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;
      if (admin.failedLoginAttempts >= 5) {
        admin.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
      }
      await admin.save();

      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials.'
      });
    }

    // Reset failed attempts on success
    admin.failedLoginAttempts = 0;
    admin.lockUntil = undefined;
    admin.lastLoginAt = new Date();
    admin.lastLoginIP = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '';
    await admin.save();

    // Create Admin Session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const session = new AdminSession({
      adminId: admin._id,
      tokenHash,
      ipAddress: admin.lastLoginIP,
      userAgent: req.headers['user-agent'] || '',
      expiresAt,
      isValid: true
    });
    await session.save();

    // Issue JWT Token
    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
        sessionId: session._id
      },
      env.ADMIN_JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set Secure HttpOnly Cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    // Record Audit Log
    await logAuditAction({
      admin,
      action: 'ADMIN_LOGIN',
      resource: 'Auth',
      resourceId: admin._id,
      details: { username: admin.username, email: admin.email, role: admin.role },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: admin.toJSON(),
      adminPanelPath: env.ADMIN_PANEL_PATH
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Login error: ${error.message}`
    });
  }
};

const logout = async (req, res) => {
  try {
    if (req.adminSession) {
      req.adminSession.isValid = false;
      await req.adminSession.save();
    }

    res.clearCookie('admin_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production'
    });

    if (req.admin) {
      await logAuditAction({
        admin: req.admin,
        action: 'ADMIN_LOGOUT',
        resource: 'Auth',
        resourceId: req.admin._id,
        req
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Admin logged out successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Logout error: ${error.message}`
    });
  }
};

const getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      admin: req.admin.toJSON(),
      adminPanelPath: env.ADMIN_PANEL_PATH
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  login,
  logout,
  getProfile
};
