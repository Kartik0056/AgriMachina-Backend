const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

const runTest = async () => {
  try {
    console.log('====================================================');
    console.log('🌱 Testing User-Specific Dynamic Order Isolation 🌱');
    console.log('====================================================\n');

    // 1. Fetch available products to use for placing an order
    console.log('[1] Fetching published products...');
    const productsRes = await axios.get(`${API_BASE}/products`);
    const products = productsRes.data.products;
    if (!products || products.length === 0) {
      throw new Error('No products found in DB.');
    }
    const targetProduct1 = products[0];
    const targetProduct2 = products.length > 1 ? products[1] : products[0];
    console.log(`   Product 1: ${targetProduct1.name} (₹${targetProduct1.sellingPrice})`);
    console.log(`   Product 2: ${targetProduct2.name} (₹${targetProduct2.sellingPrice})\n`);

    // 2. Login User 1 (Ramesh Patel)
    console.log('[2] Logging in User 1 (Ramesh Patel)...');
    const user1LoginRes = await axios.post(`${API_BASE}/users/login`, {
      email: 'ramesh.patel@kisanmail.in',
      password: 'Farmer@2026'
    });
    const user1Token = user1LoginRes.data.token;
    const user1Headers = { headers: { Authorization: `Bearer ${user1Token}` } };
    console.log(`   User 1 Token obtained. Name: ${user1LoginRes.data.user.name}`);

    // 3. Login User 2 (Gurpreet Singh)
    console.log('[3] Logging in User 2 (Gurpreet Singh)...');
    const user2LoginRes = await axios.post(`${API_BASE}/users/login`, {
      email: 'gurpreet.singh@kisanmail.in',
      password: 'Farmer@2026'
    });
    const user2Token = user2LoginRes.data.token;
    const user2Headers = { headers: { Authorization: `Bearer ${user2Token}` } };
    console.log(`   User 2 Token obtained. Name: ${user2LoginRes.data.user.name}\n`);

    // 4. Check initial order counts (should be 0)
    console.log('[4] Checking initial orders for User 1 and User 2...');
    const user1InitialOrders = await axios.get(`${API_BASE}/orders/my-orders`, user1Headers);
    const user2InitialOrders = await axios.get(`${API_BASE}/orders/my-orders`, user2Headers);
    console.log(`   User 1 Orders count: ${user1InitialOrders.data.orders.length} (Expected: 0)`);
    console.log(`   User 2 Orders count: ${user2InitialOrders.data.orders.length} (Expected: 0)\n`);

    // 5. User 1 places an order for Product 1
    console.log('[5] User 1 (Ramesh Patel) placing Order 1...');
    const order1Payload = {
      items: [{ productId: targetProduct1._id, quantity: 1 }],
      shippingAddress: {
        fullName: 'Ramesh Patel',
        phone: '+91 98765 43210',
        street: 'Farm Plot #14, Gondal Highway',
        villageCity: 'Gondal',
        district: 'Rajkot',
        state: 'Gujarat',
        pincode: '360001'
      },
      paymentMethod: 'COD'
    };
    const order1Res = await axios.post(`${API_BASE}/orders`, order1Payload, user1Headers);
    const order1 = order1Res.data.order;
    console.log(`   ✅ Order 1 Created: #${order1.orderNumber} for User: ${order1.customerName} (ID: ${order1._id})\n`);

    // 6. User 2 places an order for Product 2
    console.log('[6] User 2 (Gurpreet Singh) placing Order 2...');
    const order2Payload = {
      items: [{ productId: targetProduct2._id, quantity: 2 }],
      shippingAddress: {
        fullName: 'Gurpreet Singh',
        phone: '+91 98123 45678',
        street: 'Kisan Basti, Samrala Road',
        villageCity: 'Samrala',
        district: 'Ludhiana',
        state: 'Punjab',
        pincode: '141001'
      },
      paymentMethod: 'Razorpay Online'
    };
    const order2Res = await axios.post(`${API_BASE}/orders`, order2Payload, user2Headers);
    const order2 = order2Res.data.order;
    console.log(`   ✅ Order 2 Created: #${order2.orderNumber} for User: ${order2.customerName} (ID: ${order2._id})\n`);

    // 7. Verify Isolation: User 1 fetch my-orders
    console.log('[7] Verifying User 1 (Ramesh Patel) order list...');
    const user1OrdersRes = await axios.get(`${API_BASE}/orders/my-orders`, user1Headers);
    const user1Orders = user1OrdersRes.data.orders;
    console.log(`   User 1 sees ${user1Orders.length} order(s):`);
    user1Orders.forEach(o => console.log(`    - Order #${o.orderNumber} | Customer: ${o.customerName} | Item: ${o.items[0]?.name}`));

    if (user1Orders.some(o => o._id === order2._id)) {
      throw new Error('❌ ISOLATION FAILED: User 1 can see User 2\'s order!');
    }
    console.log('   ✅ PASS: User 1 cannot see User 2\'s order.\n');

    // 8. Verify Isolation: User 2 fetch my-orders
    console.log('[8] Verifying User 2 (Gurpreet Singh) order list...');
    const user2OrdersRes = await axios.get(`${API_BASE}/orders/my-orders`, user2Headers);
    const user2Orders = user2OrdersRes.data.orders;
    console.log(`   User 2 sees ${user2Orders.length} order(s):`);
    user2Orders.forEach(o => console.log(`    - Order #${o.orderNumber} | Customer: ${o.customerName} | Item: ${o.items[0]?.name}`));

    if (user2Orders.some(o => o._id === order1._id)) {
      throw new Error('❌ ISOLATION FAILED: User 2 can see User 1\'s order!');
    }
    console.log('   ✅ PASS: User 2 cannot see User 1\'s order.\n');

    // 9. Verify direct access protection: User 1 trying to access User 2's order detail by ID
    console.log('[9] Testing direct ID cross-user access security...');
    try {
      await axios.get(`${API_BASE}/orders/${order2._id}`, user1Headers);
      throw new Error('❌ SECURITY FAILED: User 1 was able to access User 2\'s order by ID!');
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log('   ✅ PASS: Direct access to another user\'s order was correctly blocked with 404 Not Found.\n');
      } else {
        throw err;
      }
    }

    // 10. Admin login and overview
    console.log('[10] Admin Login and verification...');
    const adminLoginRes = await axios.post(`${API_BASE}/admin/auth/login`, {
      identifier: 'admin@agrimachinery.com',
      password: 'AgriAdmin@2026#Secure'
    });
    const adminToken = adminLoginRes.data.token;
    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

    const adminOrdersRes = await axios.get(`${API_BASE}/admin/orders`, adminHeaders);
    console.log(`   Admin sees all ${adminOrdersRes.data.orders.length} real orders:`);
    adminOrdersRes.data.orders.forEach(o => {
      console.log(`    - Order #${o.orderNumber} by ${o.customerName} (${o.shippingAddress?.villageCity}, ${o.shippingAddress?.state}) -> Status: ${o.orderStatus}`);
    });

    console.log('\n====================================================');
    console.log('🎉 ALL USER-SPECIFIC ORDER ISOLATION TESTS PASSED! 🎉');
    console.log('====================================================');

  } catch (error) {
    console.error('\n❌ Test Failure:', error.response?.data?.message || error.message);
    process.exit(1);
  }
};

runTest();
