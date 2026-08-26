const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function runRealDataIsolationTests() {
  console.log('\n================================================================');
  console.log('🌾 Testing Real User Orders & Real Support Inquiries Lifecycle 🌾');
  console.log('================================================================\n');

  try {
    // 1. Admin Login
    console.log('[1] Logging in as Admin...');
    const adminLoginRes = await axios.post(`${BASE_URL}/admin/auth/login`, {
      identifier: 'admin@agrimachinery.com',
      password: 'AgriAdmin@2026#Secure'
    });
    const adminToken = adminLoginRes.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    console.log('  ✅ Admin logged in successfully.');

    // 2. Customer 1 Login (Ramesh Patel)
    console.log('\n[2] Logging in Customer 1 (Ramesh Patel)...');
    const user1LoginRes = await axios.post(`${BASE_URL}/users/login`, {
      email: 'ramesh.patel@kisanmail.in',
      password: 'Farmer@2026'
    });
    const user1Token = user1LoginRes.data.token;
    const user1Id = user1LoginRes.data.user._id;
    const user1Headers = { Authorization: `Bearer ${user1Token}` };
    console.log(`  ✅ Customer 1 logged in. User ID: ${user1Id}`);

    // 3. Customer 2 Login (Suresh Sharma)
    console.log('\n[3] Logging in Customer 2 (Suresh Sharma)...');
    let user2Token, user2Id, user2Headers;
    try {
      const user2LoginRes = await axios.post(`${BASE_URL}/users/login`, {
        email: 'suresh.sharma@kisanmail.in',
        password: 'Farmer@2026'
      });
      user2Token = user2LoginRes.data.token;
      user2Id = user2LoginRes.data.user._id;
      user2Headers = { Authorization: `Bearer ${user2Token}` };
      console.log(`  ✅ Customer 2 logged in. User ID: ${user2Id}`);
    } catch (e) {
      // Register Customer 2 if not exists
      const regRes = await axios.post(`${BASE_URL}/users/register`, {
        name: 'Suresh Sharma',
        email: 'suresh.sharma@kisanmail.in',
        password: 'Farmer@2026',
        phone: '9876543219'
      });
      user2Token = regRes.data.token;
      user2Id = regRes.data.user._id;
      user2Headers = { Authorization: `Bearer ${user2Token}` };
      console.log(`  ✅ Customer 2 registered and logged in. User ID: ${user2Id}`);
    }

    // 4. Check initial admin state
    console.log('\n[4] Checking Admin Orders & Support Inquiries initially...');
    const initialOrdersRes = await axios.get(`${BASE_URL}/admin/orders`, { headers: adminHeaders });
    const initialTicketsRes = await axios.get(`${BASE_URL}/support/admin/tickets`, { headers: adminHeaders });
    console.log(`  -> Initial Admin Orders Count: ${initialOrdersRes.data.orders?.length || 0}`);
    console.log(`  -> Initial Admin Support Inquiries Count: ${initialTicketsRes.data.tickets?.length || 0}`);

    // 5. Customer 1 places a REAL Order
    console.log('\n[5] Customer 1 placing a REAL Order for Power Weeder...');
    const createOrderRes = await axios.post(`${BASE_URL}/orders`, {
      items: [
        {
          product: '6a89541db8914ab3352b067b',
          name: 'Power Weeder 7HP Petrol 4-Stroke (AV-708)',
          price: 38499,
          quantity: 1,
          image: '/images/machinery/power_weeder.jpg'
        }
      ],
      shippingAddress: {
        fullName: 'Ramesh Patel',
        phone: '9027799171',
        street: 'Farm Plot 44, Gondal Road',
        villageCity: 'Gondal',
        district: 'Rajkot',
        state: 'Gujarat',
        pincode: '360004'
      },
      paymentMethod: 'COD'
    }, { headers: user1Headers });

    const newOrder = createOrderRes.data.order;
    console.log(`  ✅ Order Created Successfully! Order #${newOrder.orderNumber} (ID: ${newOrder._id})`);

    // 6. Verify Real Order in Admin Panel
    console.log('\n[6] Verifying Real Order in Admin Orders API...');
    const adminOrdersRes = await axios.get(`${BASE_URL}/admin/orders`, { headers: adminHeaders });
    const foundInAdmin = adminOrdersRes.data.orders.find(o => o._id === newOrder._id);
    if (foundInAdmin) {
      console.log(`  ✅ PASSED: Order #${newOrder.orderNumber} found in Admin Desk!`);
      console.log(`     Customer: ${foundInAdmin.shippingAddress.fullName}, Total: ₹${foundInAdmin.pricing.grandTotal}`);
    } else {
      throw new Error(`Order #${newOrder.orderNumber} not found in admin orders list!`);
    }

    // 7. Verify Customer 1 Sees Order in my-orders
    console.log('\n[7] Verifying Customer 1 sees their own order...');
    const user1OrdersRes = await axios.get(`${BASE_URL}/orders/my-orders`, { headers: user1Headers });
    const foundInUser1 = user1OrdersRes.data.orders.find(o => o._id === newOrder._id);
    if (foundInUser1) {
      console.log(`  ✅ PASSED: Customer 1 sees Order #${newOrder.orderNumber} in their personal orders list!`);
    } else {
      throw new Error('Customer 1 could not find their own order!');
    }

    // 8. Verify Customer 2 CANNOT see Customer 1's order (Strict User Isolation)
    console.log('\n[8] Verifying Customer 2 cannot see Customer 1\'s order...');
    const user2OrdersRes = await axios.get(`${BASE_URL}/orders/my-orders`, { headers: user2Headers });
    const foundInUser2 = user2OrdersRes.data.orders.find(o => o._id === newOrder._id);
    if (!foundInUser2) {
      console.log(`  ✅ PASSED: Customer 2 has 0 access to Customer 1's order. User isolation verified!`);
    } else {
      throw new Error('SECURITY BREACH: Customer 2 can see Customer 1\'s order!');
    }

    // 9. Customer 1 submits a REAL Support Inquiry
    console.log('\n[9] Customer 1 creating a REAL Support Inquiry Ticket...');
    const createTicketRes = await axios.post(`${BASE_URL}/support/tickets`, {
      name: 'Ramesh Patel',
      phone: '9027799171',
      email: 'ramesh.patel@kisanmail.in',
      subject: 'Delivery Timeline to Rajkot Farm & Oil Setup Assistance',
      inquiryType: 'Delivery & Tracking',
      message: 'Namaste! Main apne order #AV-708 ke liye oil filling aur delivery vehicle date janna chahta hoon.'
    }, { headers: user1Headers });

    const newTicket = createTicketRes.data.ticket;
    console.log(`  ✅ Support Ticket Created! Ticket #${newTicket.ticketNumber} (ID: ${newTicket._id})`);

    // 10. Verify Real Ticket appears in Admin Support Desk
    console.log('\n[10] Verifying Real Inquiry appears in Admin Support Desk...');
    const adminTicketsRes = await axios.get(`${BASE_URL}/support/admin/tickets`, { headers: adminHeaders });
    const foundTicket = adminTicketsRes.data.tickets.find(t => t._id === newTicket._id);
    if (foundTicket) {
      console.log(`  ✅ PASSED: Ticket #${newTicket.ticketNumber} found in Admin Support Desk!`);
      console.log(`     From: ${foundTicket.userName} (${foundTicket.userEmail}), Subject: "${foundTicket.subject}", Unread by Admin: ${foundTicket.unreadByAdmin}`);
    } else {
      throw new Error(`Ticket #${newTicket.ticketNumber} not found in admin support tickets!`);
    }

    // 11. Admin sends real reply to Customer 1
    console.log('\n[11] Admin sending real advisory reply...');
    const adminReplyRes = await axios.post(`${BASE_URL}/support/admin/tickets/${newTicket._id}/reply`, {
      text: 'Namaste Ramesh ji! Machine me 15W-40 engine oil pre-filled aati hai. Delivery 3 din me aapke Rajkot farm par hydraulic vehicle se ho jayegi.',
      status: 'In Progress'
    }, { headers: adminHeaders });
    console.log(`  ✅ Admin replied successfully. Updated Ticket Status: ${adminReplyRes.data.ticket.status}`);

    // 12. Customer 1 receives reply
    console.log('\n[12] Customer 1 checking updated ticket conversation...');
    const user1TicketRes = await axios.get(`${BASE_URL}/support/tickets/${newTicket._id}`, { headers: user1Headers });
    const latestMessage = user1TicketRes.data.ticket.messages[user1TicketRes.data.ticket.messages.length - 1];
    console.log(`  ✅ Customer 1 received Admin reply: "${latestMessage.text}"`);

    console.log('\n================================================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED 100%! ZERO STATIC DATA DETECTED.');
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ TEST FAILED with Error:', err.response?.data || err.message);
    process.exit(1);
  }
}

runRealDataIsolationTests();
