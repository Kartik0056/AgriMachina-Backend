const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  createTicket,
  uploadChatFiles,
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
const { uploadMedia } = require('../middleware/upload');

// Multer error-handling middleware wrapper
const handleUploadMedia = (req, res, next) => {
  const upload = uploadMedia.array('files', 5);
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File exceeds the maximum allowed size of 5MB.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ success: false, message: 'You can upload a maximum of 5 files at once.' });
      }
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message || 'File upload failed.' });
    }
    next();
  });
};

// ================= USER SUPPORT ROUTES =================
// Upload chat attachments (photos, PDFs, docs, videos - Max 25MB)
router.post('/upload', optionalUserAuth, handleUploadMedia, uploadChatFiles);

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
// Admin upload chat attachments
router.post('/admin/upload', requireAdminAuth, handleUploadMedia, uploadChatFiles);

// Admin list tickets
router.get('/admin/tickets', requireAdminAuth, adminGetTickets);

// Admin get ticket details
router.get('/admin/tickets/:id', requireAdminAuth, adminGetTicketDetails);

// Admin send reply
router.post('/admin/tickets/:id/reply', requireAdminAuth, sanitizeInput, adminSendReply);

// Admin update ticket status / priority
router.put('/admin/tickets/:id/status', requireAdminAuth, sanitizeInput, adminUpdateTicketStatus);

module.exports = router;
