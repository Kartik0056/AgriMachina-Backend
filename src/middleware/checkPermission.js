const requirePermission = (requiredPermissions) => {
  const permsArray = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Admin authentication required'
      });
    }

    // Super Admin has unrestricted access to everything
    if (req.admin.role === 'SUPER_ADMIN') {
      return next();
    }

    const adminPermissions = req.admin.permissions || [];
    const hasAll = permsArray.every(p => adminPermissions.includes(p));

    if (!hasAll) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Missing required permission(s): [${permsArray.join(', ')}]`
      });
    }

    next();
  };
};

const requireRole = (allowedRoles) => {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Admin authentication required'
      });
    }

    if (req.admin.role === 'SUPER_ADMIN' || rolesArray.includes(req.admin.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden: This action requires role: [${rolesArray.join(', ')}]`
    });
  };
};

module.exports = {
  requirePermission,
  requireRole
};
