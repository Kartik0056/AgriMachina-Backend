const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const { logAuditAction } = require('../services/auditService');
const { calculateEMIBreakdown } = require('../services/emiService');

const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      category = '',
      brand = '',
      status = '',
      stockStatus = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { sku: searchRegex },
        { brand: searchRegex },
        { modelNumber: searchRegex },
        { category: searchRegex }
      ];
    }

    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (status) query.status = status;
    if (stockStatus) query.stockStatus = stockStatus;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      products
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to fetch products: ${error.message}`
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('recommendations.manualRecommendations', 'name sku brand sellingPrice mrp mainImage status')
      .populate('recommendations.frequentlyBoughtTogether', 'name sku brand sellingPrice mrp mainImage status');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const data = req.body;

    // Check SKU collision
    if (!data.sku) {
      return res.status(400).json({ success: false, message: 'SKU is required.' });
    }
    const existingSku = await Product.findOne({ sku: data.sku.toUpperCase().trim() });
    if (existingSku) {
      return res.status(400).json({ success: false, message: `SKU "${data.sku}" already exists.` });
    }

    // Generate unique slug
    let baseSlug = (data.name + '-' + data.sku).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let slug = baseSlug;
    let count = 1;
    while (await Product.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }
    data.slug = slug;

    // Authoritative pricing calculations
    data.mrp = Number(data.mrp) || Number(data.sellingPrice) || 0;
    data.sellingPrice = Number(data.sellingPrice) || 0;
    data.stockQuantity = Number(data.stockQuantity) || 0;
    data.lowStockThreshold = Number(data.lowStockThreshold) || 5;

    // Ensure mainImage exists
    if (!data.mainImage || !data.mainImage.url) {
      data.mainImage = {
        url: data.gallery && data.gallery[0] ? data.gallery[0].url : 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80',
        alt: data.name,
        caption: `${data.name} ${data.brand || ''}`
      };
    }

    const newProduct = new Product(data);
    await newProduct.save();

    // Log Initial Inventory
    if (newProduct.stockQuantity > 0) {
      await new InventoryLog({
        product: newProduct._id,
        productName: newProduct.name,
        sku: newProduct.sku,
        previousStock: 0,
        newStock: newProduct.stockQuantity,
        changeAmount: newProduct.stockQuantity,
        reason: 'Initial Product Stock Creation',
        admin: req.admin?._id,
        adminName: req.admin?.name || 'Admin'
      }).save();
    }

    // Log Audit
    await logAuditAction({
      admin: req.admin,
      action: 'PRODUCT_CREATE',
      resource: 'Product',
      resourceId: newProduct._id,
      details: { name: newProduct.name, sku: newProduct.sku, price: newProduct.sellingPrice, status: newProduct.status },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: newProduct
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const data = req.body;
    const oldStock = product.stockQuantity;
    const oldPrice = product.sellingPrice;

    // Check SKU if changed
    if (data.sku && data.sku.toUpperCase().trim() !== product.sku) {
      const skuCheck = await Product.findOne({
        sku: data.sku.toUpperCase().trim(),
        _id: { $ne: product._id }
      });
      if (skuCheck) {
        return res.status(400).json({ success: false, message: `SKU "${data.sku}" is already in use by another product.` });
      }
      data.sku = data.sku.toUpperCase().trim();
    }

    // Track Inventory Changes
    if (data.stockQuantity !== undefined && Number(data.stockQuantity) !== oldStock) {
      const newStock = Number(data.stockQuantity);
      const change = newStock - oldStock;

      await new InventoryLog({
        product: product._id,
        productName: product.name,
        sku: product.sku,
        previousStock: oldStock,
        newStock: newStock,
        changeAmount: change,
        reason: data.stockChangeReason || 'Admin Manual Stock Update',
        admin: req.admin?._id,
        adminName: req.admin?.name || 'Admin'
      }).save();

      await logAuditAction({
        admin: req.admin,
        action: 'STOCK_CHANGED',
        resource: 'Product',
        resourceId: product._id,
        details: { sku: product.sku, oldStock, newStock, diff: change, reason: data.stockChangeReason || 'Manual adjustment' },
        req
      });
    }

    // Track Price Changes
    if (data.sellingPrice !== undefined && Number(data.sellingPrice) !== oldPrice) {
      await logAuditAction({
        admin: req.admin,
        action: 'PRICE_CHANGED',
        resource: 'Product',
        resourceId: product._id,
        details: { sku: product.sku, oldPrice, newPrice: Number(data.sellingPrice) },
        req
      });
    }

    // Apply updates
    Object.assign(product, data);
    await product.save();

    await logAuditAction({
      admin: req.admin,
      action: 'PRODUCT_UPDATED',
      resource: 'Product',
      resourceId: product._id,
      details: { name: product.name, sku: product.sku, status: product.status },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);

    await logAuditAction({
      admin: req.admin,
      action: 'PRODUCT_DELETED',
      resource: 'Product',
      resourceId: product._id,
      details: { name: product.name, sku: product.sku },
      req
    });

    return res.status(200).json({
      success: true,
      message: `Product ${product.name} (${product.sku}) deleted successfully.`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const duplicateProduct = async (req, res) => {
  try {
    const original = await Product.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, message: 'Original product not found.' });
    }

    const obj = original.toObject();
    delete obj._id;
    delete obj.createdAt;
    delete obj.updatedAt;
    delete obj.__v;

    // Generate unique clone SKU and slug
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    obj.sku = `${original.sku}-CLONE-${randomSuffix}`;
    obj.name = `${original.name} (Copy)`;
    obj.slug = `${original.slug}-copy-${randomSuffix}`;
    obj.status = 'Draft';
    obj.isPublished = false;
    obj.analytics = { views: 0, addToCartCount: 0, wishlistCount: 0, purchasesCount: 0, conversionRate: 0, totalRevenue: 0 };
    obj.ratings = { averageRating: 0, totalReviews: 0, ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };

    const duplicate = new Product(obj);
    await duplicate.save();

    await logAuditAction({
      admin: req.admin,
      action: 'PRODUCT_DUPLICATE',
      resource: 'Product',
      resourceId: duplicate._id,
      details: { originalSku: original.sku, newSku: duplicate.sku },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Product duplicated successfully with a unique SKU.',
      product: duplicate
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const togglePublish = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const willPublish = product.status !== 'Published';
    product.status = willPublish ? 'Published' : 'Draft';
    product.isPublished = willPublish;
    if (willPublish && !product.publishedAt) {
      product.publishedAt = new Date();
    }
    await product.save();

    await logAuditAction({
      admin: req.admin,
      action: willPublish ? 'PRODUCT_PUBLISHED' : 'PRODUCT_UNPUBLISHED',
      resource: 'Product',
      resourceId: product._id,
      details: { sku: product.sku, status: product.status },
      req
    });

    return res.status(200).json({
      success: true,
      message: `Product status changed to ${product.status}`,
      product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const uploadProductMedia = async (req, res) => {
  try {
    if (!req.files && !req.file) {
      return res.status(400).json({ success: false, message: 'No media files provided.' });
    }

    const files = req.files || [req.file];
    const uploadedMedia = files.map(file => ({
      url: `/uploads/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));

    return res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      files: uploadedMedia
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getProductAnalytics = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id, {
      name: 1,
      sku: 1,
      analytics: 1,
      ratings: 1,
      stockQuantity: 1,
      sellingPrice: 1
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const views = product.analytics?.views || 0;
    const purchases = product.analytics?.purchasesCount || 0;
    const conversionRate = views > 0 ? ((purchases / views) * 100).toFixed(1) : 0;

    return res.status(200).json({
      success: true,
      analytics: {
        ...product.analytics?.toObject(),
        conversionRate: Number(conversionRate),
        revenue: (product.sellingPrice * purchases)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  togglePublish,
  uploadProductMedia,
  getProductAnalytics
};
