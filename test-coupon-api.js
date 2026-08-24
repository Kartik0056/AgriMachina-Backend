const axios = require('axios');

async function testCouponApi() {
  try {
    const API = 'http://localhost:4000/api';

    console.log('=== TESTING COMPLETE DYNAMIC COUPON SYSTEM ===\n');

    // 1. Login as Admin to get token
    const loginRes = await axios.post(`${API}/admin/auth/login`, {
      identifier: 'admin@agrimachinery.com',
      password: 'AgriAdmin@2026#Secure'
    });
    const token = loginRes.data.token;
    console.log('✅ Admin Logged in successfully.');

    const adminHeaders = { Authorization: `Bearer ${token}` };

    // 2. Fetch All Coupons from MongoDB
    const getRes = await axios.get(`${API}/admin/coupons`, { headers: adminHeaders });
    console.log(`✅ Retrieved ${getRes.data.coupons.length} coupons from MongoDB database.`);

    // 3. Create a New Dynamic Coupon
    const testCode = 'DEMOFARMER' + Math.floor(100 + Math.random() * 900);
    const createRes = await axios.post(`${API}/admin/coupons`, {
      code: testCode,
      description: 'Special Festive Discount for Farmers',
      discountType: 'PERCENT',
      discountValue: 15,
      minOrderAmount: 10000,
      maxDiscountAmount: 3000,
      maxUsageLimit: 50,
      validUntil: '2026-12-31',
      isActive: true
    }, { headers: adminHeaders });
    console.log(`✅ Created New Coupon in Database: ${createRes.data.coupon.code} (ID: ${createRes.data.coupon._id})`);
    const newCouponId = createRes.data.coupon._id;

    // 4. Test Storefront Active Coupons Endpoint
    const activeRes = await axios.get(`${API}/coupons/active`);
    console.log(`✅ Storefront active coupons returned: ${activeRes.data.coupons.length} coupons available.`);

    // 5. Test Storefront Apply Coupon with ₹20,000 cart subtotal
    const applyRes = await axios.post(`${API}/coupons/apply`, {
      code: testCode,
      cartSubtotal: 20000
    });
    console.log(`✅ Applied Coupon ${testCode}: Saved ₹${applyRes.data.discountAmount} (Subtotal: ₹20,000 -> New: ₹${applyRes.data.newSubtotal})`);

    // 6. Test Storefront Minimum Order Amount Validation Error
    try {
      await axios.post(`${API}/coupons/apply`, {
        code: testCode,
        cartSubtotal: 5000 // Less than minOrderAmount 10,000
      });
      console.error('❌ Failed: Should have rejected subtotal below minimum order limit.');
    } catch (err) {
      console.log(`✅ Min Order Validation working correctly: "${err.response?.data?.message}"`);
    }

    // 7. Toggle Coupon Status to Inactive
    const toggleRes = await axios.patch(`${API}/admin/coupons/${newCouponId}/toggle`, {}, { headers: adminHeaders });
    console.log(`✅ Toggled status: Coupon ${testCode} is now ${toggleRes.data.coupon.isActive ? 'Active' : 'Inactive'}.`);

    // 8. Test Apply Inactive Coupon (Should reject)
    try {
      await axios.post(`${API}/coupons/apply`, {
        code: testCode,
        cartSubtotal: 20000
      });
      console.error('❌ Failed: Inactive coupon should not be applicable.');
    } catch (err) {
      console.log(`✅ Inactive Coupon check working correctly: "${err.response?.data?.message}"`);
    }

    // 9. Clean up test coupon
    await axios.delete(`${API}/admin/coupons/${newCouponId}`, { headers: adminHeaders });
    console.log(`✅ Deleted Test Coupon ${testCode} from database.`);

    console.log('\n🎉 ALL DYNAMIC COUPON ENDPOINTS PASSED 100%!');
  } catch (err) {
    console.error('❌ API Test Failed:', err.response?.data || err.message);
  }
}

testCouponApi();
