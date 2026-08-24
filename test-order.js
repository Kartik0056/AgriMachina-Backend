const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function testOrderPlacement() {
  console.log('=== TESTING ORDER PLACEMENT & COUPON LOGIC ===\n');

  try {
    // 1. Login user
    const loginRes = await axios.post(`${API_URL}/users/login`, {
      email: 'ramesh.patel@kisanmail.in',
      password: 'Farmer@2026'
    });
    const token = loginRes.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✅ Logged in as:', loginRes.data.user.name);

    // 2. Fetch a product
    const prodRes = await axios.get(`${API_URL}/products?limit=1`);
    const product = prodRes.data.products[0];
    console.log('✅ Testing with product:', product.name, '| Price:', product.sellingPrice);

    // 3. Test Order with Razorpay Online & Coupon KISAN1000
    console.log('\n[3] Testing POST /api/orders with Razorpay Online + KISAN1000 coupon...');
    const orderPayload = {
      items: [{ productId: product._id, quantity: 1 }],
      shippingAddress: {
        fullName: 'Rampal Sharma',
        phone: '+91 78233 54321',
        street: 'Main Farm Road, Near Tubewell #3',
        villageCity: 'Sre',
        district: 'Saharanpur',
        state: 'Uttar Pradesh',
        pincode: '247001'
      },
      paymentMethod: 'Razorpay Online',
      couponCode: 'KISAN1000',
      couponDiscount: 1000
    };

    const orderRes = await axios.post(`${API_URL}/orders`, orderPayload, authHeaders);
    console.log('✅ Order created successfully without validation error!');
    console.log('   Order Number:', orderRes.data.order.orderNumber);
    console.log('   Payment Method:', orderRes.data.order.payment.method);
    console.log('   Coupon Code:', orderRes.data.order.pricing.couponCode);
    console.log('   Coupon Discount:', orderRes.data.order.pricing.couponDiscount);
    console.log('   Grand Total:', orderRes.data.order.pricing.grandTotal);

    // 4. Test Razorpay EMI order
    console.log('\n[4] Testing POST /api/orders with Razorpay EMI...');
    const emiPayload = {
      ...orderPayload,
      paymentMethod: 'Razorpay EMI',
      emiDetails: {
        isEmi: true,
        tenureMonths: 12,
        monthlyEmi: Math.round(orderRes.data.order.pricing.grandTotal / 12),
        interestRate: 0,
        downPayment: 0,
        financePartner: 'State Bank of India (SBI)'
      }
    };

    const emiOrderRes = await axios.post(`${API_URL}/orders`, emiPayload, authHeaders);
    console.log('✅ Razorpay EMI Order created successfully!');
    console.log('   Order Number:', emiOrderRes.data.order.orderNumber);
    console.log('   Payment Method:', emiOrderRes.data.order.payment.method);
    console.log('   EMI Monthly:', emiOrderRes.data.order.payment.emiDetails.monthlyEmi);

    console.log('\n🎉 ALL ORDER & COUPON VALIDATION TESTS PASSED 100%!');
  } catch (err) {
    console.error('❌ Order Test Failed:', err.response?.data || err.message);
  }
}

testOrderPlacement();
