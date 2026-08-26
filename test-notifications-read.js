const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function testNotificationClearance() {
  console.log('\n======================================================');
  console.log('🔔 Testing Support Message Read & Notification Clearance 🔔');
  console.log('======================================================\n');

  try {
    // 1. Login Customer
    console.log('[1] Logging in customer (ramesh.patel@kisanmail.in)...');
    const customerLogin = await axios.post(`${API_URL}/users/login`, {
      email: 'ramesh.patel@kisanmail.in',
      password: 'Farmer@2026'
    });
    const customerToken = customerLogin.data.token;
    const customerAuth = { headers: { Authorization: `Bearer ${customerToken}` } };
    console.log('✅ Customer logged in successfully.');

    // 2. Login Admin
    console.log('[2] Logging in Admin...');
    const adminLogin = await axios.post(`${API_URL}/admin/auth/login`, {
      identifier: 'admin@agrimachinery.com',
      password: 'AgriAdmin@2026#Secure'
    });
    const adminToken = adminLogin.data.token;
    const adminAuth = { headers: { Authorization: `Bearer ${adminToken}` } };
    console.log('✅ Admin logged in successfully.');

    // 3. Customer creates a new inquiry
    console.log('\n[3] Customer creating a new inquiry ticket...');
    const ticketRes = await axios.post(
      `${API_URL}/support/tickets`,
      {
        name: 'Ramesh Patel',
        phone: '9876543210',
        email: 'ramesh.patel@kisanmail.in',
        subject: 'Notification Badge Clearance Test',
        message: 'Hello, checking if the notification badge disappears after admin opens this message.',
        inquiryType: 'Technical Guidance'
      },
      customerAuth
    );
    const ticketId = ticketRes.data.ticket._id;
    console.log(`✅ Ticket created: ${ticketRes.data.ticket.ticketNumber} (ID: ${ticketId})`);

    // 4. Check Admin unread tickets count before opening
    console.log('\n[4] Checking Admin unread count before opening ticket...');
    const adminBefore = await axios.get(`${API_URL}/support/admin/tickets`, adminAuth);
    const unreadBefore = adminBefore.data.stats.unreadCount;
    const thisTicketBefore = adminBefore.data.tickets.find(t => t._id === ticketId);
    console.log(`   Admin total unreadCount: ${unreadBefore}`);
    console.log(`   This ticket unreadByAdmin: ${thisTicketBefore?.unreadByAdmin}`);
    if (thisTicketBefore?.unreadByAdmin !== 1) {
      throw new Error(`Expected thisTicket.unreadByAdmin to be 1, got ${thisTicketBefore?.unreadByAdmin}`);
    }

    // 5. Admin opens/reads the ticket via GET /support/admin/tickets/:id
    console.log('\n[5] Admin opening/reading the ticket (seen)...');
    const openRes = await axios.get(`${API_URL}/support/admin/tickets/${ticketId}`, adminAuth);
    console.log(`✅ Admin opened ticket. Ticket ID: ${openRes.data.ticket._id}`);

    // 6. Verify Admin unread status is now 0 (badge cleared)
    console.log('\n[6] Checking Admin unread count after opening ticket...');
    const adminAfter = await axios.get(`${API_URL}/support/admin/tickets`, adminAuth);
    const thisTicketAfter = adminAfter.data.tickets.find(t => t._id === ticketId);
    console.log(`   This ticket unreadByAdmin: ${thisTicketAfter?.unreadByAdmin}`);
    if (thisTicketAfter?.unreadByAdmin !== 0) {
      throw new Error(`FAIL: Expected thisTicket.unreadByAdmin to be 0 after opening, got ${thisTicketAfter?.unreadByAdmin}`);
    }
    console.log('✅ PASS: Admin unreadByAdmin reset to 0 after viewing the message!');

    // 7. Admin sends a reply to Customer
    console.log('\n[7] Admin sending reply to customer...');
    await axios.post(
      `${API_URL}/support/admin/tickets/${ticketId}/reply`,
      { text: 'Namaste Ramesh ji! We received your message and we are testing badge clearance.' },
      adminAuth
    );
    console.log('✅ Reply sent.');

    // 8. Check Customer unread count before customer opens
    console.log('\n[8] Checking Customer unread count before opening reply...');
    const custUnreadBefore = await axios.get(`${API_URL}/support/unread-count`, customerAuth);
    console.log(`   Customer unreadCount before opening: ${custUnreadBefore.data.unreadCount}`);
    if (custUnreadBefore.data.unreadCount < 1) {
      throw new Error(`FAIL: Expected customer unreadCount >= 1, got ${custUnreadBefore.data.unreadCount}`);
    }

    // 9. Customer opens/reads ticket
    console.log('\n[9] Customer opening/reading ticket (seen)...');
    const custOpenRes = await axios.get(`${API_URL}/support/tickets/${ticketId}`, customerAuth);
    console.log(`✅ Customer opened ticket: ${custOpenRes.data.ticket.ticketNumber}`);

    // 10. Check Customer unread count after opening
    console.log('\n[10] Checking Customer unread count after opening reply...');
    const custUnreadAfter = await axios.get(`${API_URL}/support/unread-count`, customerAuth);
    const myTicketsAfter = await axios.get(`${API_URL}/support/my-tickets`, customerAuth);
    const myThisTicket = myTicketsAfter.data.tickets.find(t => t._id === ticketId);
    console.log(`   Customer unreadCount after opening: ${custUnreadAfter.data.unreadCount}`);
    console.log(`   This ticket unreadByUser: ${myThisTicket?.unreadByUser}`);

    if (myThisTicket?.unreadByUser !== 0) {
      throw new Error(`FAIL: Expected thisTicket.unreadByUser to be 0 after opening, got ${myThisTicket?.unreadByUser}`);
    }
    if (custUnreadAfter.data.unreadCount !== custUnreadBefore.data.unreadCount - 1) {
      throw new Error(`FAIL: Expected unreadCount to decrease by 1 from ${custUnreadBefore.data.unreadCount}, got ${custUnreadAfter.data.unreadCount}`);
    }
    console.log('✅ PASS: Customer unread count and unreadByUser successfully cleared to 0 after viewing the reply!');

    // 11. Test explicit PUT /support/admin/tickets/:id/read
    console.log('\n[11] Testing explicit PUT /admin/tickets/:id/read endpoint...');
    // Add user message to make it unread again
    await axios.post(`${API_URL}/support/tickets/${ticketId}/message`, { text: 'Another message' }, customerAuth);
    const checkUnread = await axios.get(`${API_URL}/support/admin/tickets`, adminAuth);
    console.log(`   Unread after customer reply: ${checkUnread.data.tickets.find(t => t._id === ticketId)?.unreadByAdmin}`);

    // Call PUT read
    const markReadRes = await axios.put(`${API_URL}/support/admin/tickets/${ticketId}/read`, {}, adminAuth);
    console.log(`   markRead API response success: ${markReadRes.data.success}`);

    const finalCheck = await axios.get(`${API_URL}/support/admin/tickets`, adminAuth);
    const finalUnread = finalCheck.data.tickets.find(t => t._id === ticketId)?.unreadByAdmin;
    console.log(`   Final ticket unreadByAdmin: ${finalUnread}`);
    if (finalUnread !== 0) {
      throw new Error(`FAIL: Expected final unread to be 0, got ${finalUnread}`);
    }
    console.log('✅ PASS: PUT /admin/tickets/:id/read successfully clears notification badge!');

    console.log('\n======================================================');
    console.log('🎉 ALL NOTIFICATION CLEARANCE TESTS PASSED (100%)! 🎉');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

testNotificationClearance();
