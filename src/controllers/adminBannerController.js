const HeroSlide = require('../models/HeroSlide');
const Product = require('../models/Product');
const { broadcastRealtimeEvent } = require('../services/realtimeService');
const { logAuditAction } = require('../services/auditService');

const cacheService = require('../services/cacheService');

const DEFAULT_SLIDES = [
  {
    title: 'Royal Malabar & Kashmiri Gourmet Spices',
    tagline: '100% pure organic whole spices, royal biryani masale, and high-curcumin Lakadong turmeric.',
    badge: '🌶️ 100% PURE & ORGANIC • FSSAI CERTIFIED',
    category: 'Spices & Masale',
    bgImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1600&q=80',
    productImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80',
    videoUrl: '',
    isVideoBackground: false,
    specs: ['Agmark & FSSAI Certified', 'Aroma-Lock Fresh Sealed', 'Zero Artificial Colors'],
    price: 499,
    mrp: 699,
    discountPercent: 28,
    monthlyEmi: 166,
    productSlug: 'royal-spices-collection',
    ctaText: 'Explore Spices & Masale',
    ctaLink: '/products?category=Spices+%26+Masale',
    sortOrder: 0,
    isActive: true,
    countdownHours: 5
  },
  {
    title: 'UltraSound Pro Wireless ANC Earbuds (48h)',
    tagline: 'Hybrid 42dB Active Noise Cancellation, 48-hour ultra endurance, and custom bass boost acoustic drivers.',
    badge: '⚡ MEGA TECH SALE • 45% OFF',
    category: 'Electronics & Smart Tech',
    bgImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&q=80',
    productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    videoUrl: '',
    isVideoBackground: false,
    specs: ['42dB Hybrid Active Noise Cancellation', '48 Hours Total Playback', '1-Yr Brand Warranty'],
    price: 1899,
    mrp: 3499,
    discountPercent: 45,
    monthlyEmi: 316,
    productSlug: 'ultrasound-pro-earbuds',
    ctaText: 'View Electronics Deals',
    ctaLink: '/products?category=Electronics+%26+Smart+Tech',
    sortOrder: 1,
    isActive: true,
    countdownHours: 6
  },
  {
    title: 'Artisan Handcrafted Ceramic Ambient Lamp',
    tagline: 'Warm textured stoneware ceramic base with woven natural linen shade for cozy Scandinavian living spaces.',
    badge: '🏺 ARTISAN HANDCRAFTED LUXURY',
    category: 'Home Decor & Living',
    bgImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1600&q=80',
    productImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80',
    videoUrl: '',
    isVideoBackground: false,
    specs: ['Handcrafted Stoneware', 'Natural Woven Linen Drum Shade', 'Warm Dimmable LED Bulb'],
    price: 2499,
    mrp: 3999,
    discountPercent: 37,
    monthlyEmi: 416,
    productSlug: 'ceramic-ambient-lamp',
    ctaText: 'Discover Home Decor',
    ctaLink: '/products?category=Home+Decor+%26+Living',
    sortOrder: 2,
    isActive: true,
    countdownHours: 4
  },
  {
    title: 'Heavy-Duty 1000W Pure Copper Mixer Grinder',
    tagline: 'Commercial-grade 100% copper motor with multi-utility leakproof stainless steel jars for tough grinding.',
    badge: '🍳 BESTSELLER • 5-YEAR MOTOR WARRANTY',
    category: 'Kitchen & Home Appliances',
    bgImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1600&q=80',
    productImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80',
    videoUrl: '',
    isVideoBackground: false,
    specs: ['1000W 100% Copper Motor', '4 Food-Grade Stainless Steel Jars', 'Overload Protection'],
    price: 3499,
    mrp: 5499,
    discountPercent: 36,
    monthlyEmi: 583,
    productSlug: 'heavy-duty-mixer-grinder-1000w',
    ctaText: 'Explore Kitchen Appliances',
    ctaLink: '/products?category=Kitchen+%26+Home+Appliances',
    sortOrder: 3,
    isActive: true,
    countdownHours: 5
  }
];

