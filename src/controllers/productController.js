const Product = require('../models/Product');
const { getRecommendationsForProduct, getFrequentlyBoughtTogether } = require('../services/recommendationService');

const getPublicProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 16,
      category,
      subcategory,
      brand,
      idealFor,
      minPrice,
      maxPrice,
      search,
      sortBy = 'popular'
    } = req.query;

    const query = { status: 'Published' };

    if (category) {
      query.category = new RegExp(`^${category.trim()}$`, 'i');
    }
    if (subcategory) {
      query.subcategory = new RegExp(`^${subcategory.trim()}$`, 'i');
    }
    if (brand) {
      query.brand = new RegExp(`^${brand.trim()}$`, 'i');
    }
    if (idealFor) {
      query.idealFor = { $in: [new RegExp(idealFor.trim(), 'i')] };
    }

    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = Number(minPrice);
      if (maxPrice) query.sellingPrice.$lte = Number(maxPrice);
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { sku: searchRegex },
        { brand: searchRegex },
        { modelNumber: searchRegex },
        { category: searchRegex },
        { shortDescription: searchRegex }
      ];
    }

    let sortOptions = {};
    if (sortBy === 'price-low') {
      sortOptions = { sellingPrice: 1 };
    } else if (sortBy === 'price-high') {
      sortOptions = { sellingPrice: -1 };
    } else if (sortBy === 'rating') {
      sortOptions = { 'ratings.averageRating': -1, 'ratings.totalReviews': -1 };
    } else if (sortBy === 'newest') {
      sortOptions = { createdAt: -1 };
    } else {
      // Default: popular
      sortOptions = { 'analytics.views': -1, 'analytics.purchasesCount': -1, createdAt: -1 };
    }

    if (req.query.dealsOnly === 'true') {
      query.$or = [
        { isDealOfTheDay: true },
        { hasExtraDiscount: true }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .select('name slug brand modelNumber sku category subcategory mrp sellingPrice discountPercent gstPercent stockStatus mainImage ratings emi idealFor shortDescription isPublished isDealOfTheDay dealBadge dealEndsAt hasExtraDiscount extraDiscountType extraDiscountValue extraDiscountLabel effectivePrice')
      .lean();

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      products
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getDeals = async (req, res) => {
  try {
    let deals = await Product.find({
      status: 'Published',
      $or: [
        { isDealOfTheDay: true },
        { hasExtraDiscount: true }
      ]
    }).limit(8).lean();

    if (deals.length < 4) {
      const moreDeals = await Product.find({
        status: 'Published',
        _id: { $nin: deals.map(d => d._id) }
      })
      .sort({ discountPercent: -1, sellingPrice: -1 })
      .limit(4 - deals.length)
      .lean();
      deals = [...deals, ...moreDeals];
    }

    return res.status(200).json({
      success: true,
      count: deals.length,
      deals
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getPublicProductBySlugOrId = async (req, res) => {
  try {
    const { identifier } = req.params;
    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);

    const query = isObjectId ? { _id: identifier } : { slug: identifier };
    const product = await Product.findOne(query)
      .populate('recommendations.manualRecommendations', 'name slug brand sellingPrice mrp mainImage ratings')
      .populate('recommendations.frequentlyBoughtTogether', 'name slug brand sellingPrice mrp mainImage ratings');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unavailable.'
      });
    }

    // Increment views count asynchronously
    Product.findByIdAndUpdate(product._id, { $inc: { 'analytics.views': 1 } }).exec();

    // Generate valid Schema.org Product Structured Data
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: [product.mainImage?.url, ...(product.gallery || []).map(g => g.url)].filter(Boolean),
      description: product.shortDescription || product.name,
      sku: product.sku,
      mpn: product.modelNumber || product.sku,
      brand: {
        '@type': 'Brand',
        name: product.brand
      },
      offers: {
        '@type': 'Offer',
        url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/product/${product.slug}`,
        priceCurrency: 'INR',
        price: product.sellingPrice,
        priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        itemCondition: 'https://schema.org/NewCondition',
        availability: product.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'AgriMachina India'
        }
      }
    };

    if (product.ratings?.totalReviews > 0) {
      structuredData.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: product.ratings.averageRating,
        reviewCount: product.ratings.totalReviews,
        bestRating: '5',
        worstRating: '1'
      };
    }

    return res.status(200).json({
      success: true,
      product,
      structuredData
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const recommendations = await getRecommendationsForProduct(id, 8);
    return res.status(200).json({ success: true, recommendations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getFrequentlyBoughtTogetherBundle = async (req, res) => {
  try {
    const { id } = req.params;
    const bundleData = await getFrequentlyBoughtTogether(id);
    return res.status(200).json({ success: true, bundle: bundleData });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPublicProducts,
  getDeals,
  getPublicProductBySlugOrId,
  getRecommendations,
  getFrequentlyBoughtTogetherBundle
};
