const mongoose = require('mongoose');
const env = require('../config/env');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const Category = require('../models/Category');

const newMasaleProducts = [
  {
    name: 'Catch Royal Kashmiri Mogra Saffron (Grade-1 Super Negin Pure Kesar 1g)',
    slug: 'catch-royal-kashmiri-mogra-saffron-1g',
    brand: 'Catch Royal Heritage',
    sku: 'EID-KSR-001',
    productType: 'Spices & Groceries',
    category: 'Spices & Masale',
    subcategory: 'Whole Spices (Khada Masala)',
    shortDescription: '100% Pure Grade-1 Kashmiri Mogra Saffron with natural deep red stigma threads, intense aroma, and rich golden color.',
    description: '<p>Directly hand-harvested from the pristine saffron fields of Pampore, Kashmir. Our <strong>Grade-1 Super Negin Mogra Saffron</strong> is lab-tested for highest crocin (color), picrocrocin (flavor), and safranal (aroma). Ideal for festive biryanis, royal desserts, pregnant mothers, and daily immunity golden milk.</p>',
    mrp: 649,
    sellingPrice: 429,
    discountPercent: 34,
    discountAmount: 220,
    costPrice: 280,
    gstPercent: 5,
    hsnCode: '0910',
    unit: 'gm',
    unitDisplay: '1g Royal Glass Jar',
    netQuantity: 1,
    status: 'Published',
    featured: true,
    isDealOfTheDay: true,
    dealBadge: '🌟 ROYAL HERITAGE SELECTION',
    stock: {
      quantity: 180,
      minStockAlert: 15,
      allowBackorders: false
    },
    warehouse: 'Kashmir Harvest Depot',
    mainImage: {
      url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=85',
      alt: 'Catch Royal Kashmiri Mogra Saffron',
      title: 'Kashmiri Kesar'
    },
    gallery: [
      { url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=85', alt: 'Authentic Indian Spices', tag: '02 Spice Blend' },
      { url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=800&q=85', alt: 'Pure Golden Saffron Threads', tag: '03 Purity Test' }
    ],
    ratings: {
      averageRating: 4.9,
      totalReviews: 48,
      ratingBreakdown: { 5: 42, 4: 5, 3: 1, 2: 0, 1: 0 }
    },
    emi: {
      enabled: false,
      minMonthlyEmi: 0
    },
    warranty: {
      period: '12 Months Freshness Guarantee',
      type: '100% Purity Replacement Guarantee',
      terms: 'Hermetically sealed glass container with tamper-evident seal.',
      provider: 'Eidula Quality Assurance Lab'
    },
    shipping: {
      shippingClass: 'Express',
      estimatedDeliveryDays: '2 - 4 Business Days',
      shippingCharges: 0
    },
    variants: [
      { name: '1 Gram Royal Glass Jar', sku: 'EID-KSR-1G', sellingPrice: 429, mrp: 649, stock: 120, quantity: 1, unit: 'g' },
      { name: '2 Gram Luxury Festive Box', sku: 'EID-KSR-2G', sellingPrice: 799, mrp: 1249, stock: 60, quantity: 2, unit: 'g' }
    ],
    specifications: [
      { group: 'PURITY & ORIGIN', name: 'Botanical Source', value: 'Crocus Sativus Stigma', unit: '', order: 1 },
      { group: 'PURITY & ORIGIN', name: 'Origin / Region', value: 'Pampore, Kashmir Valley, India', unit: '', order: 2 },
      { group: 'PURITY & ORIGIN', name: 'Quality Grade', value: 'ISO 3632 Category-1 (Super Negin)', unit: '', order: 3 },
      { group: 'STORAGE & SHELF LIFE', name: 'Shelf Life', value: '24', unit: 'Months', order: 4 },
      { group: 'CERTIFICATIONS', name: 'FSSAI License', value: '10014011002233', unit: '', order: 5 },
      { group: 'CERTIFICATIONS', name: 'Dietary Preference', value: '100% Natural, Vegan, Non-GMO', unit: '', order: 6 }
    ],
    features: [
      { title: 'Grade-1 Certified Purity', description: 'Lab-tested with highest crocin concentration for vibrant aroma and pure color.', icon: 'CheckCircle' },
      { title: 'Cold-Preserved Freshness', description: 'Packed in airtight luxury glass vials to preserve volatile essential oils.', icon: 'Sparkles' }
    ],
    idealFor: [
      'Authentic Indian Curries',
      'Festive Hampers & Gifts',
      'Chefs & Gourmet Kitchens',
      'Immunity & Ayurvedic Wellness'
    ],
    whatsIncluded: [
      '1x Pure Kashmiri Mogra Saffron (1g)',
      'Airtight Moisture-Proof Glass Phial',
      'Certificate of Purity & Recipe Card'
    ],
    faqs: [
      { question: 'How to test if this Kashmiri saffron is 100% genuine?', answer: 'Dip 2-3 strands in warm water or milk. Pure saffron gradually infuses a rich golden yellow hue over 10-15 minutes, while the strands retain their sharp crimson-red shape without dissolving.' },
      { question: 'What is the shelf life of this saffron?', answer: 'It maintains peak aromatic potency for 24 months when kept sealed in a cool, dark pantry away from sunlight.' }
    ],
    seoKeywords: 'kashmiri kesar, pure saffron, mogra kesar, saffron for pregnant women, eidula saffron, grade 1 saffron'
  },
  {
    name: '24 Mantra Organic Pure Lakadong Turmeric Powder (High Curcumin 7.5% 250g)',
    slug: '24-mantra-organic-lakadong-turmeric-powder-250g',
    brand: '24 Mantra Organic',
    sku: 'EID-HLD-002',
    productType: 'Spices & Groceries',
    category: 'Spices & Masale',
    subcategory: 'Ground Masala Powders',
    shortDescription: 'World-renowned Meghalaya Lakadong Turmeric with exceptionally high 7.5% natural curcumin for golden health and culinary vibrancy.',
    description: '<p>Sourced from the pristine Jaintia Hills of Meghalaya, <strong>Lakadong Turmeric</strong> is celebrated worldwide for boasting over 3x the curcumin levels of ordinary turmeric. Stone-ground at low temperatures to retain its natural essential oils, earthy flavor, and healing therapeutic properties.</p>',
    mrp: 299,
    sellingPrice: 189,
    discountPercent: 37,
    discountAmount: 110,
    costPrice: 115,
    gstPercent: 5,
    hsnCode: '0910',
    unit: 'gm',
    unitDisplay: '250g Eco Pack',
    netQuantity: 250,
    status: 'Published',
    featured: true,
    isDealOfTheDay: false,
    stock: {
      quantity: 240,
      minStockAlert: 20,
      allowBackorders: false
    },
    warehouse: 'Northeast Spice Reserve Hub',
    mainImage: {
      url: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800&q=85',
      alt: 'Organic Lakadong Turmeric Powder',
      title: 'Lakadong Haldi'
    },
    gallery: [
      { url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=85', alt: 'Pure Haldi Powder', tag: '02 Texture' }
    ],
    ratings: {
      averageRating: 4.8,
      totalReviews: 36,
      ratingBreakdown: { 5: 31, 4: 4, 3: 1, 2: 0, 1: 0 }
    },
    emi: { enabled: false, minMonthlyEmi: 0 },
    warranty: {
      period: '12 Months Shelf Life',
      type: '100% Adulteration-Free Guarantee',
      terms: 'Triple-tested in NABL accredited laboratories for zero lead chromate and zero starch.',
      provider: 'Eidula Organic Quality Cell'
    },
    shipping: {
      shippingClass: 'Standard',
      estimatedDeliveryDays: '3 - 5 Business Days',
      shippingCharges: 0
    },
    variants: [
      { name: '250g Zip-Lock Pouch', sku: 'EID-HLD-250G', sellingPrice: 189, mrp: 299, stock: 150, quantity: 250, unit: 'g' },
      { name: '500g Value Pack', sku: 'EID-HLD-500G', sellingPrice: 349, mrp: 549, stock: 90, quantity: 500, unit: 'g' }
    ],
    specifications: [
      { group: 'PURITY & ORIGIN', name: 'Curcumin Content', value: '7.2% - 7.8% (Verified Lab Tested)', unit: '%', order: 1 },
      { group: 'PURITY & ORIGIN', name: 'Source Region', value: 'Jaintia Hills, Meghalaya', unit: '', order: 2 },
      { group: 'PROCESSING', name: 'Milling Method', value: 'Cold Stone Ground (No Heat Damage)', unit: '', order: 3 },
      { group: 'CERTIFICATIONS', name: 'Organic Certification', value: 'India Organic & USDA Organic Certified', unit: '', order: 4 }
    ],
    idealFor: [
      'Everyday Cooking',
      'Immunity & Ayurvedic Wellness',
      'Chefs & Gourmet Kitchens'
    ],
    whatsIncluded: [
      '1x 24 Mantra Organic Lakadong Turmeric (250g Zip-Lock Pack)'
    ],
    faqs: [
      { question: 'Why is Lakadong turmeric better than normal market turmeric?', answer: 'Ordinary commercial haldi contains only 2% to 3% curcumin. Pure Lakadong contains 7% to 8% curcumin, offering far superior anti-inflammatory properties, deep golden color, and rich natural aroma without needing artificial dyes.' }
    ],
    seoKeywords: 'lakadong haldi, organic turmeric powder, high curcumin turmeric, 24 mantra organic turmeric, eidula spices'
  },
  {
    name: 'Urban Platter Tellicherry Black Pepper Whole (TGSEB Bold Grade 200g)',
    slug: 'urban-platter-tellicherry-black-pepper-whole-200g',
    brand: 'Urban Platter Gourmet',
    sku: 'EID-PEP-003',
    productType: 'Spices & Groceries',
    category: 'Spices & Masale',
    subcategory: 'Whole Spices (Khada Masala)',
    shortDescription: 'Extra-bold 4.75mm Tellicherry Garbled Special Extra Bold (TGSEB) whole black peppercorns from Malabar Coast.',
    description: '<p>The pinnacle of black pepper. Hand-selected <strong>TGSEB Bold Grade Peppercorns</strong> from the hills of Wayanad and Thalassery (Malabar coast). Naturally vine-ripened, sun-cured, and rich in piperine for a pungent, citrusy bite that elevates steaks, soups, marinades, and fresh salads.</p>',
    mrp: 375,
    sellingPrice: 249,
    discountPercent: 34,
    discountAmount: 126,
    costPrice: 160,
    gstPercent: 5,
    hsnCode: '0904',
    unit: 'gm',
    unitDisplay: '200g Reusable Jar',
    netQuantity: 200,
    status: 'Published',
    featured: true,
    isDealOfTheDay: false,
    stock: {
      quantity: 190,
      minStockAlert: 15,
      allowBackorders: false
    },
    warehouse: 'Malabar Coastal Depot',
    mainImage: {
      url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&q=85',
      alt: 'Tellicherry Black Pepper Whole',
      title: 'Malabar Black Pepper'
    },
    gallery: [
      { url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=85', alt: 'Whole Black Peppercorns', tag: '02 Whole Spice' }
    ],
    ratings: {
      averageRating: 4.9,
      totalReviews: 29,
      ratingBreakdown: { 5: 26, 4: 3, 3: 0, 2: 0, 1: 0 }
    },
    emi: { enabled: false, minMonthlyEmi: 0 },
    variants: [
      { name: '200g Reusable Aroma Jar', sku: 'EID-PEP-200G', sellingPrice: 249, mrp: 375, stock: 120, quantity: 200, unit: 'g' },
      { name: '400g Refill Pouch', sku: 'EID-PEP-400G', sellingPrice: 449, mrp: 699, stock: 70, quantity: 400, unit: 'g' }
    ],
    specifications: [
      { group: 'PURITY & ORIGIN', name: 'Grade Specification', value: 'TGSEB (> 4.75mm diameter)', unit: '', order: 1 },
      { group: 'PURITY & ORIGIN', name: 'Geographical Origin', value: 'Malabar Coast, Kerala, India', unit: '', order: 2 },
      { group: 'CERTIFICATIONS', name: 'FSSAI License', value: '10017011004122', unit: '', order: 3 }
    ],
    idealFor: [
      'Everyday Cooking',
      'Chefs & Gourmet Kitchens',
      'Immunity & Ayurvedic Wellness'
    ],
    whatsIncluded: [
      '1x Urban Platter Tellicherry Black Peppercorns (200g Jar)'
    ],
    faqs: [
      { question: 'What does TGSEB stand for?', answer: 'TGSEB stands for Tellicherry Garbled Special Extra Bold. It is the highest international quality grade of black pepper, representing only the largest 10% of ripe peppercorns with the most complex, lingering flavor.' }
    ],
    seoKeywords: 'tellicherry black pepper, whole black pepper, malabar kali mirch, tgseb pepper, eidula spices'
  },
  {
    name: 'Everest Royal Shahi Biryani Masala (Handcrafted Spice Blend 100g)',
    slug: 'everest-royal-shahi-biryani-masala-100g',
    brand: 'Everest Spices',
    sku: 'EID-BRY-004',
    productType: 'Spices & Groceries',
    category: 'Spices & Masale',
    subcategory: 'Blended Gourmet Masala',
    shortDescription: 'Master blend of 21 slow-roasted aromatic whole spices including star anise, mace, green cardamom, and royal cumin.',
    description: '<p>Crafted following authentic Dum Biryani heritage recipes from Lucknow and Hyderabad. <strong>Everest Shahi Biryani Masala</strong> combines mace, star anise, nutmeg, black cardamom, and stone flower to impart unforgettable royal aroma and rich, balanced spice warmth to veg and non-veg biryanis.</p>',
    mrp: 140,
    sellingPrice: 99,
    discountPercent: 29,
    discountAmount: 41,
    costPrice: 65,
    gstPercent: 5,
    hsnCode: '0910',
    unit: 'gm',
    unitDisplay: '100g Aroma Seal Carton',
    netQuantity: 100,
    status: 'Published',
    featured: true,
    isDealOfTheDay: false,
    stock: {
      quantity: 310,
      minStockAlert: 25,
      allowBackorders: false
    },
    warehouse: 'Mumbai Spice Hub',
    mainImage: {
      url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=85',
      alt: 'Everest Shahi Biryani Masala',
      title: 'Biryani Masala Blend'
    },
    gallery: [
      { url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=800&q=85', alt: 'Biryani Spices', tag: '02 Aroma Blend' }
    ],
    ratings: {
      averageRating: 4.8,
      totalReviews: 54,
      ratingBreakdown: { 5: 46, 4: 6, 3: 2, 2: 0, 1: 0 }
    },
    emi: { enabled: false, minMonthlyEmi: 0 },
    variants: [
      { name: '100g Box (Pack of 1)', sku: 'EID-BRY-100G', sellingPrice: 99, mrp: 140, stock: 200, quantity: 100, unit: 'g' },
      { name: '100g Box (Pack of 3 Value Saver)', sku: 'EID-BRY-300G', sellingPrice: 269, mrp: 420, stock: 110, quantity: 300, unit: 'g' }
    ],
    specifications: [
      { group: 'INGREDIENTS', name: 'Blend Composition', value: 'Star Anise, Mace, Nutmeg, Cinnamon, Black Cardamom, Cloves', unit: '', order: 1 },
      { group: 'STORAGE & SHELF LIFE', name: 'Shelf Life', value: '12', unit: 'Months', order: 2 },
      { group: 'CERTIFICATIONS', name: 'Agmark Certified', value: 'Agmark Grade-A Special', unit: '', order: 3 }
    ],
    idealFor: [
      'Authentic Indian Curries',
      'Biryani & Festive Delicacies',
      'Chefs & Gourmet Kitchens'
    ],
    whatsIncluded: [
      '1x Everest Royal Shahi Biryani Masala (100g Sealed Foil Box)'
    ],
    faqs: [
      { question: 'Is this suitable for both Veg and Chicken/Mutton Biryani?', answer: 'Yes! The spice ratio is exquisitely balanced to complement Basmati rice, paneer, mixed vegetables, chicken, mutton, or soy chaap.' }
    ],
    seoKeywords: 'biryani masala, shahi biryani powder, everest biryani masala, dum biryani spices, eidula masale'
  }
];

async function seedEidulaMasale() {
  await connectDB();
  console.log('🔄 Connected to MongoDB. Seeding Eidula Masale & Purging Any Old Agriculture Items...');

  // 1. Delete any old agricultural machinery products
  const deleteResult = await Product.deleteMany({
    $or: [
      { category: { $regex: /agricultur|weeder|tiller|sprayer|harvester/i } },
      { name: { $regex: /power weeder|rotary tiller|submersible pump motor|brush cutter|knapsack/i } },
      { productType: 'Machinery' }
    ]
  });
  console.log(`🧹 Purged ${deleteResult.deletedCount} old agricultural/machinery products.`);

  // 2. Insert or update the new authentic Masale products
  for (const prodData of newMasaleProducts) {
    const existing = await Product.findOne({ sku: prodData.sku });
    if (existing) {
      await Product.updateOne({ sku: prodData.sku }, { $set: prodData });
      console.log(`✅ Updated existing Masale product: ${prodData.name}`);
    } else {
      await Product.create(prodData);
      console.log(`✨ Added new Masale product: ${prodData.name}`);
    }
  }

  // 3. Make sure Spices & Masale category is active and at top order
  await Category.updateOne(
    { name: 'Spices & Masale' },
    {
      $set: {
        order: 1,
        featured: true,
        tagline: 'Direct From Heritage Spice Estates',
        description: '100% Pure whole spices, ground masala powders, and royal saffron with verified Agmark and FSSAI certifications.'
      }
    },
    { upsert: true }
  );

  console.log('🎉 EIDULA MASALE SEED COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

seedEidulaMasale().catch((err) => {
  console.error('❌ Failed to seed Eidula Masale:', err);
  process.exit(1);
});
