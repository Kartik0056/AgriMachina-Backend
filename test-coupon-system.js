const mongoose = require('mongoose');
const env = require('./src/config/env');
const Coupon = require('./src/models/Coupon');

async function seedAndTestCoupons() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const defaultCoupons = [
      {
        code: 'KISAN1000',
        description: 'Flat ₹1,000 OFF on Heavy Duty Power Weeders & Tillers',
        discountType: 'FLAT',
        discountValue: 1000,
        minOrderAmount: 25000,
        maxUsageLimit: 500,
        usedCount: 142,
        validUntil: new Date('2026-12-31'),
        isActive: true
      },
      {
        code: 'SOLAR5',
        description: '5% Instant Subsidy on Solar Submersible Pump Sets',
        discountType: 'PERCENT',
        discountValue: 5,
        minOrderAmount: 40000,
        maxDiscountAmount: 5000,
        maxUsageLimit: 200,
        usedCount: 68,
        validUntil: new Date('2026-11-30'),
        isActive: true
      },
      {
        code: 'AGRIFIRST',
        description: 'Flat ₹500 Welcome Discount for New Farmer Registrations',
        discountType: 'FLAT',
        discountValue: 500,
        minOrderAmount: 3000,
        maxUsageLimit: 1000,
        usedCount: 420,
        validUntil: new Date('2026-12-31'),
        isActive: true
      }
    ];

    for (const c of defaultCoupons) {
      const existing = await Coupon.findOne({ code: c.code });
      if (!existing) {
        await Coupon.create(c);
        console.log(`✅ Seeded Coupon: ${c.code}`);
      } else {
        console.log(`ℹ️ Coupon ${c.code} already exists in DB.`);
      }
    }

    const allCoupons = await Coupon.find();
    console.log(`\n🎉 Total Coupons in Database: ${allCoupons.length}`);
    allCoupons.forEach(cp => {
      console.log(`- ${cp.code} [${cp.discountType}: ${cp.discountValue}] (Active: ${cp.isActive})`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

seedAndTestCoupons();
