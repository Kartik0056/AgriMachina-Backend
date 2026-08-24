const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const env = require('../config/env');
const { DEFAULT_ROLES, ALL_PERMISSIONS, PERMISSIONS } = require('../config/constants');

const bootstrapAdminSystem = async () => {
  try {
    // 1. Seed Permissions if not existing
    const existingPermsCount = await Permission.countDocuments();
    if (existingPermsCount === 0) {
      const permissionDocs = Object.keys(PERMISSIONS).map(key => ({
        code: PERMISSIONS[key],
        name: key.replace(/_/g, ' '),
        module: key.split('_')[0],
        description: `Allows administrative ${key.replace(/_/g, ' ').toLowerCase()}`
      }));
      await Permission.insertMany(permissionDocs);
      console.log(`[Bootstrap] Seeded ${permissionDocs.length} granular permissions.`);
    }

    // 2. Seed Default Roles if not existing
    const existingRolesCount = await Role.countDocuments();
    if (existingRolesCount === 0) {
      const roleDocs = Object.values(DEFAULT_ROLES).map(r => ({
        name: r.name,
        description: r.description,
        permissions: r.permissions,
        isSystem: true
      }));
      await Role.insertMany(roleDocs);
      console.log(`[Bootstrap] Seeded ${roleDocs.length} default RBAC roles.`);
    }

    // 3. First-Run Admin Account Check
    const adminCount = await Admin.countDocuments();

    if (adminCount === 0) {
      // Create initial Super Admin account from environment variables
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, salt);

      const initialAdmin = new Admin({
        name: env.ADMIN_NAME,
        username: env.ADMIN_USERNAME.toLowerCase().trim(),
        email: env.ADMIN_EMAIL.toLowerCase().trim(),
        passwordHash: passwordHash,
        role: 'SUPER_ADMIN',
        permissions: ALL_PERMISSIONS,
        isActive: true
      });

      await initialAdmin.save();
      console.log(`[Bootstrap] Created initial SUPER_ADMIN account: ${initialAdmin.email} (Username: ${initialAdmin.username})`);
    } else {
      console.log('INITIAL ADMIN CHECK COMPLETE');
    }
  } catch (error) {
    console.error(`[Bootstrap Error] ${error.message}`);
  }
};

module.exports = bootstrapAdminSystem;
