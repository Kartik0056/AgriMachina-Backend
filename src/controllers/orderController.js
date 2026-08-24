const Order = require('../models/Order');
const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');

const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, emiDetails, couponCode, couponDiscount = 0 } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required.' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.street) {
      return res.status(400).json({ success: false, message: 'Complete shipping address is required.' });
    }

    // Authoritative verification of product pricing and stock
    const validatedItems = [];
    let subtotal = 0;
    let gstTotal = 0;
    const inventoryUpdates = [];

    for (const item of items) {
      const product = await Product.findById(item.productId || item.product);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found: ${item.productId}` });
      }

      const qty = Math.max(1, Number(item.quantity) || 1);
      if (product.stockQuantity < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${qty}`
        });
      }

      const itemPrice = product.sellingPrice;
      const itemSubtotal = itemPrice * qty;
      const itemGst = Math.round((itemSubtotal * (product.gstPercent || 12)) / 100);

      subtotal += itemSubtotal;
      gstTotal += itemGst;

      validatedItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        price: itemPrice,
        mrp: product.mrp,
        quantity: qty,
        image: product.mainImage?.url || '',
        gstPercent: product.gstPercent || 12,
        gstAmount: itemGst,
        subtotal: itemSubtotal
      });

      inventoryUpdates.push({
        product,
        qty
      });
    }

    const shippingFee = subtotal >= 4999 ? 0 : 499;
    const appliedDiscount = Math.min(subtotal, Math.max(0, Number(couponDiscount) || 0));
    const grandTotal = Math.max(0, subtotal + shippingFee - appliedDiscount);

    // Generate unique agricultural order number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(100 + Math.random() * 900);
    const orderNumber = `AG-${timestamp}-${random}`;

    const order = new Order({
      orderNumber,
      user: userId,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: shippingAddress.phone || req.user.phone || '',
      items: validatedItems,
      pricing: {
        subtotal,
        gstTotal,
        shippingFee,
        discountTotal: appliedDiscount,
        couponDiscount: appliedDiscount,
        couponCode: couponCode || '',
        grandTotal
      },
      shippingAddress,
      payment: {
        method: paymentMethod || 'COD',
        status: paymentMethod === 'COD' ? 'Pending' : 'Paid',
        emiDetails: emiDetails || { isEmi: false }
      },
      orderStatus: 'Confirmed',
      tracking: {
        courierName: 'AgriLogistics Express',
        trackingNumber: `AGX${Date.now().toString().slice(-8)}`,
        estimatedDelivery: '4 - 7 Business Days',
        statusUpdates: [
          { status: 'Confirmed', note: 'Order placed and confirmed successfully', timestamp: new Date() }
        ]
      }
    });

    await order.save();

    // Deduct stock and record inventory transaction logs
    for (const update of inventoryUpdates) {
      const prod = update.product;
      const oldStock = prod.stockQuantity;
      prod.stockQuantity -= update.qty;
      prod.analytics = prod.analytics || {};
      prod.analytics.purchasesCount = (prod.analytics.purchasesCount || 0) + update.qty;
      prod.analytics.totalRevenue = (prod.analytics.totalRevenue || 0) + (prod.sellingPrice * update.qty);
      await prod.save();

      await new InventoryLog({
        product: prod._id,
        productName: prod.name,
        sku: prod.sku,
        previousStock: oldStock,
        newStock: prod.stockQuantity,
        changeAmount: -update.qty,
        reason: `Order #${order.orderNumber}`,
        order: order._id
      }).save();
    }

    return res.status(201).json({
      success: true,
      message: 'Order created successfully!',
      order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name sku brand slug mainImage');

    return res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('items.product', 'name sku brand slug mainImage');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderDetails
};
