const Product = require('../models/Product');

/**
 * Smart Multi-Signal Product Recommendation Service
 */
const getRecommendationsForProduct = async (productId, limit = 8) => {
  try {
    const currentProduct = await Product.findById(productId);
    if (!currentProduct) return [];

    // 1. Check if admin manually configured recommendations
    if (currentProduct.recommendations?.manualRecommendations?.length > 0) {
      const manualProds = await Product.find({
        _id: { $in: currentProduct.recommendations.manualRecommendations },
        status: 'Published'
      });
      if (manualProds.length >= limit) {
        return manualProds.slice(0, limit);
      }
    }

    // 2. Query candidate products in the system (excluding the current product)
    const candidates = await Product.find({
      _id: { $ne: currentProduct._id },
      status: 'Published'
    }).lean();

    if (!candidates || candidates.length === 0) return [];

    const currentApps = (currentProduct.applications || []).map(a => a.name?.toLowerCase().trim());
    const currentIdeal = (currentProduct.idealFor || []).map(i => i.toLowerCase().trim());
    const currentCompatBrands = (currentProduct.compatibility?.compatibleBrands || []).map(b => b.toLowerCase().trim());

    // 3. Multi-signal scoring algorithm
    const scoredCandidates = candidates.map(product => {
      let score = 0;

      // Category Match (+40 pts)
      if (product.category && currentProduct.category && product.category.toLowerCase() === currentProduct.category.toLowerCase()) {
        score += 40;
      }

      // Subcategory Match (+30 pts)
      if (product.subcategory && currentProduct.subcategory && product.subcategory.toLowerCase() === currentProduct.subcategory.toLowerCase()) {
        score += 30;
      }

      // Application Overlap (+15 pts per match, max 30)
      const candApps = (product.applications || []).map(a => a.name?.toLowerCase().trim());
      const appMatches = candApps.filter(a => currentApps.includes(a));
      score += Math.min(30, appMatches.length * 15);

      // Price Similarity (+20 pts for +/- 30% range, +10 pts for +/- 60% range)
      if (currentProduct.sellingPrice > 0 && product.sellingPrice > 0) {
        const ratio = product.sellingPrice / currentProduct.sellingPrice;
        if (ratio >= 0.7 && ratio <= 1.3) {
          score += 20;
        } else if (ratio >= 0.4 && ratio <= 2.0) {
          score += 10;
        }
      }

      // Brand match or compatible brand (+15 pts)
      if (product.brand && currentProduct.brand && product.brand.toLowerCase() === currentProduct.brand.toLowerCase()) {
        score += 15;
      } else if (currentCompatBrands.includes(product.brand?.toLowerCase())) {
        score += 15;
      }

      // Ideal For Farm Types / Crops Overlap (+10 pts per match, max 20)
      const candIdeal = (product.idealFor || []).map(i => i.toLowerCase().trim());
      const idealMatches = candIdeal.filter(i => currentIdeal.includes(i));
      score += Math.min(20, idealMatches.length * 10);

      // Average rating bonus (+0 to 15 pts)
      const rating = product.ratings?.averageRating || 0;
      score += Math.round(rating * 3);

      return {
        ...product,
        recommendationScore: score
      };
    });

    // Sort descending by score
    scoredCandidates.sort((a, b) => b.recommendationScore - a.recommendationScore);

    return scoredCandidates.slice(0, limit);
  } catch (error) {
    console.error(`[Recommendation Error] ${error.message}`);
    return [];
  }
};

/**
 * Frequently Bought Together Bundles
 */
const getFrequentlyBoughtTogether = async (productId) => {
  try {
    const currentProduct = await Product.findById(productId);
    if (!currentProduct) return { primary: null, bundle: [], bundleTotal: 0, bundleDiscountedTotal: 0, savings: 0 };

    // 1. Check manual configured frequently bought together
    let bundleItems = [];
    if (currentProduct.recommendations?.frequentlyBoughtTogether?.length > 0) {
      bundleItems = await Product.find({
        _id: { $in: currentProduct.recommendations.frequentlyBoughtTogether },
        status: 'Published'
      }).lean();
    }

    // 2. If fewer than 2 items configured, supplement with compatible attachments / accessories / safety gear
    if (bundleItems.length < 2) {
      const existingIds = [currentProduct._id, ...bundleItems.map(b => b._id)];
      const supplemental = await Product.find({
        _id: { $nin: existingIds },
        status: 'Published',
        $or: [
          { category: { $regex: /attachment|tool|blade|sprayer|accessory|safety/i } },
          { 'compatibility.compatibleMachines': { $regex: new RegExp(currentProduct.name, 'i') } },
          { 'compatibility.compatibleBrands': currentProduct.brand },
          { category: currentProduct.category, sellingPrice: { $lt: currentProduct.sellingPrice } }
        ]
      })
      .limit(3 - bundleItems.length)
      .lean();

      bundleItems = [...bundleItems, ...supplemental];
    }

    const allBundleProducts = [currentProduct, ...bundleItems];
    const originalTotal = allBundleProducts.reduce((sum, p) => sum + (p.mrp || p.sellingPrice), 0);
    const bundleSellingTotal = allBundleProducts.reduce((sum, p) => sum + p.sellingPrice, 0);
    
    // Bundle extra 5% discount incentive
    const bundleDiscountedTotal = Math.round(bundleSellingTotal * 0.95);
    const savings = Math.max(0, originalTotal - bundleDiscountedTotal);

    return {
      primary: currentProduct,
      bundle: bundleItems,
      allProducts: allBundleProducts,
      bundleOriginalTotal: originalTotal,
      bundleSellingTotal,
      bundleDiscountedTotal,
      bundleSavings: savings,
      bundleDiscountPercent: 5
    };
  } catch (error) {
    console.error(`[Frequently Bought Together Error] ${error.message}`);
    return { primary: null, bundle: [], bundleTotal: 0, bundleDiscountedTotal: 0, savings: 0 };
  }
};

module.exports = {
  getRecommendationsForProduct,
  getFrequentlyBoughtTogether
};
