const express = require('express');
const router = express.Router();
const {
  createTicket,
  getMyTickets,
  getTicketDetails,
  sendUserMessage,
  getUnreadCount,
  adminGetTickets,
  adminGetTicketDetails,
  adminSendReply,
  adminUpdateTicketStatus
} = require('../controllers/supportController');
const { requireUserAuth, optionalUserAuth } = require('../middleware/auth');
const { requireAdminAuth } = require('../middleware/adminAuth');
const { sanitizeInput } = require('../middleware/sanitize');

// ================= USER SUPPORT ROUTES =================
// Create ticket (logged-in or guest farmer)
router.post('/tickets', optionalUserAuth, sanitizeInput, createTicket);

// Get my tickets (requires login)
router.get('/my-tickets', requireUserAuth, getMyTickets);

// Get unread messages count for navbar notification badge
router.get('/unread-count', requireUserAuth, getUnreadCount);

// Get single ticket details
router.get('/tickets/:id', requireUserAuth, getTicketDetails);

// Send reply in ticket
router.post('/tickets/:id/message', requireUserAuth, sanitizeInput, sendUserMessage);

// ================= ADMIN SUPPORT ROUTES =================
// Admin list tickets
router.get('/admin/tickets', requireAdminAuth, adminGetTickets);

// Admin get ticket details
router.get('/admin/tickets/:id', requireAdminAuth, adminGetTicketDetails);

// Admin send reply
router.post('/admin/tickets/:id/reply', requireAdminAuth, sanitizeInput, adminSendReply);

// Admin update ticket status / priority
router.put('/admin/tickets/:id/status', requireAdminAuth, sanitizeInput, adminUpdateTicketStatus);

module.exports = router;
