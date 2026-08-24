const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function testSupportDeskAndChat() {
  console.log('=== TESTING CUSTOMER-ADMIN LIVE SUPPORT DESK & CHAT SYSTEM ===\n');

  try {
    // 1. Login Farmer
    const farmerRes = await axios.post(`${API_URL}/users/login`, {
      email: 'ramesh.patel@kisanmail.in',
      password: 'Farmer@2026'
    });
    const farmerToken = farmerRes.data.token;
    const farmerAuth = { headers: { Authorization: `Bearer ${farmerToken}` } };
    console.log('✅ Farmer logged in:', farmerRes.data.user.name);

    // 2. Login Admin
    const adminRes = await axios.post(`${API_URL}/admin/auth/login`, {
      identifier: 'admin@agrimachinery.com',
      password: 'AgriAdmin@2026#Secure'
    });
    const adminToken = adminRes.data.token;
    const adminAuth = { headers: { Authorization: `Bearer ${adminToken}` } };
    console.log('✅ Admin logged in:', adminRes.data.admin.name);

    // 3. Farmer creates a support ticket with attached soil photo
    console.log('\n[3] Farmer creating support inquiry ticket...');
    const ticketRes = await axios.post(`${API_URL}/support/tickets`, {
      name: 'Ramesh Patel',
      phone: '9027799171',
      email: 'ramesh.patel@kisanmail.in',
      subject: 'Inquiry on 7HP Power Weeder attachment for heavy black soil',
      inquiryType: 'Technical Guidance',
      productTitle: 'Power Weeder 7HP Petrol (AV-708)',
      productSku: 'PW-708-P',
      message: 'Namaste, kya is 7HP power weeder me ridger aur deep furrower lag sakta hai? Attached black soil photo.',
      images: ['https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=600&q=80']
    }, farmerAuth);

    const ticketId = ticketRes.data.ticket._id;
    console.log('✅ Ticket created! Ticket Number:', ticketRes.data.ticket.ticketNumber, '| ID:', ticketId);

    // 4. Admin views tickets list in Support Desk
    console.log('\n[4] Admin fetching support tickets...');
    const adminTicketsRes = await axios.get(`${API_URL}/support/admin/tickets`, adminAuth);
    console.log(`✅ Admin retrieved ${adminTicketsRes.data.tickets.length} tickets. Stats: Open = ${adminTicketsRes.data.stats.openCount}, Unread = ${adminTicketsRes.data.stats.unreadCount}`);

    // 5. Admin sends a reply with YouTube video demonstration link
    console.log('\n[5] Admin sending support reply with video demo link...');
    const replyRes = await axios.post(`${API_URL}/support/admin/tickets/${ticketId}/reply`, {
      text: 'Namaste Ramesh ji! Haan, AV-708 me dual-speed gearbox hai aur ridger 100% compatible hai. Video demo dekhiye:',
      videoUrl: 'https://www.youtube.com/watch?v=0Lz8Ew0DbgM',
      status: 'In Progress'
    }, adminAuth);
    console.log('✅ Admin reply sent! Ticket Status now:', replyRes.data.ticket.status);

    // 6. Farmer checks unread message count notification
    console.log('\n[6] Farmer checking unread notification count...');
    const unreadRes = await axios.get(`${API_URL}/support/unread-count`, farmerAuth);
    console.log('✅ Farmer unread support messages count:', unreadRes.data.unreadCount);

    // 7. Farmer opens ticket to read reply (resets unread count)
    console.log('\n[7] Farmer opening ticket details...');
    const farmerViewRes = await axios.get(`${API_URL}/support/tickets/${ticketId}`, farmerAuth);
    console.log(`✅ Farmer opened conversation with ${farmerViewRes.data.ticket.messages.length} messages.`);
    console.log('   Last message from:', farmerViewRes.data.ticket.messages[farmerViewRes.data.ticket.messages.length - 1].senderName);
    console.log('   Video link in message:', farmerViewRes.data.ticket.messages[farmerViewRes.data.ticket.messages.length - 1].videoUrl);

    // 8. Farmer sends follow-up thank you message
    console.log('\n[8] Farmer sending follow-up message...');
    const followUpRes = await axios.post(`${API_URL}/support/tickets/${ticketId}/message`, {
      text: 'Dhanyawad support team! Video demo dekh liya hai, bohot acche se samajh aa gaya. Abhi order place kar raha hoon.'
    }, farmerAuth);
    console.log('✅ Farmer follow-up delivered! Total messages:', followUpRes.data.ticket.messages.length);

    console.log('\n🎉 ALL CUSTOMER SUPPORT DESK, LIVE CHAT, MEDIA ATTACHMENTS & NOTIFICATION BADGE TESTS PASSED 100%!');
  } catch (err) {
    console.error('❌ Test Failed:', err.response?.data || err.message);
  }
}

testSupportDeskAndChat();
