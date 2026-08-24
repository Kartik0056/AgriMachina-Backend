const AdminAuditLog = require('../models/AdminAuditLog');

const logAuditAction = async ({ admin, action, resource, resourceId = '', details = {}, req = null }) => {
  try {
    let ip = '';
    let userAgent = '';

    if (req) {
      ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '';
      userAgent = req.headers['user-agent'] || '';
    }

    const auditEntry = new AdminAuditLog({
      admin: admin?._id || admin?.id || null,
      adminName: admin?.name || admin?.username || 'System',
      adminEmail: admin?.email || '',
      action,
      resource,
      resourceId: String(resourceId),
      details,
      ip,
      userAgent,
      timestamp: new Date()
    });

    await auditEntry.save();
    return auditEntry;
  } catch (error) {
    console.error(`[Audit Log Error] Failed to write audit entry: ${error.message}`);
  }
};

module.exports = {
  logAuditAction
};
