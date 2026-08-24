const Review = require('../models/Review');
const Product = require('../models/Product');
const { logAuditAction } = require('../services/auditService');

/**
 * Recomputes Product ratings breakdown & average based on Approved reviews in MongoDB
 */
const recalculateProductRatings = async (productId) => {
  const approvedReviews = await Review.find({ product: productId, status: 'Approved' });
  const total = approvedReviews.length;

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  for (const r of approvedReviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    breakdown[star] = (breakdown[star] || 0) + 1;
    sum += r.rating;
  }

  const avg = total > 0 ? Number((sum / total).toFixed(1)) : 0;

  await Product.findByIdAndUpdate(productId, {
    'ratings.averageRating': avg,
    'ratings.totalReviews': total,
    'ratings.ratingBreakdown': breakdown
  });

  return { averageRating: avg, totalReviews: total, breakdown };
};

const getAllReviews = async (req, res) => {
  try {
    const { status, rating, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (rating) query.rating = Number(rating);
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { userName: searchRegex },
        { title: searchRegex },
        { comment: searchRegex }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('product', 'name sku brand mainImage')
      .populate('user', 'name email phone')
      .populate('order', 'orderNumber orderStatus deliveredAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      reviews
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const moderateReview = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    if (status) review.status = status;
    review.moderatedBy = req.admin?._id;
    review.moderatedAt = new Date();
    if (notes) review.moderationNotes = notes;
    await review.save();

    await recalculateProductRatings(review.product);

    return res.status(200).json({
      success: true,
      message: `Review status updated to ${review.status}.`,
      review
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const approveReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    review.status = 'Approved';
    review.moderatedBy = req.admin?._id;
    review.moderatedAt = new Date();
    review.moderationNotes = req.body.notes || 'Approved by Moderator';
    await review.save();

    // Recalculate product aggregate ratings
    await recalculateProductRatings(review.product);

    return res.status(200).json({
      success: true,
      message: 'Review approved and published to product page.',
      review
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const rejectReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    review.status = 'Rejected';
    review.moderatedBy = req.admin?._id;
    review.moderatedAt = new Date();
    review.moderationNotes = req.body.reason || 'Rejected by Moderator';
    await review.save();

    await recalculateProductRatings(review.product);

    return res.status(200).json({
      success: true,
      message: 'Review rejected.',
      review
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(req.params.id);

    await recalculateProductRatings(productId);

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  recalculateProductRatings,
  getAllReviews,
  moderateReview,
  approveReview,
  rejectReview,
  deleteReview
};
