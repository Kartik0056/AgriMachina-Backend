const Order = require('../models/Order');
const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const { logAuditAction } = require('../services/auditService');
const { broadcastRealtimeEvent } = require('../services/realtimeService');

const getAllOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.orderStatus = status;
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { orderNumber: regex },
        { customerName: regex },
        { customerEmail: regex },
        { customerPhone: regex }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'name email phone farmDetails');

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      orders
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone farmDetails')
      .populate('items.product', 'name sku brand mainImage modelNumber');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const status = req.body.status || req.body.orderStatus;
    const note = req.body.note || req.body.tracking?.note;
    const courierName = req.body.courierName || req.body.tracking?.courierName;
    const trackingNumber = req.body.trackingNumber || req.body.tracking?.trackingNumber;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const oldStatus = order.orderStatus;
    order.orderStatus = status;

    // If delivered: set deliveredAt timestamp
    if (status === 'Delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
      order.payment.status = 'Paid';
    }

    order.tracking = order.tracking || {};
    if (courierName) order.tracking.courierName = courierName;
    if (trackingNumber) order.tracking.trackingNumber = trackingNumber;

    order.tracking.statusUpdates = order.tracking.statusUpdates || [];
    order.tracking.statusUpdates.push({
      status,
      note: note || `Order marked as ${status}`,
      updatedBy: req.admin?.name || 'Admin',
      timestamp: new Date()
    });

    // If cancelled, restock products
    if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
      for (const item of order.items) {
        const prod = await Product.findById(item.product);
        if (prod) {
          const oldStock = prod.stockQuantity;
          prod.stockQuantity += item.quantity;
          await prod.save();

          await new InventoryLog({
            product: prod._id,
            productName: prod.name,
            sku: prod.sku,
            previousStock: oldStock,
            newStock: prod.stockQuantity,
            changeAmount: item.quantity,
            reason: `Order #${order.orderNumber} Cancelled - Restock`,
            admin: req.admin?._id,
            adminName: req.admin?.name || 'Admin',
            order: order._id
          }).save();
        }
      }
    }

    await order.save();

    // Broadcast live update so customer dashboard & tracking page update without refresh
    try {
      broadcastRealtimeEvent('ORDER_STATUS_CHANGED', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        userId: String(order.user),
        oldStatus,
        newStatus: status,
        orderStatus: status,
        tracking: order.tracking,
        payment: order.payment,
        timestamp: new Date()
      });
    } catch (bErr) {
      console.warn('[Broadcast Warning]', bErr.message);
    }

    await logAuditAction({
      admin: req.admin,
      action: 'ORDER_STATUS_CHANGED',
      resource: 'Order',
      resourceId: order._id,
      details: { orderNumber: order.orderNumber, oldStatus, newStatus: status, note },
      req
    });

    return res.status(200).json({
      success: true,
      message: `Order #${order.orderNumber} status updated to ${status}.`,
      order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus
};