// Helper to seed defaults if collection is empty
const ensureDefaultSlides = async () => {
  const count = await HeroSlide.countDocuments();
  if (count === 0) {
    for (const s of DEFAULT_SLIDES) {
      if (s.productSlug) {
        const prod = await Product.findOne({ slug: s.productSlug }).select('_id slug');
        if (prod) {
          s.productId = prod._id;
        }
      }
    }
    await HeroSlide.insertMany(DEFAULT_SLIDES);
  }
};

// 1. Get Public Active Hero Slides for Storefront (Cached with 60s TTL)
const getPublicSlides = async (req, res) => {
  try {
    const cached = cacheService.get('public_hero_slides');
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json({
        success: true,
        count: cached.length,
        slides: cached
      });
    }

    await ensureDefaultSlides();
    const slides = await HeroSlide.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .populate('productId', 'name slug sellingPrice mrp discountPercent mainImage category')
      .lean();

    cacheService.set('public_hero_slides', slides, 60);
    res.setHeader('X-Cache', 'MISS');

    return res.status(200).json({
      success: true,
      count: slides.length,
      slides
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get All Hero Slides for Admin Portal
const getAdminSlides = async (req, res) => {
  try {
    await ensureDefaultSlides();
    const slides = await HeroSlide.find({})
      .sort({ sortOrder: 1, createdAt: -1 })
      .populate('productId', 'name slug sellingPrice mrp discountPercent mainImage category')
      .lean();

    return res.status(200).json({
      success: true,
      count: slides.length,
      slides
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Create a New Hero Slide
const createSlide = async (req, res) => {
  try {
    const data = req.body;
    if (!data.title) {
      return res.status(400).json({ success: false, message: 'Slide title is required.' });
    }

    // Determine sort order
    const maxSort = await HeroSlide.findOne({}).sort({ sortOrder: -1 }).select('sortOrder');
    data.sortOrder = maxSort ? maxSort.sortOrder + 1 : 0;

    const slide = new HeroSlide(data);
    await slide.save();

    cacheService.invalidate('public_hero_slides');
    await logAuditAction(req, 'CREATE_HERO_SLIDE', 'HeroSlide', slide._id, { title: slide.title });
    broadcastRealtimeEvent('BANNER_CHANGED', { action: 'create', slideId: slide._id });

    return res.status(201).json({
      success: true,
      message: 'Home page hero slide created successfully.',
      slide
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update an Existing Hero Slide
const updateSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const slide = await HeroSlide.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!slide) {
      return res.status(404).json({ success: false, message: 'Hero slide not found.' });
    }

    cacheService.invalidate('public_hero_slides');
    await logAuditAction(req, 'UPDATE_HERO_SLIDE', 'HeroSlide', slide._id, { title: slide.title });
    broadcastRealtimeEvent('BANNER_CHANGED', { action: 'update', slideId: slide._id });

    return res.status(200).json({
      success: true,
      message: 'Hero slide updated successfully.',
      slide
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Delete a Hero Slide
const deleteSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const slide = await HeroSlide.findByIdAndDelete(id);

    if (!slide) {
      return res.status(404).json({ success: false, message: 'Hero slide not found.' });
    }

    cacheService.invalidate('public_hero_slides');
    await logAuditAction(req, 'DELETE_HERO_SLIDE', 'HeroSlide', id, { title: slide.title });
    broadcastRealtimeEvent('BANNER_CHANGED', { action: 'delete', slideId: id });

    return res.status(200).json({
      success: true,
      message: 'Hero slide deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Reorder Slides (Up/Down or Custom Sequence)
const reorderSlides = async (req, res) => {
  try {
    const { slideIds } = req.body;
    if (!Array.isArray(slideIds)) {
      return res.status(400).json({ success: false, message: 'slideIds array is required.' });
    }

    const updates = slideIds.map((id, index) =>
      HeroSlide.findByIdAndUpdate(id, { sortOrder: index })
    );
    await Promise.all(updates);

    cacheService.invalidate('public_hero_slides');

    await logAuditAction(req, 'REORDER_HERO_SLIDES', 'HeroSlide', null, { count: slideIds.length });
    broadcastRealtimeEvent('BANNER_CHANGED', { action: 'reorder' });

    return res.status(200).json({
      success: true,
      message: 'Slides reordered successfully.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPublicSlides,
  getAdminSlides,
  createSlide,
  updateSlide,
  deleteSlide,
  reorderSlides
};
