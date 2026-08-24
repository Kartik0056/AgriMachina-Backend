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
    const { productId } = req.params;
    const { page = 1, limit = 20, rating } = req.query;

    const query = {
      product: productId,
      status: { $in: ['Approved', 'Pending'] } // Show active and newly created reviews immediately
    };

    if (rating) query.rating = Number(rating);

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('_id user userName rating title comment farmContext images videoUrl verifiedPurchase status createdAt')
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
    const { productId } = req.params;
    const userId = req.user._id;

    // Check if existing review exists
    const existingReview = await Review.findOne({
      user: userId,
      product: productId
    });

    // Check if user has an order for this product
    const order = await Order.findOne({
      user: userId,
      'items.product': productId
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      eligible: true,
      alreadyReviewed: !!existingReview,
      existingReview: existingReview || null,
      orderId: order ? order._id : null,
      orderNumber: order ? order.orderNumber : null,
      verifiedPurchase: !!order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const submitVerifiedReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment, farmContext, images, videoUrl } = req.body;
    const userId = req.user._id;

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars.' });
    }

    if (!comment || comment.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Review comment must be at least 5 characters long.' });
    }

    // Check if user has an order
    const userOrder = await Order.findOne({
      user: userId,
      'items.product': productId
    }).sort({ createdAt: -1 });

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
      existingReview.farmContext = farmContext || existingReview.farmContext;
      if (Array.isArray(images)) existingReview.images = images;
      if (videoUrl !== undefined) existingReview.videoUrl = videoUrl.trim();
      existingReview.status = 'Approved'; // Instant publication
      await existingReview.save();

      await updateProductRatingStats(productId);

      return res.status(200).json({
        success: true,
        message: 'Your review has been updated successfully!',
        review: existingReview
      });
    }

    const newReview = new Review({
      product: productId,
      user: userId,
      userName: req.user.name || 'Verified Farmer',
      order: userOrder ? userOrder._id : null,
      rating: Number(rating),
      title: sanitizedTitle,
      comment: sanitizedComment,
      farmContext: farmContext || req.user.farmDetails || {},
      images: Array.isArray(images) ? images : [],
      videoUrl: videoUrl ? videoUrl.trim() : '',
      verifiedPurchase: !!userOrder,
      status: 'Approved' // Published immediately so user can see it right away!
    });

    await newReview.save();

    if (userOrder && !userOrder.reviewedProductIds?.includes(productId)) {
      userOrder.reviewedProductIds = userOrder.reviewedProductIds || [];
      userOrder.reviewedProductIds.push(productId);
      await userOrder.save();
    }

    await updateProductRatingStats(productId);

    return res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! Your verified review is now live.',
      review: newReview
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateMyReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment, farmContext, images, videoUrl } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    // Verify ownership
    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You can only edit your own reviews.' });
    }

    if (rating) review.rating = Number(rating);
    if (title !== undefined) review.title = sanitizeHtml(title, { allowedTags: [] }).trim();
    if (comment) review.comment = sanitizeHtml(comment, { allowedTags: [] }).trim();
    if (farmContext) review.farmContext = farmContext;
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
