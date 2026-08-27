const mongoose = require('mongoose');

const specificationItemSchema = new mongoose.Schema({
  group: {
    type: String,
    required: true,
    default: 'GENERAL',
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  unit: {
    type: String,
    default: '',
    trim: true
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: false });

const featureItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  icon: {
    type: String,
    default: 'CheckCircle'
  },
  image: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: false });

const applicationItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'Sprout'
  }
}, { _id: false });

const mediaItemSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: ''
  },
  caption: {
    type: String,
    default: ''
  },
  tag: {
    type: String,
    default: 'Gallery' // e.g. 01 Main, 02 Front, 03 Side, 04 Back, 05 Detail, 06 Engine, 07 Application, 08 Accessories
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: false });

const faqItemSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const variantItemSchema = new mongoose.Schema({
  sku: {
    type: String,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true // e.g. "100g", "250g", "500g", "1kg" or "500ml", "1L", "5L" or "7HP Petrol"
  },
  unit: {
    type: String,
    default: '',
    trim: true
  },
  quantity: {
    type: String,
    default: '',
    trim: true
  },
  mrp: {
    type: Number,
    default: 0,
    min: 0
  },
  sellingPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  stockQuantity: {
    type: Number,
    default: 10,
    min: 0
  },
  stockStatus: {
    type: String,
    enum: ['IN STOCK', 'LOW STOCK', 'OUT OF STOCK'],
    default: 'IN STOCK'
  },
  image: {
    type: String,
    default: ''
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const productSchema = new mongoose.Schema({
  // 1. Basic Information
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    index: true
  },
  unit: {
    type: String,
    default: 'unit', // gm, kg, mg, ml, ltr, pcs, pack, box, bottle, can, set, meter, HP, watt, unit
    trim: true
  },
  netQuantity: {
    type: String,
    default: '',
    trim: true // e.g. "500", "1", "250", "5"
  },
  unitDisplay: {
    type: String,
    default: '',
    trim: true // e.g. "500 gm", "1 kg", "1 Ltr", "7 HP"
  },
  variants: [variantItemSchema],
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    index: true
  },
  modelNumber: {
    type: String,
    default: '',
    trim: true,
    index: true
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  productType: {
    type: String,
    default: 'Machinery',
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    index: true
  },
  subcategory: {
    type: String,
    default: '',
    trim: true,
    index: true
  },
  shortDescription: {
    type: String,
    default: '',
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending Review', 'Published', 'Scheduled', 'Unpublished', 'Out of Stock', 'Discontinued'],
    default: 'Draft',
    index: true
  },

  // 2. Identification
  hsnCode: {
    type: String,
    default: '8432', // Standard HSN code for Agricultural, horticultural or forestry machinery
    trim: true
  },
  barcode: {
    type: String,
    default: '',
    trim: true
  },
  eanUpc: {
    type: String,
    default: '',
    trim: true
  },
  manufacturer: {
    type: String,
    default: '',
    trim: true
  },
  countryOfOrigin: {
    type: String,
    default: 'India',
    trim: true
  },
  manufacturerPartNumber: {
    type: String,
    default: '',
    trim: true
  },

  // 3. Pricing
  mrp: {
    type: Number,
    required: [true, 'MRP is required'],
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: 0
  },
  costPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  gstPercent: {
    type: Number,
    default: 12, // Standard GST rate for agricultural equipment in India (12% or 18%)
    min: 0,
    max: 28
  },
  taxIncluded: {
    type: Boolean,
    default: true
  },
  specialPrice: {
    type: Number,
    default: 0
  },
  saleStart: {
    type: Date
  },
  saleEnd: {
    type: Date
  },

  // 3.1 Deals of the Day & Special Promotions
  isDealOfTheDay: {
    type: Boolean,
    default: false,
    index: true
  },
  dealBadge: {
    type: String,
    default: '',
    trim: true
  },
  dealEndsAt: {
    type: Date,
    default: null
  },

  // 3.2 Extra Discount Configuration
  hasExtraDiscount: {
    type: Boolean,
    default: false
  },
  extraDiscountType: {
    type: String,
    enum: ['FLAT', 'PERCENT'],
    default: 'FLAT'
  },
  extraDiscountValue: {
    type: Number,
    default: 0,
    min: 0
  },
  extraDiscountLabel: {
    type: String,
    default: '',
    trim: true
  },
  effectivePrice: {
    type: Number,
    default: 0
  },

  // 4. Inventory
  stockQuantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    default: 0,
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 5,
    min: 0
  },
  stockStatus: {
    type: String,
    enum: ['IN STOCK', 'LOW STOCK', 'OUT OF STOCK'],
    default: 'IN STOCK',
    index: true
  },
  warehouse: {
    type: String,
    default: 'Main Agro Warehouse',
    trim: true
  },
  warehouseLocation: {
    type: String,
    default: 'Bay A-1',
    trim: true
  },
  availableQuantity: {
    type: Number,
    default: 0
  },
  reservedQuantity: {
    type: Number,
    default: 0
  },
  backorderAllowed: {
    type: Boolean,
    default: false
  },

  // 5. Media
  mainImage: {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    alt: { type: String, default: '' },
    caption: { type: String, default: '' }
  },
  gallery: [mediaItemSchema],
  video: {
    url: { type: String, default: '' },
    videoType: { type: String, enum: ['youtube', 'vimeo', 'direct', ''], default: '' },
    thumbnail: { type: String, default: '' },
    title: { type: String, default: '' },
    description: { type: String, default: '' }
  },
  demoVideoUrl: {
    type: String,
    default: ''
  },
  images360: [{
    type: String
  }],
  brochureUrl: {
    type: String,
    default: ''
  },
  userManualUrl: {
    type: String,
    default: ''
  },
  warrantyDocUrl: {
    type: String,
    default: ''
  },

  // 6. Dynamic Specifications
  specifications: [specificationItemSchema],

  // 7. Dynamic Features
  features: [featureItemSchema],

  // 8. Applications
  applications: [applicationItemSchema],

  // 9. Ideal For
  idealFor: [{
    type: String,
    trim: true
  }],

  // 10. Compatibility
  compatibility: {
    compatibleMachines: [{ type: String, trim: true }],
    compatibleModels: [{ type: String, trim: true }],
    compatibleBrands: [{ type: String, trim: true }],
    compatibleAttachments: [{ type: String, trim: true }]
  },

  // 11. What's Included
  whatsIncluded: [{
    type: String,
    trim: true
  }],

  // 12. Shipping
  shipping: {
    available: { type: Boolean, default: true },
    panIndia: { type: Boolean, default: true },
    restrictedStates: [{ type: String, trim: true }],
    estimatedDeliveryDays: { type: String, default: '4 - 7 Business Days' },
    shippingCharge: { type: Number, default: 0 },
    freeShippingThreshold: { type: Number, default: 4999 },
    installationAvailable: { type: Boolean, default: true },
    installationCharge: { type: Number, default: 0 }
  },

  // 13. Warranty
  warranty: {
    period: { type: String, default: '1 Year Manufacturer Warranty' },
    type: { type: String, default: 'Comprehensive' },
    provider: { type: String, default: 'OEM Manufacturer Service Network' },
    terms: { type: String, default: 'Covers motor, gearbox, and structural defects. Wear and tear parts like blades and belts are covered for 30 days.' },
    documentUrl: { type: String, default: '' }
  },

  // 14. EMI System
  emi: {
    enabled: { type: Boolean, default: true },
    minDownPayment: { type: Number, default: 0 },
    interestRate: { type: Number, default: 13.5 }, // Annual percentage rate
    tenureOptions: {
      type: [Number],
      default: [3, 6, 9, 12, 18, 24, 36]
    },
    processingFee: { type: Number, default: 499 },
    minMonthlyEmi: { type: Number, default: 0 },
    financePartners: {
      type: [String],
      default: ['HDFC Bank Agri', 'SBI Kisan Credit', 'Bajaj Finserv Agri', 'Kotak Mahindra', 'TVS Credit']
    }
  },

  // 15. SEO
  seo: {
    seoTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    focusKeyword: { type: String, default: '' },
    canonicalUrl: { type: String, default: '' },
    ogTitle: { type: String, default: '' },
    ogDescription: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    seoKeywords: [{ type: String, trim: true }]
  },

  // Recommendations overrides
  recommendations: {
    manualRecommendations: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    frequentlyBoughtTogether: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }]
  },

  // FAQs
  faqs: [faqItemSchema],

  // Ratings and Reviews aggregations
  ratings: {
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    ratingBreakdown: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    }
  },

  // Analytics
  analytics: {
    views: { type: Number, default: 0 },
    addToCartCount: { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },
    purchasesCount: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 }
  },

  isPublished: {
    type: Boolean,
    default: false,
    index: true
  },
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Pre-save hook: compute stock status, discount amount/percent, min monthly EMI, and SEO defaults
productSchema.pre('save', function (next) {
  // Stock status calculation
  if (this.stockQuantity <= 0) {
    this.stockStatus = 'OUT OF STOCK';
  } else if (this.stockQuantity <= this.lowStockThreshold) {
    this.stockStatus = 'LOW STOCK';
  } else {
    this.stockStatus = 'IN STOCK';
  }
  this.availableQuantity = Math.max(0, this.stockQuantity - (this.reservedQuantity || 0));

  // Pricing calculations
  if (this.mrp > 0 && this.sellingPrice > 0) {
    if (this.mrp >= this.sellingPrice) {
      this.discountAmount = Math.round(this.mrp - this.sellingPrice);
      this.discountPercent = Math.round(((this.mrp - this.sellingPrice) / this.mrp) * 100);
    } else {
      this.mrp = this.sellingPrice;
      this.discountAmount = 0;
      this.discountPercent = 0;
    }
  }

  // Extra Discount & Effective Price
  if (this.hasExtraDiscount && this.extraDiscountValue > 0) {
    if (this.extraDiscountType === 'PERCENT') {
      const extraAmt = Math.round((this.sellingPrice * this.extraDiscountValue) / 100);
      this.effectivePrice = Math.max(0, this.sellingPrice - extraAmt);
    } else {
      this.effectivePrice = Math.max(0, this.sellingPrice - this.extraDiscountValue);
    }
  } else {
    this.effectivePrice = this.sellingPrice;
  }

  // EMI minimum calculation (for 36 months reducing-balance standard)
  if (this.emi && this.emi.enabled && this.sellingPrice > 0) {
    const loanAmount = Math.max(0, this.sellingPrice - (this.emi.minDownPayment || 0));
    const annualRate = this.emi.interestRate || 13.5;
    const monthlyRate = annualRate / (12 * 100);
    const maxTenure = Math.max(...(this.emi.tenureOptions && this.emi.tenureOptions.length ? this.emi.tenureOptions : [36]));
    if (loanAmount > 0 && monthlyRate > 0 && maxTenure > 0) {
      const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, maxTenure)) / (Math.pow(1 + monthlyRate, maxTenure) - 1);
      this.emi.minMonthlyEmi = Math.round(emi);
    }
  }

  // Unit display auto-format
  if (this.netQuantity && this.unit && !this.unitDisplay) {
    this.unitDisplay = `${this.netQuantity} ${this.unit}`;
  }

  // Variant calculations
  if (Array.isArray(this.variants) && this.variants.length > 0) {
    this.variants.forEach(v => {
      if (v.mrp > 0 && v.sellingPrice > 0 && v.mrp >= v.sellingPrice) {
        v.discountPercent = Math.round(((v.mrp - v.sellingPrice) / v.mrp) * 100);
      }
      if (v.stockQuantity <= 0) {
        v.stockStatus = 'OUT OF STOCK';
      } else if (v.stockQuantity <= 5) {
        v.stockStatus = 'LOW STOCK';
      } else {
        v.stockStatus = 'IN STOCK';
      }
      if (!v.sku && this.sku) {
        v.sku = `${this.sku}-${(v.name || 'VAR').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`;
      }
    });
  }

  // Auto SEO Defaults if not filled
  if (!this.seo) this.seo = {};
  if (!this.seo.seoTitle) {
    this.seo.seoTitle = `${this.name} - ${this.brand} | Buy ${this.category || 'Online'}`;
  }
  if (!this.seo.metaDescription) {
    this.seo.metaDescription = `Buy premium ${this.name} by ${this.brand} (${this.category}). Fast delivery, verified quality & best price.`;
  }
  if (!this.seo.focusKeyword) {
    this.seo.focusKeyword = `${this.name} ${this.brand}`.toLowerCase();
  }

  // Published flag sync
  this.isPublished = this.status === 'Published';
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

// Text index for search
productSchema.index({
  name: 'text',
  brand: 'text',
  modelNumber: 'text',
  sku: 'text',
  category: 'text',
  subcategory: 'text',
  unit: 'text',
  unitDisplay: 'text',
  shortDescription: 'text'
});

module.exports = mongoose.model('Product', productSchema);
