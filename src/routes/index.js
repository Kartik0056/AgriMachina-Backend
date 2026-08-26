const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const ContactRequest = require('../models/ContactRequest');
const { sanitizeInput } = require('../middleware/sanitize');

// Admin Routes
const adminAuthRoutes = require('./adminAuthRoutes');
const adminProductRoutes = require('./adminProductRoutes');
const adminBulkRoutes = require('./adminBulkRoutes');
const adminOrderRoutes = require('./adminOrderRoutes');
const adminReviewRoutes = require('./adminReviewRoutes');
const adminDashboardRoutes = require('./adminDashboardRoutes');
const adminAuditRoutes = require('./adminAuditRoutes');
const adminRoleRoutes = require('./adminRoleRoutes');
const adminCategoryRoutes = require('./adminCategoryRoutes');
const adminCouponRoutes = require('./adminCouponRoutes');
const adminBannerRoutes = require('./adminBannerRoutes');
const { getPublicSlides } = require('../controllers/adminBannerController');

// Storefront Routes
const productRoutes = require('./productRoutes');
const reviewRoutes = require('./reviewRoutes');
const emiRoutes = require('./emiRoutes');
const orderRoutes = require('./orderRoutes');
const userRoutes = require('./userRoutes');
const paymentRoutes = require('./paymentRoutes');
const supportRoutes = require('./supportRoutes');
const couponRoutes = require('./couponRoutes');
const aiRoutes = require('./aiRoutes');
const SupportTicket = require('../models/SupportTicket');
const { handleSSEStream } = require('../services/realtimeService');

// Real-Time Event Stream Endpoint
router.get('/sync/stream', handleSSEStream);

// Mount Admin Endpoints under /api/admin
router.use('/admin/auth', adminAuthRoutes);
router.use('/admin/products', adminProductRoutes);
router.use('/admin/bulk', adminBulkRoutes);
router.use('/admin/orders', adminOrderRoutes);
router.use('/admin/reviews', adminReviewRoutes);
router.use('/admin/dashboard', adminDashboardRoutes);
router.use('/admin/audit-logs', adminAuditRoutes);
router.use('/admin/roles', adminRoleRoutes);
router.use('/admin/coupons', adminCouponRoutes);
router.use('/admin/support', supportRoutes);
router.use('/admin/banners', adminBannerRoutes);
router.use('/admin/hero-slides', adminBannerRoutes);
router.use('/admin', adminCategoryRoutes);

// Mount Storefront Endpoints
router.get('/banners', getPublicSlides);
router.get('/hero-slides', getPublicSlides);
router.use('/products/:productId/reviews', reviewRoutes);
router.use('/products', productRoutes);
router.use('/reviews', reviewRoutes);
router.use('/emi', emiRoutes);
router.use('/orders', orderRoutes);
router.use('/users', userRoutes);
router.use('/payment', paymentRoutes);
router.use('/support', supportRoutes);
router.use('/coupons', couponRoutes);
router.use('/ai', aiRoutes);

// Public Category & Brand listings
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 });
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/brands', async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true }).sort({ name: 1 });
    return res.status(200).json({ success: true, brands });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Contact Request / Expert Advisor Inquiries
router.post('/contact', sanitizeInput, async (req, res) => {
  try {
    const contact = new ContactRequest(req.body);
    await contact.save();

    // Also auto-create a SupportTicket so Admin Desk can chat and reply to customer!
    const subject = req.body.productTitle
      ? `Product Query: ${req.body.productTitle}`
      : `${req.body.inquiryType || 'Inquiry'}: ${req.body.machineryInterest || 'General Farm Support'}`;

    const ticket = new SupportTicket({
      userName: req.body.name,
      userPhone: req.body.phone,
      userEmail: req.body.email || '',
      subject,
      productId: req.body.productId || null,
      productTitle: req.body.productTitle || '',
      productSku: req.body.productSku || '',
      inquiryType: req.body.inquiryType || 'General Support',
      status: 'Open',
      unreadByAdmin: 1,
      unreadByUser: 0,
      messages: [
        {
          sender: 'user',
          senderName: req.body.name,
          text: req.body.message || `Customer inquiry regarding ${req.body.machineryInterest || 'agricultural machinery'}. Farm type: ${req.body.farmType || 'General'}. State: ${req.body.state || 'India'}.`,
          images: [],
          videoUrl: '',
          createdAt: new Date()
        }
      ],
      lastMessageAt: new Date()
    });
    await ticket.save();

    return res.status(201).json({
      success: true,
      message: 'Your inquiry has been submitted. Our agricultural machinery expert will contact you shortly.',
      contact,
      ticketNumber: ticket.ticketNumber
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
