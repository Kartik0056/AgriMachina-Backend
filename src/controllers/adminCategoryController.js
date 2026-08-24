const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Coupon = require('../models/Coupon');
const { logAuditAction } = require('../services/auditService');

// Categories
const getAdminCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 });
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const data = req.body;
    if (!data.slug && data.name) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    const cat = new Category(data);
    await cat.save();

    await logAuditAction({
      admin: req.admin,
      action: 'CATEGORY_CREATED',
      resource: 'Category',
      resourceId: cat._id,
      details: { name: cat.name, slug: cat.slug },
      req
    });

    return res.status(201).json({ success: true, category: cat });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });

    await logAuditAction({
      admin: req.admin,
      action: 'CATEGORY_UPDATED',
      resource: 'Category',
      resourceId: cat._id,
      details: { name: cat.name },
      req
    });

    return res.status(200).json({ success: true, category: cat });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const cat = await Category.findByIdAndDelete(req.params.id);
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });

    await logAuditAction({
      admin: req.admin,
      action: 'CATEGORY_DELETED',
      resource: 'Category',
      resourceId: cat._id,
      details: { name: cat.name },
      req
    });

    return res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Brands
const getAdminBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ name: 1 });
    return res.status(200).json({ success: true, brands });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createBrand = async (req, res) => {
  try {
    const data = req.body;
    if (!data.slug && data.name) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    const brand = new Brand(data);
    await brand.save();

    await logAuditAction({
      admin: req.admin,
      action: 'BRAND_CREATED',
      resource: 'Brand',
      resourceId: brand._id,
      details: { name: brand.name },
      req
    });

    return res.status(201).json({ success: true, brand });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Coupons
const getAdminCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, coupons });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createCoupon = async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();

    await logAuditAction({
      admin: req.admin,
      action: 'COUPON_CREATED',
      resource: 'Coupon',
      resourceId: coupon._id,
      details: { code: coupon.code, discountValue: coupon.discountValue },
      req
    });

    return res.status(201).json({ success: true, coupon });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAdminBrands,
  createBrand,
  getAdminCoupons,
  createCoupon
};
