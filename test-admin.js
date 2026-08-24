const axios = require('axios');

const API_URL = 'http://localhost:4000/api/admin';

async function testAdminEndpoints() {
  console.log('=== TESTING ADMIN ORDERS, AUDIT LOGS, AND ROLES ===\n');

  try {
    // 1. Admin Login
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      identifier: 'superadmin',
      password: 'AgriAdmin@2026#Secure'
    });
    const token = loginRes.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✅ Admin Authenticated as Super Admin successfully!');

    // 2. Test GET /api/admin/orders
    console.log('\n[2] Fetching Orders (/api/admin/orders)...');
    const ordersRes = await axios.get(`${API_URL}/orders`, authHeaders);
    console.log(`✅ Success! Total Orders in database: ${ordersRes.data.orders.length}`);
    if (ordersRes.data.orders.length > 0) {
      const topOrder = ordersRes.data.orders[0];
      console.log(`   Sample Order #${topOrder.orderNumber}: ${topOrder.shippingAddress?.fullName} | Total: ₹${topOrder.pricing?.grandTotal} | Status: ${topOrder.orderStatus}`);

      // Test Updating status
      console.log('\n[3] Testing Status Update on Order...');
      const updateRes = await axios.put(`${API_URL}/orders/${topOrder._id}/status`, {
        status: 'Shipped',
        courierName: 'AgriLogistics Express',
        trackingNumber: 'AGL-892348-IN',
        note: 'Machinery palletized and dispatched via logistics truck.'
      }, authHeaders);
      console.log(`✅ Success! Status updated to: ${updateRes.data.order.orderStatus}`);
      console.log(`   Tracking Number: ${updateRes.data.order.tracking.trackingNumber}`);
    }

    // 4. Test GET /api/admin/audit-logs
    console.log('\n[4] Fetching Audit Logs (/api/admin/audit-logs)...');
    const auditRes = await axios.get(`${API_URL}/audit-logs`, authHeaders);
    console.log(`✅ Success! Total Audit Logs: ${auditRes.data.logs?.length || 0}`);

    // 5. Test GET /api/admin/roles/admins
    console.log('\n[5] Fetching Admins & Roles (/api/admin/roles/admins)...');
    const adminsRes = await axios.get(`${API_URL}/roles/admins`, authHeaders);
    console.log(`✅ Success! Total Admin accounts: ${adminsRes.data.admins?.length || 0}`);

    console.log('\n🎉 ALL ADMIN MANAGEMENT ENDPOINTS PASSED WITH 0 ERRORS!');
  } catch (err) {
    console.error('❌ Test Failed:', err.response?.data || err.message);
  }
}

testAdminEndpoints();
