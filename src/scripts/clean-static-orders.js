const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Order = require('../models/Order');
const InventoryLog = require('../models/InventoryLog');

const cleanStaticOrders = async () => {
  try {
    await connectDB();
    console.log('[Cleanup] Connecting to MongoDB...');

    // Delete all existing static / mock orders
    const deletedOrders = await Order.deleteMany({});
    console.log(`[Cleanup] Successfully removed ${deletedOrders.deletedCount} static/mock orders.`);

    // Also clear inventory order logs that referenced removed orders
    const deletedLogs = await InventoryLog.deleteMany({ reason: { $regex: /Order #/i } });
    console.log(`[Cleanup] Successfully cleaned ${deletedLogs.deletedCount} order inventory logs.`);

    console.log('[Cleanup] Database is now 100% clean. Only real user orders created from now on will appear.');
    process.exit(0);
  } catch (error) {
    console.error('[Cleanup Error]', error.message);
    process.exit(1);
  }
};

cleanStaticOrders();
