const HeroSlide = require('../models/HeroSlide');
const Product = require('../models/Product');
const { broadcastRealtimeEvent } = require('../services/realtimeService');
const { logAuditAction } = require('../services/auditService');

const DEFAULT_SLIDES = [
  {
    title: 'Power Weeder 7HP Petrol 4-Stroke (AV-708)',
    tagline: 'High-torque 208cc power weeder engineered for deep inter-row soil cultivation across tough clay, cotton, and sugarcane fields.',
    badge: '🔥 DEAL OF THE DAY • 20% OFF',
    category: 'Power Weeder & Tiller',
    bgImage: '/images/machinery/power_weeder.jpg',
    productImage: '/images/machinery/power_weeder.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    isVideoBackground: false,
    specs: [
      '208cc 4-Stroke OHV Engine',
      '900mm Adjustable Tilling Width',
      '32 Heat-Treated Boron Blades',
      '2 Forward + 1 Reverse Gearbox'
    ],
    price: 38499,
    mrp: 48500,
    discountPercent: 20,
    monthlyEmi: 1171,
    productSlug: 'power-weeder-7hp-petrol-av-708',
    ctaText: 'Explore Full Machine Details',
    ctaLink: '/product/power-weeder-7hp-petrol-av-708',
    sortOrder: 0,
    isActive: true,
    countdownHours: 5
  },
  {
    title: '5HP Solar Submersible Pump Set (DC Brushless)',
    tagline: 'Heavy-duty stainless steel solar pump set with smart MPPT controller for reliable, uninterrupted farm canal and borewell irrigation.',
    badge: '☀️ 100% SOLAR • ZERO ELECTRICITY BILL',
    category: 'Pumps & Irrigation',
    bgImage: '/images/machinery/solar_pump.jpg',
    productImage: '/images/machinery/solar_pump.jpg',
    videoUrl: '',
    isVideoBackground: false,
    specs: [
      '35,000 Liters/Hour Discharge',
      'Up to 120 Meters Head Depth',
      'IP68 Stainless Steel Body',
      'Smart MPPT Solar Tracking'
    ],
    price: 74999,
    mrp: 89999,
    discountPercent: 17,
    monthlyEmi: 2280,
    productSlug: '5hp-solar-submersible-pump-set',
    ctaText: 'Explore Full Machine Details',
    ctaLink: '/product/5hp-solar-submersible-pump-set',
    sortOrder: 1,
    isActive: true,
    countdownHours: 6
  },
  {
    title: 'Heavy-Duty 6-Foot Rotavator (Multi-Speed)',
    tagline: 'Dual-speed heavy tractor rotavator for single-pass seedbed preparation in wet puddle and hard dry soil.',
    badge: '⚙️ TRACTOR PTO • MULTI-SPEED GEARBOX',
    category: 'Accessories & Attachment',
    bgImage: '/images/machinery/rotavator.jpg',
    productImage: '/images/machinery/rotavator.jpg',
    videoUrl: '',
    isVideoBackground: false,
    specs: [
      '48 Boron Steel L-Type Blades',
      'Multi-Speed Heavy Cast Iron Gearbox',
      '35 - 55 HP Tractor Compatible',
      'Depth Control Side Skids'
    ],
    price: 94500,
    mrp: 112000,
    discountPercent: 16,
    monthlyEmi: 2875,
    productSlug: 'heavy-duty-6-foot-rotavator',
    ctaText: 'Explore Full Machine Details',
    ctaLink: '/product/heavy-duty-6-foot-rotavator',
    sortOrder: 2,
    isActive: true,
    countdownHours: 4
  },
  {
    title: '50cc Backpack Multi-Crop Brush Cutter & Harvester',
    tagline: 'Harvest paddy, wheat, sugarcane, fodder grass, and dense thicket shrubs effortlessly with multi-blade attachments.',
    badge: '🌾 MULTI-CROP HARVESTING • 2.2 HP 2-STROKE',
    category: 'Harvesting Machinery',
    bgImage: '/images/machinery/brush_cutter.jpg',
    productImage: '/images/machinery/brush_cutter.jpg',
    videoUrl: '',
    isVideoBackground: false,
    specs: [
      '50cc 2.2 HP High-Torque Engine',
      'Backpack Shock-Absorbing Frame',
      '80-Teeth Alloy Crop Harvester',
      'Tap & Go Nylon Trimmer Head'
    ],
    price: 23999,
    mrp: 28500,
    discountPercent: 16,
    monthlyEmi: 1027,
    productSlug: '50cc-multi-crop-backpack-brush-cutter',
    ctaText: 'Explore Full Machine Details',
    ctaLink: '/product/50cc-multi-crop-backpack-brush-cutter',
    sortOrder: 3,
    isActive: true,
    countdownHours: 7
  },
  {
    title: '2-in-1 Battery cum Manual Knapsack Sprayer 16L',
    tagline: 'High-pressure 12V rechargeable battery sprayer with telescopic brass lance for uniform pesticide & fertilizer spraying.',
    badge: '💧 BEST VALUE • DUAL MOTOR 16L',
    category: 'Sprayers & Crop Protection',
    bgImage: '/images/machinery/sprayer.jpg',
    productImage: '/images/machinery/sprayer.jpg',
    videoUrl: '',
    isVideoBackground: false,
    specs: [
      '12V 12Ah Rechargeable Battery',
      'Up to 8 Hours Continuous Spray',
      'Telescopic Brass Spray Wand',
      'Dual High-Pressure Motor'
    ],
    price: 3499,
    mrp: 4999,
    discountPercent: 30,
    monthlyEmi: 299,
    productSlug: '2-in-1-battery-cum-manual-knapsack-agriculture-sprayer-16l',
    ctaText: 'Explore Full Machine Details',
    ctaLink: '/product/2-in-1-battery-cum-manual-knapsack-agriculture-sprayer-16l',
    sortOrder: 4,
    isActive: true,
    countdownHours: 5
  }
];

// Helper to seed defaults if collection is empty
const ensureDefaultSlides = async () => {
  const count = await HeroSlide.countDocuments();
  if (count === 0) {
    // Attempt to link matching products if they exist
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

// 1. Get Public Active Hero Slides for Storefront
const getPublicSlides = async (req, res) => {
  try {
    await ensureDefaultSlides();
    const slides = await HeroSlide.find({ isActive: true })
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
