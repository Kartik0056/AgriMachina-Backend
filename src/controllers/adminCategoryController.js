const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Coupon = require('../models/Coupon');
const Product = require('../models/Product');
const { logAuditAction } = require('../services/auditService');
const { broadcastRealtimeEvent } = require('../services/realtimeService');

const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

// ==========================================
// CATEGORY CONTROLLERS
// ==========================================

/**
 * GET /api/admin/categories
 * Returns all categories with enriched product count and subcategory statistics
 */
const getAdminCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 }).lean();

    // Dynamically calculate live product counts per category in DB
    const counts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    counts.forEach((c) => {
      if (c._id) {
        countMap[c._id] = c.count;
      }
    });

    const enriched = categories.map((cat) => ({
      ...cat,
      productCount: countMap[cat.name] || 0,
      subcategoriesCount: Array.isArray(cat.subcategories) ? cat.subcategories.length : 0
    }));

    return res.status(200).json({ success: true, categories: enriched });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/categories
 * Create a new Category with subcategories, commercial specs, and SEO
 */
const createCategory = async (req, res) => {
  try {
    const data = { ...req.body };

    if (!data.name || !data.name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    data.name = data.name.trim();
    if (!data.slug || !data.slug.trim()) {
      data.slug = slugify(data.name);
    } else {
      data.slug = slugify(data.slug);
    }

    // Check duplicate name or slug
    const existing = await Category.findOne({
      $or: [{ name: new RegExp(`^${data.name}$`, 'i') }, { slug: data.slug }]
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A category with the name "${data.name}" or slug "${data.slug}" already exists.`
      });
    }

    // Clean subcategories
    if (Array.isArray(data.subcategories)) {
      data.subcategories = data.subcategories
        .filter((sub) => sub && sub.name && sub.name.trim())
        .map((sub) => ({
          name: sub.name.trim(),
          slug: sub.slug ? slugify(sub.slug) : slugify(sub.name),
          description: sub.description || ''
        }));
    }

    // Clean features
    if (Array.isArray(data.features)) {
      data.features = data.features.filter((f) => f && typeof f === 'string' && f.trim().length > 0);
    }

    const cat = new Category(data);
    await cat.save();

    await logAuditAction({
      admin: req.admin,
      action: 'CATEGORY_CREATED',
      resource: 'Category',
      resourceId: cat._id,
      details: { name: cat.name, slug: cat.slug, subcategoriesCount: (cat.subcategories || []).length },
      req
    });

    broadcastRealtimeEvent('CATEGORY_CHANGED', { action: 'create', categoryId: cat._id, name: cat.name });

    return res.status(201).json({ success: true, category: cat });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/categories/:id
 * Update Category, subcategories, and automatically sync product category assignments if name changed
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const oldCat = await Category.findById(id);
    if (!oldCat) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const data = { ...req.body };

    if (data.name) {
      data.name = data.name.trim();
      if (!data.slug || !data.slug.trim()) {
        data.slug = slugify(data.name);
      } else {
        data.slug = slugify(data.slug);
      }

      // Check name/slug conflict with another category
      const conflict = await Category.findOne({
        _id: { $ne: id },
        $or: [{ name: new RegExp(`^${data.name}$`, 'i') }, { slug: data.slug }]
      });
      if (conflict) {
        return res.status(400).json({
          success: false,
          message: `Another category is already using name "${data.name}" or slug "${data.slug}".`
        });
      }
    }

    // Format subcategories
    if (Array.isArray(data.subcategories)) {
      data.subcategories = data.subcategories
        .filter((sub) => sub && sub.name && sub.name.trim())
        .map((sub) => ({
          name: sub.name.trim(),
          slug: sub.slug ? slugify(sub.slug) : slugify(sub.name),
          description: sub.description || ''
        }));
    }

    // Clean features
    if (Array.isArray(data.features)) {
      data.features = data.features.filter((f) => f && typeof f === 'string' && f.trim().length > 0);
    }

    const updatedCat = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    // If Category name changed, cascade update to all Products that had the old category name!
    if (data.name && oldCat.name !== updatedCat.name) {
      const syncResult = await Product.updateMany(
        { category: oldCat.name },
        { $set: { category: updatedCat.name } }
      );
      console.log(`[Category Update] Synchronized ${syncResult.modifiedCount} product(s) from "${oldCat.name}" to "${updatedCat.name}"`);
    }

    await logAuditAction({
      admin: req.admin,
      action: 'CATEGORY_UPDATED',
      resource: 'Category',
      resourceId: updatedCat._id,
      details: {
        name: updatedCat.name,
        oldName: oldCat.name !== updatedCat.name ? oldCat.name : undefined
      },
      req
    });

    broadcastRealtimeEvent('CATEGORY_CHANGED', { action: 'update', categoryId: updatedCat._id, name: updatedCat.name });

    return res.status(200).json({ success: true, category: updatedCat });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/admin/categories/:id/toggle
 * Quickly toggle Category active/inactive status
 */
const toggleCategoryActive = async (req, res) => {
  try {
    const { id } = req.params;
    const cat = await Category.findById(id);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    cat.isActive = !cat.isActive;
    await cat.save();

    await logAuditAction({
      admin: req.admin,
      action: 'CATEGORY_TOGGLED',
      resource: 'Category',
      resourceId: cat._id,
      details: { name: cat.name, isActive: cat.isActive },
      req
    });

    broadcastRealtimeEvent('CATEGORY_CHANGED', { action: 'toggle', categoryId: cat._id, isActive: cat.isActive });

    return res.status(200).json({ success: true, category: cat, isActive: cat.isActive });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/categories/reorder
 * Bulk update category display order
 */
const reorderCategories = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ success: false, message: 'orderedIds array is required' });
    }

    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index + 1 } }
      }
    }));

    await Category.bulkWrite(bulkOps);

    await logAuditAction({
      admin: req.admin,
      action: 'CATEGORY_REORDERED',
      resource: 'Category',
      resourceId: null,
      details: { totalUpdated: orderedIds.length },
      req
    });

    broadcastRealtimeEvent('CATEGORY_CHANGED', { action: 'reorder' });

    return res.status(200).json({ success: true, message: 'Categories order updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/admin/categories/:id
 * Delete category with safety check on active products
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;

    const cat = await Category.findById(id);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const productCount = await Product.countDocuments({ category: cat.name });
    if (productCount > 0 && force !== 'true') {
      return res.status(400).json({
        success: false,
        requiresConfirmation: true,
        productCount,
        message: `Category "${cat.name}" has ${productCount} active product(s) mapped to it. Please reassign the products first or confirm force delete.`
      });
    }

    // If force delete is explicitly confirmed and products exist, update them to "General Machinery"
    if (productCount > 0 && force === 'true') {
      await Product.updateMany(
        { category: cat.name },
        { $set: { category: 'General Machinery', subcategory: '' } }
      );
    }

    await Category.findByIdAndDelete(id);

    await logAuditAction({
      admin: req.admin,
      action: 'CATEGORY_DELETED',
      resource: 'Category',
      resourceId: cat._id,
      details: { name: cat.name, productCountReassigned: productCount },
      req
    });

    broadcastRealtimeEvent('CATEGORY_CHANGED', { action: 'delete', categoryId: id, name: cat.name });

    return res.status(200).json({
      success: true,
      message: `Category "${cat.name}" deleted successfully.${productCount > 0 ? ` ${productCount} product(s) reassigned to General Machinery.` : ''}`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// BRANDS CONTROLLERS
// ==========================================
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
      data.slug = slugify(data.name);
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

    broadcastRealtimeEvent('CATEGORY_CHANGED', { action: 'create_brand', brandId: brand._id });

    return res.status(201).json({ success: true, brand });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// COUPONS CONTROLLERS
// ==========================================
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
  toggleCategoryActive,
  reorderCategories,
  deleteCategory,
  getAdminBrands,
  createBrand,
  getAdminCoupons,
  createCoupon
};
