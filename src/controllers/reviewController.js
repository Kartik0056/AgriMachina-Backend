const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const sanitizeHtml = require('sanitize-html');

// Helper to recalculate and persist product rating averages
const updateProductRatingStats = async (productId) => {
  try {
    const reviews = await Review.find({ product: productId, status: { $in: ['Approved', 'Pending'] } }, { rating: 1 });
    const count = reviews.length;
    if (count === 0) {
      await Product.findByIdAndUpdate(productId, {
        'ratings.average': 0,
        'ratings.count': 0
      });
      return;
    }
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = Number((sum / count).toFixed(1));
    await Product.findByIdAndUpdate(productId, {
      'ratings.average': average,
      'ratings.count': count
    });
  } catch (err) {
    console.error('Error updating product rating stats:', err);
  }
};

const getProductReviews = async (req, res) => {
  try {
    const productId = req.params.productId || req.query.productId;
    const { page = 1, limit = 20, rating } = req.query;

    const query = {
      product: productId,
      status: { $in: ['Approved', 'Pending'] } // Show active reviews immediately
    };

    if (rating) query.rating = Number(rating);

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('_id user userName rating title comment images videoUrl verifiedPurchase status createdAt')
      .lean();

    // Rating breakdown
    const allApproved = await Review.find({ product: productId, status: { $in: ['Approved', 'Pending'] } }, { rating: 1 });
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    allApproved.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      breakdown[star] = (breakdown[star] || 0) + 1;
      sum += r.rating;
    });

    const averageRating = allApproved.length > 0 ? Number((sum / allApproved.length).toFixed(1)) : 0;

    return res.status(200).json({
      success: true,
      total,
      averageRating,
      totalReviews: allApproved.length,
      breakdown,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      reviews
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const checkReviewEligibility = async (req, res) => {
  try {
    const productId = req.params.productId || req.query.productId;
    const userId = req.user._id;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    // 1. Check if user has an existing review for this product
    const existingReview = await Review.findOne({
      user: userId,
      product: productId
    });

    // 2. Query delivered orders for this user and product
    const deliveredOrder = await Order.findOne({
      user: userId,
      'items.product': productId,
      orderStatus: 'Delivered'
    }).sort({ createdAt: -1 });

    if (deliveredOrder) {
      return res.status(200).json({
        success: true,
        eligible: true,
        reason: 'DELIVERED',
        alreadyReviewed: !!existingReview,
        existingReview: existingReview || null,
        orderId: deliveredOrder._id,
        orderNumber: deliveredOrder.orderNumber,
        deliveredAt: deliveredOrder.deliveredAt || deliveredOrder.updatedAt,
        verifiedPurchase: true,
        message: 'Aapne is product ko purchase kiya hai aur order deliver ho chuka hai. Aap verified review de sakte hain.'
      });
    }

    // 3. Check if user purchased it, but order is NOT yet delivered
    const anyOrder = await Order.findOne({
      user: userId,
      'items.product': productId
    }).sort({ createdAt: -1 });

    if (anyOrder) {
      return res.status(200).json({
        success: true,
        eligible: false,
        reason: 'ORDER_NOT_DELIVERED',
        alreadyReviewed: false,
        existingReview: null,
        orderId: anyOrder._id,
        orderNumber: anyOrder.orderNumber,
        currentOrderStatus: anyOrder.orderStatus,
        verifiedPurchase: false,
        message: `Aapka order #${anyOrder.orderNumber} abhi "${anyOrder.orderStatus}" status me hai. Order deliver hone ke baad hi aap review likh sakte hain.`
      });
    }

    // 4. User has not purchased this product at all
    return res.status(200).json({
      success: true,
      eligible: false,
      reason: 'NOT_PURCHASED',
      alreadyReviewed: false,
      existingReview: null,
      verifiedPurchase: false,
      message: 'Product review dene ke liye is product ko buy karna zaroori hai. Verified delivery ke baad hi review allow hota hai.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const submitVerifiedReview = async (req, res) => {
  try {
    const productId = req.params.productId || req.body.productId;
    const { rating, title, comment, images, videoUrl } = req.body;
    const userId = req.user._id;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars.' });
    }

    if (!comment || comment.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Review comment must be at least 5 characters long.' });
    }

    // STRICT CHECK: User MUST have a delivered order for this product
    const deliveredOrder = await Order.findOne({
      user: userId,
      'items.product': productId,
      orderStatus: 'Delivered'
    }).sort({ createdAt: -1 });

    if (!deliveredOrder) {
      const anyOrder = await Order.findOne({
        user: userId,
        'items.product': productId
      }).sort({ createdAt: -1 });

      if (anyOrder) {
        return res.status(403).json({
          success: false,
          eligible: false,
          reason: 'ORDER_NOT_DELIVERED',
          currentOrderStatus: anyOrder.orderStatus,
          orderNumber: anyOrder.orderNumber,
          message: `Product review tabhi diya ja sakta hai jab order deliver ho jaye. Aapka order #${anyOrder.orderNumber} abhi "${anyOrder.orderStatus}" status me hai.`
        });
      }

      return res.status(403).json({
        success: false,
        eligible: false,
        reason: 'NOT_PURCHASED',
        message: 'Product review dene ke liye pehle is product ko buy karna zaroori hai aur order deliver hona chahiye.'
      });
    }

    // Check if user already submitted a review
    let existingReview = await Review.findOne({
      user: userId,
      product: productId
    });

    const sanitizedTitle = sanitizeHtml(title || '', { allowedTags: [] }).trim();
    const sanitizedComment = sanitizeHtml(comment, { allowedTags: [] }).trim();

    if (existingReview) {
      // Update existing review
      existingReview.rating = Number(rating);
      existingReview.title = sanitizedTitle;
      existingReview.comment = sanitizedComment;
      existingReview.order = deliveredOrder._id;
      existingReview.verifiedPurchase = true;
      if (Array.isArray(images)) existingReview.images = images;
      if (videoUrl !== undefined) existingReview.videoUrl = videoUrl.trim();
      existingReview.status = 'Approved'; // Instant publication
      await existingReview.save();

      await updateProductRatingStats(productId);

      return res.status(200).json({
        success: true,
        message: 'Aapka verified review successfully update ho gaya hai!',
        review: existingReview
      });
    }

    const newReview = new Review({
      product: productId,
      user: userId,
      userName: req.user.name || 'Verified Customer',
      order: deliveredOrder._id,
      rating: Number(rating),
      title: sanitizedTitle,
      comment: sanitizedComment,
      images: Array.isArray(images) ? images : [],
      videoUrl: videoUrl ? videoUrl.trim() : '',
      verifiedPurchase: true,
      status: 'Approved' // Published immediately so user can see it right away
    });

    await newReview.save();

    if (deliveredOrder && !deliveredOrder.reviewedProductIds?.includes(productId)) {
      deliveredOrder.reviewedProductIds = deliveredOrder.reviewedProductIds || [];
      deliveredOrder.reviewedProductIds.push(productId);
      await deliveredOrder.save();
    }

    await updateProductRatingStats(productId);

    return res.status(201).json({
      success: true,
      message: 'Dhanyawad! Aapka verified review publish ho gaya hai.',
      review: newReview
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateMyReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment, images, videoUrl } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    // Verify ownership
    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You can only edit your own reviews.' });
    }

    // Verify delivered order exists
    const deliveredOrder = await Order.findOne({
      user: userId,
      'items.product': review.product,
      orderStatus: 'Delivered'
    });

    if (!deliveredOrder) {
      return res.status(403).json({
        success: false,
        message: 'Review update karne ke liye aapka order deliver hona zaroori hai.'
      });
    }

    if (rating) review.rating = Number(rating);
    if (title !== undefined) review.title = sanitizeHtml(title, { allowedTags: [] }).trim();
    if (comment) review.comment = sanitizeHtml(comment, { allowedTags: [] }).trim();
    if (images && Array.isArray(images)) review.images = images;
    if (videoUrl !== undefined) review.videoUrl = videoUrl.trim();
    review.status = 'Approved';

    await review.save();
    await updateProductRatingStats(review.product);

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully!',
      review
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteMyReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    // Verify ownership
    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You can only delete your own reviews.' });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(id);

    await updateProductRatingStats(productId);

    return res.status(200).json({
      success: true,
      message: 'Your review has been deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProductReviews,
  checkReviewEligibility,
  submitVerifiedReview,
  updateMyReview,
  deleteMyReview
};
