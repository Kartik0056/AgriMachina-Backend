const AdminAuditLog = require('../models/AdminAuditLog');

const getAuditLogs = async (req, res) => {
  try {
    const { action, resource, search, page = 1, limit = 30 } = req.query;
    const query = {};

    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { adminName: regex },
        { adminEmail: regex },
        { action: regex },
        { resource: regex },
        { resourceId: regex }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AdminAuditLog.countDocuments(query);
    const logs = await AdminAuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      logs
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAuditLogs
};
