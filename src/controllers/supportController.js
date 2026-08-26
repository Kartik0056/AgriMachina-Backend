const SupportTicket = require('../models/SupportTicket');
const sanitizeHtml = require('sanitize-html');
const { broadcastRealtimeEvent } = require('../services/realtimeService');

// Create a new support inquiry / chat ticket
const createTicket = async (req, res) => {
  try {
    const { name, phone, email, subject, message, productId, productTitle, productSku, inquiryType, images, attachments, videoUrl } = req.body;
    const userId = req.user ? req.user._id : null;

    if (!name || !phone || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Name, phone, subject, and message are required.' });
    }

    const cleanSubject = sanitizeHtml(subject, { allowedTags: [] }).trim();
    const cleanMessage = sanitizeHtml(message, { allowedTags: [] }).trim();

    const ticket = new SupportTicket({
      user: userId,
      userName: name.trim(),
      userEmail: (email || '').trim(),
      userPhone: phone.trim(),
      subject: cleanSubject,
      productId: productId || null,
      productTitle: (productTitle || '').trim(),
      productSku: (productSku || '').trim(),
      inquiryType: inquiryType || 'General Support',
      status: 'Open',
      unreadByAdmin: 1,
      unreadByUser: 0,
      messages: [
        {
          sender: 'user',
          senderName: name.trim(),
          text: cleanMessage,
          images: Array.isArray(images) ? images : [],
          attachments: Array.isArray(attachments) ? attachments : [],
          videoUrl: (videoUrl || '').trim(),
          createdAt: new Date()
        }
      ],
      lastMessageAt: new Date()
    });

    await ticket.save();

    // Broadcast instant real-time notification to all connected admin panels
    try {
      broadcastRealtimeEvent('NEW_SUPPORT_QUERY', {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        userName: ticket.userName,
        userPhone: ticket.userPhone,
        subject: ticket.subject,
        productTitle: ticket.productTitle,
        type: 'new_ticket',
        preview: cleanMessage.slice(0, 100)
      });
    } catch (e) {
      console.error('Broadcast failed:', e);
    }

    return res.status(201).json({
      success: true,
      message: 'Support ticket created successfully! Our engineering team will assist you.',
      ticket
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Upload attachment files (images, documents, PDFs, videos)
const uploadChatFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files were uploaded.' });
    }

    const uploaded = req.files.map(f => {
      const isVideo = f.mimetype.startsWith('video/') || f.originalname.toLowerCase().endsWith('.mp4');
      const isPdf = f.mimetype.includes('pdf') || f.originalname.toLowerCase().endsWith('.pdf');
      const fileUrl = `/uploads/${f.filename}`;

      return {
        url: fileUrl,
        name: f.originalname,
        size: f.size,
        fileType: isVideo ? 'video' : isPdf ? 'document' : 'image'
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Attachments uploaded successfully.',
      files: uploaded,
      urls: uploaded.map(u => u.url)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Farmer / Customer gets their tickets
const getMyTickets = async (req, res) => {
  try {
    const userId = req.user._id;
    const userPhone = req.user.phone;
    const userEmail = req.user.email;

    // Match by user ID or matching phone/email
    const query = {
      $or: [
        { user: userId },
        ...(userPhone ? [{ userPhone }] : []),
        ...(userEmail ? [{ userEmail }] : [])
      ]
    };

    const tickets = await SupportTicket.find(query).sort({ lastMessageAt: -1 }).lean();
    const totalUnread = tickets.reduce((sum, t) => sum + (t.unreadByUser || 0), 0);

    return res.status(200).json({
      success: true,
      tickets,
      totalUnread
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Farmer gets single ticket details & marks as read
const getTicketDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.findById(id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    if (ticket.unreadByUser > 0) {
      ticket.unreadByUser = 0;
      await ticket.save();

      try {
        broadcastRealtimeEvent('TICKET_UPDATED', {
          ticketId: ticket._id,
          ticketNumber: ticket.ticketNumber,
          type: 'ticket_read_by_user',
          unreadByUser: 0
        });
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      ticket
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Farmer explicitly marks a ticket as read
const markTicketAsReadByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.findById(id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    if (ticket.unreadByUser > 0) {
      ticket.unreadByUser = 0;
      await ticket.save();

      try {
        broadcastRealtimeEvent('TICKET_UPDATED', {
          ticketId: ticket._id,
          ticketNumber: ticket.ticketNumber,
          type: 'ticket_read_by_user',
          unreadByUser: 0
        });
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      message: 'Ticket marked as read by user.',
      ticket
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Farmer sends reply in existing ticket
const sendUserMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, images, attachments, videoUrl } = req.body;

    const hasImages = Array.isArray(images) && images.length > 0;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if ((!text || !text.trim()) && !hasImages && !hasAttachments && !videoUrl) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const cleanText = text ? sanitizeHtml(text, { allowedTags: [] }).trim() : '';

    const newMsg = {
      sender: 'user',
      senderName: req.user ? req.user.name : ticket.userName,
      text: cleanText,
      images: Array.isArray(images) ? images : [],
      attachments: Array.isArray(attachments) ? attachments : [],
      videoUrl: (videoUrl || '').trim(),
      createdAt: new Date()
    };

    ticket.messages.push(newMsg);
    ticket.unreadByAdmin = (ticket.unreadByAdmin || 0) + 1;
    ticket.lastMessageAt = new Date();
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
      ticket.status = 'In Progress';
    }

    await ticket.save();

    try {
      broadcastRealtimeEvent('NEW_SUPPORT_QUERY', {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        userName: ticket.userName,
        userPhone: ticket.userPhone,
        subject: ticket.subject,
        type: 'user_reply',
        preview: (cleanText || 'Attached Media / File').slice(0, 100)
      });
    } catch (e) {
      console.error('Broadcast failed:', e);
    }

    return res.status(200).json({
      success: true,
      message: 'Message sent to support team.',
      ticket
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Customer unread message count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const userPhone = req.user.phone;
    const userEmail = req.user.email;

    const tickets = await SupportTicket.find({
      $or: [
        { user: userId },
        ...(userPhone ? [{ userPhone }] : []),
        ...(userEmail ? [{ userEmail }] : [])
      ]
    }, { unreadByUser: 1 });

    const totalUnread = tickets.reduce((sum, t) => sum + (t.unreadByUser || 0), 0);

    return res.status(200).json({
      success: true,
      unreadCount: totalUnread
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =================== ADMIN CONTROLLERS ===================

// Admin lists all tickets with filters
const adminGetTickets = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { userPhone: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { productTitle: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await SupportTicket.countDocuments(query);
    const tickets = await SupportTicket.find(query)
      .sort({ lastMessageAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const openCount = await SupportTicket.countDocuments({ status: 'Open' });
    const inProgressCount = await SupportTicket.countDocuments({ status: 'In Progress' });
    const totalUnreadByAdmin = await SupportTicket.aggregate([
      { $group: { _id: null, total: { $sum: '$unreadByAdmin' } } }
    ]);

    return res.status(200).json({
      success: true,
      total,
      tickets,
      stats: {
        openCount,
        inProgressCount,
        unreadCount: totalUnreadByAdmin[0]?.total || 0
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin gets ticket details & marks as read by admin
const adminGetTicketDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.findById(id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    if (ticket.unreadByAdmin > 0) {
      ticket.unreadByAdmin = 0;
      await ticket.save();

      try {
        broadcastRealtimeEvent('TICKET_UPDATED', {
          ticketId: ticket._id,
          ticketNumber: ticket.ticketNumber,
          type: 'ticket_read_by_admin',
          unreadByAdmin: 0
        });
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      ticket
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin explicitly marks ticket as read
const adminMarkTicketAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.findById(id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    if (ticket.unreadByAdmin > 0) {
      ticket.unreadByAdmin = 0;
      await ticket.save();

      try {
        broadcastRealtimeEvent('TICKET_UPDATED', {
          ticketId: ticket._id,
          ticketNumber: ticket.ticketNumber,
          type: 'ticket_read_by_admin',
          unreadByAdmin: 0
        });
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      message: 'Ticket marked as read by admin.',
      ticket
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin sends reply to customer
const adminSendReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, images, attachments, videoUrl, status } = req.body;

    const hasImages = Array.isArray(images) && images.length > 0;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if ((!text || !text.trim()) && !hasImages && !hasAttachments && !videoUrl) {
      return res.status(400).json({ success: false, message: 'Reply message cannot be empty.' });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const cleanText = text ? sanitizeHtml(text, { allowedTags: [] }).trim() : '';

    const newMsg = {
      sender: 'admin',
      senderName: req.admin ? `${req.admin.name} (Support Engineer)` : 'AgriMachina Support Team',
      text: cleanText,
      images: Array.isArray(images) ? images : [],
      attachments: Array.isArray(attachments) ? attachments : [],
      videoUrl: (videoUrl || '').trim(),
      createdAt: new Date()
    };

    ticket.messages.push(newMsg);
    ticket.unreadByUser = (ticket.unreadByUser || 0) + 1;
    ticket.lastMessageAt = new Date();
    if (status) {
      ticket.status = status;
    } else if (ticket.status === 'Open') {
      ticket.status = 'In Progress';
    }

    await ticket.save();

    try {
      broadcastRealtimeEvent('TICKET_UPDATED', {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        type: 'admin_reply',
        status: ticket.status
      });
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: 'Reply sent to customer successfully.',
      ticket
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin updates ticket status
const adminUpdateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;

    await ticket.save();

    try {
      broadcastRealtimeEvent('TICKET_UPDATED', {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status
      });
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: `Ticket status updated to ${ticket.status}`,
      ticket
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTicket,
  uploadChatFiles,
  getMyTickets,
  getTicketDetails,
  markTicketAsReadByUser,
  sendUserMessage,
  getUnreadCount,
  adminGetTickets,
  adminGetTicketDetails,
  adminMarkTicketAsRead,
  adminSendReply,
  adminUpdateTicketStatus
};
