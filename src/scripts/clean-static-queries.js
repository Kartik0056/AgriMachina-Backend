const mongoose = require('mongoose');
const connectDB = require('../config/db');
const SupportTicket = require('../models/SupportTicket');
const ContactRequest = require('../models/ContactRequest');
const Order = require('../models/Order');
const InventoryLog = require('../models/InventoryLog');

const cleanAllStaticData = async () => {
  try {
    await connectDB();
    console.log('[Cleanup] Connected to MongoDB.');

    // 1. Delete all static / demo support tickets
    const deletedTickets = await SupportTicket.deleteMany({});
    console.log(`[Cleanup] Removed ${deletedTickets.deletedCount} static/mock support inquiry tickets.`);

    // 2. Delete all static / demo contact requests
    const deletedContacts = await ContactRequest.deleteMany({});
    console.log(`[Cleanup] Removed ${deletedContacts.deletedCount} static/mock contact requests.`);

    // 3. Ensure all orders collection is clean
    const deletedOrders = await Order.deleteMany({});
    console.log(`[Cleanup] Removed ${deletedOrders.deletedCount} static/mock orders.`);

    // 4. Clean stale order inventory logs
    const deletedLogs = await InventoryLog.deleteMany({ reason: { $regex: /Order #/i } });
    console.log(`[Cleanup] Removed ${deletedLogs.deletedCount} order inventory logs.`);

    console.log('\n[Cleanup] SUCCESS: All static inquiries and orders have been removed from the database!');
    console.log('[Cleanup] From now on, ONLY real inquiries and real orders submitted by users will appear in the Admin Panel and User Dashboard.');
    process.exit(0);
  } catch (error) {
    console.error('[Cleanup Error]', error.message);
    process.exit(1);
  }
};

cleanAllStaticData();
