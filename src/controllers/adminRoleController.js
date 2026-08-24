const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const { logAuditAction } = require('../services/auditService');

const getRolesAndPermissions = async (req, res) => {
  try {
    const [roles, permissions, admins] = await Promise.all([
      Role.find().sort({ name: 1 }),
      Permission.find().sort({ module: 1, name: 1 }),
      Admin.find().sort({ createdAt: -1 })
    ]);

    return res.status(200).json({
      success: true,
      roles,
      permissions,
      admins
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createAdminUser = async (req, res) => {
  try {
    const { name, username, email, password, role, permissions } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, username, email, and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim();

    const existing = await Admin.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }]
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'An admin with this email or username already exists.' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // If role has default permissions and none passed, assign role permissions
    let finalPermissions = permissions;
    if (!finalPermissions || finalPermissions.length === 0) {
      const roleDoc = await Role.findOne({ name: role || 'ADMIN' });
      finalPermissions = roleDoc ? roleDoc.permissions : [];
    }

    const newAdmin = new Admin({
      name,
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      role: role || 'ADMIN',
      permissions: finalPermissions,
      isActive: true
    });

    await newAdmin.save();

    await logAuditAction({
      admin: req.admin,
      action: 'ADMIN_CREATED',
      resource: 'Admin',
      resourceId: newAdmin._id,
      details: { username: newAdmin.username, email: newAdmin.email, role: newAdmin.role },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'New admin account created successfully.',
      admin: newAdmin.toJSON()
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const toggleAdminActive = async (req, res) => {
  try {
    const targetAdmin = await Admin.findById(req.params.id);
    if (!targetAdmin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }

    // Protect Super Admin from deactivating own self
    if (String(targetAdmin._id) === String(req.admin._id)) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own active session account.' });
    }

    targetAdmin.isActive = !targetAdmin.isActive;
    await targetAdmin.save();

    await logAuditAction({
      admin: req.admin,
      action: targetAdmin.isActive ? 'ADMIN_ACTIVATED' : 'ADMIN_DEACTIVATED',
      resource: 'Admin',
      resourceId: targetAdmin._id,
      details: { username: targetAdmin.username, isActive: targetAdmin.isActive },
      req
    });

    return res.status(200).json({
      success: true,
      message: `Admin ${targetAdmin.username} is now ${targetAdmin.isActive ? 'Active' : 'Deactivated'}.`,
      admin: targetAdmin.toJSON()
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRolesAndPermissions,
  createAdminUser,
  toggleAdminActive
};
