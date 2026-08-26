const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/agricultural_ecom';

async function cleanTestOrders() {
  try {
    await mongoose.connect(MONGO_URI);
    const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));

    const testOrdersToDelete = ['AG-286082-841', 'AG-724461-932'];
    const result = await Order.deleteMany({ orderNumber: { $in: testOrdersToDelete } });

    console.log(`\n================================================================`);
    console.log(`🗑️ Successfully Removed Test Orders: ${result.deletedCount}`);
    console.log(`================================================================\n`);

    const remainingOrders = await Order.find({}).sort({ createdAt: -1 }).lean();
    console.log(`CURRENT REAL ORDERS IN SYSTEM (${remainingOrders.length}):`);
    remainingOrders.forEach((o, idx) => {
      console.log(`${idx + 1}. Order #${o.orderNumber}`);
      console.log(`   Customer: ${o.shippingAddress?.fullName} (${o.shippingAddress?.phone})`);
      console.log(`   Payment Method: ${o.payment?.method}`);
      if (o.payment?.emiDetails?.isEmi) {
        console.log(`   EMI Plan: ₹${o.payment?.emiDetails?.monthlyEmi}/month for ${o.payment?.emiDetails?.tenureMonths} Months`);
      }
      console.log(`   Order Status: ${o.orderStatus}`);
      console.log(`   Placed At: ${o.createdAt}`);
      console.log('----------------------------------------------------');
    });

  } catch (err) {
    console.error('Error cleaning test orders:', err);
  } finally {
    await mongoose.disconnect();
  }
}

cleanTestOrders();
