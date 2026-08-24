const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Review = require('../models/Review');
const ContactRequest = require('../models/ContactRequest');

const getDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Run parallel aggregation queries on MongoDB
    const [
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalOrders,
      todayOrders,
      revenueResult,
      totalCustomers,
      pendingOrders,
      pendingReviews,
      contactRequestsCount
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ stockStatus: 'LOW STOCK' }),
      Product.countDocuments({ stockStatus: 'OUT OF STOCK' }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: todayStart } }),
      Order.aggregate([
        { $match: { orderStatus: { $nin: ['Cancelled', 'Refunded'] } } },
        { $group: { _id: null, totalRevenue: { $sum: '$pricing.grandTotal' } } }
      ]),
      User.countDocuments(),
      Order.countDocuments({ orderStatus: 'Pending' }),
      Review.countDocuments({ status: 'Pending' }),
      ContactRequest.countDocuments({ status: 'New' })
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // 1. Revenue & Orders Over the Last 7 Days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyTrends = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          orderStatus: { $nin: ['Cancelled', 'Refunded'] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$pricing.grandTotal' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format 7 days timeline
    const timelineLabels = [];
    const timelineRevenue = [];
    const timelineOrders = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      timelineLabels.push(displayStr);

      const found = dailyTrends.find(item => item._id === dateStr);
      timelineRevenue.push(found ? found.revenue : 0);
      timelineOrders.push(found ? found.orders : 0);
    }

    // 2. Sales by Machinery Category
    const categorySales = await Order.aggregate([
      { $match: { orderStatus: { $nin: ['Cancelled', 'Refunded'] } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'prod'
        }
      },
      { $unwind: { path: '$prod', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$prod.category', 'Other Machinery'] },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 6 }
    ]);

    // 3. Top 5 Performing Machinery Products
    const topProducts = await Product.find()
      .sort({ 'analytics.purchasesCount': -1, sellingPrice: -1 })
      .limit(5)
      .select('name sku brand category sellingPrice stockQuantity ratings analytics mainImage')
      .lean();

    // 4. Low stock critical products list
    const criticalStockProducts = await Product.find({
      $or: [{ stockStatus: 'LOW STOCK' }, { stockStatus: 'OUT OF STOCK' }]
    })
      .limit(6)
      .select('name sku brand category stockQuantity lowStockThreshold stockStatus sellingPrice')
      .lean();

    return res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        todayOrders,
        totalOrders,
        totalCustomers,
        totalProducts,
        lowStockCount,
        outOfStockCount,
        pendingOrders,
        pendingReviews,
        contactRequestsCount
      },
      charts: {
        timeline: {
          labels: timelineLabels,
          revenue: timelineRevenue,
          orders: timelineOrders
        },
        categoryDistribution: {
          labels: categorySales.map(c => c._id),
          revenue: categorySales.map(c => c.totalRevenue),
          units: categorySales.map(c => c.totalSold)
        }
      },
      topProducts,
      criticalStockProducts
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to load dashboard data: ${error.message}`
    });
  }
};

module.exports = {
  getDashboardStats
};
