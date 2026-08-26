const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/agricultural_ecom';

async function fixAuditTimestamps() {
  try {
    await mongoose.connect(MONGO_URI);
    const AdminAuditLog = mongoose.model('AdminAuditLog', new mongoose.Schema({}, { strict: false }));

    const logs = await AdminAuditLog.find({}).sort({ timestamp: -1, createdAt: -1 }).lean();
    console.log(`\n================================================================`);
    console.log(`🔍 AUDIT LOGS IN DATABASE: ${logs.length} Total Records`);
    console.log(`================================================================\n`);

    let updatedCount = 0;
    for (const log of logs) {
      const validDate = log.timestamp || log.createdAt || new Date();
      const updatePayload = {};

      if (!log.createdAt) {
        updatePayload.createdAt = validDate;
      }
      if (!log.timestamp) {
        updatePayload.timestamp = validDate;
      }
      if (!log.updatedAt) {
        updatePayload.updatedAt = validDate;
      }

      if (Object.keys(updatePayload).length > 0) {
        await AdminAuditLog.updateOne({ _id: log._id }, { $set: updatePayload });
        updatedCount++;
      }

      console.log(`• [${log.action}] User: ${log.adminName || 'Super Admin'} | Resource: ${log.resource || 'Admin'} | Timestamp: ${new Date(validDate).toLocaleString('en-IN')}`);
    }

    console.log(`\n✅ Successfully synced and validated ${updatedCount} audit log records!`);
    console.log(`================================================================\n`);

  } catch (err) {
    console.error('Error fixing audit timestamps:', err);
  } finally {
    await mongoose.disconnect();
  }
}

fixAuditTimestamps();
