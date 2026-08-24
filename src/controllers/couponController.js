const Coupon = require('../models/Coupon');

// 1. Get All Coupons (Admin)
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: coupons.length,
      coupons
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Create Coupon (Admin)
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      validUntil,
      maxUsageLimit,
      isActive
    } = req.body;

    if (!code || !discountValue) {
      return res.status(400).json({ success: false, message: 'Coupon code and discount value are required.' });
    }

    const cleanCode = code.toUpperCase().trim();
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon with code '${cleanCode}' already exists.` });
    }

    const coupon = new Coupon({
      code: cleanCode,
      description: description || '',
      discountType: discountType === 'PERCENT' || discountType === 'percentage' ? 'PERCENT' : 'FLAT',
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: Number(maxDiscountAmount) || 0,
      validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      maxUsageLimit: Number(maxUsageLimit) || 1000,
      usageLimit: Number(maxUsageLimit) || 1000,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    await coupon.save();

    return res.status(201).json({
      success: true,
      message: `Coupon ${coupon.code} created successfully!`,
      coupon
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Update Coupon (Admin)
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      validUntil,
      maxUsageLimit,
      isActive
    } = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    if (code) {
      const cleanCode = code.toUpperCase().trim();
      if (cleanCode !== coupon.code) {
        const existing = await Coupon.findOne({ code: cleanCode, _id: { $ne: id } });
        if (existing) {
          return res.status(400).json({ success: false, message: `Coupon '${cleanCode}' already exists.` });
        }
        coupon.code = cleanCode;
      }
    }

    if (description !== undefined) coupon.description = description;
    if (discountType) coupon.discountType = discountType === 'PERCENT' || discountType === 'percentage' ? 'PERCENT' : 'FLAT';
    if (discountValue !== undefined) coupon.discountValue = Number(discountValue);
    if (minOrderAmount !== undefined) coupon.minOrderAmount = Number(minOrderAmount);
    if (maxDiscountAmount !== undefined) coupon.maxDiscountAmount = Number(maxDiscountAmount);
    if (validUntil) coupon.validUntil = new Date(validUntil);
    if (maxUsageLimit !== undefined) {
      coupon.maxUsageLimit = Number(maxUsageLimit);
      coupon.usageLimit = Number(maxUsageLimit);
    }
    if (isActive !== undefined) coupon.isActive = Boolean(isActive);

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: `Coupon ${coupon.code} updated successfully.`,
      coupon
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Delete Coupon (Admin)
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `Coupon ${coupon.code} deleted successfully.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Toggle Coupon Status (Admin)
const toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    return res.status(200).json({
      success: true,
      message: `Coupon ${coupon.code} is now ${coupon.isActive ? 'Active' : 'Inactive'}.`,
      coupon
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get Active Coupons for Storefront
const getActiveCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      validUntil: { $gte: new Date() }
    }).select('-__v').sort({ minOrderAmount: 1 });

    return res.status(200).json({
      success: true,
      coupons
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Apply / Validate Coupon in Cart or Checkout (Storefront)
const applyCoupon = async (req, res) => {
  try {
    const { code, cartSubtotal = 0 } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Please enter a coupon code.' });
    }

    const cleanCode = code.toUpperCase().trim();
    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon) {
      return res.status(404).json({ success: false, message: `Coupon code '${cleanCode}' is invalid.` });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: `Coupon '${cleanCode}' is currently inactive.` });
    }

    if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
      return res.status(400).json({ success: false, message: `Coupon '${cleanCode}' has expired.` });
    }

    const subtotal = Number(cartSubtotal) || 0;
    if (coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount for '${cleanCode}' is ₹${coupon.minOrderAmount.toLocaleString('en-IN')}. (Current: ₹${subtotal.toLocaleString('en-IN')})`
      });
    }

    if (coupon.maxUsageLimit && coupon.usedCount >= coupon.maxUsageLimit) {
      return res.status(400).json({ success: false, message: `Coupon '${cleanCode}' redemption limit has been reached.` });
    }

    // Calculate Discount Amount
    let discountAmount = 0;
    const isPercent = coupon.discountType === 'PERCENT' || coupon.discountType === 'percentage';

    if (isPercent) {
      discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount > 0 && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    const newSubtotal = Math.max(0, subtotal - discountAmount);

    return res.status(200).json({
      success: true,
      valid: true,
      message: `Coupon '${cleanCode}' applied successfully! You saved ₹${discountAmount.toLocaleString('en-IN')}.`,
      discountAmount,
      newSubtotal,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getActiveCoupons,
  applyCoupon
};
