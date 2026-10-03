const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const connectDB = require('../config/db');
const bootstrapAdminSystem = require('../services/adminBootstrapService');

const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const User = require('../models/User');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const InventoryLog = require('../models/InventoryLog');

const seedDatabase = async () => {
  try {
    await connectDB();
    await bootstrapAdminSystem();

    console.log('[Seeder] Cleaning existing product & catalog collections...');
    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
      Brand.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({}),
      Coupon.deleteMany({}),
      InventoryLog.deleteMany({}),
      User.deleteMany({ role: { $ne: 'ADMIN' } })
    ]);

    // 1. Seed Multi-Category Catalog
    console.log('[Seeder] Seeding Multi-Category Catalog...');
    const categories = await Category.insertMany([
      {
        name: 'Spices & Masale',
        slug: 'spices-masale',
        description: 'Authentic 100% pure whole spices, ground masala powders, and gourmet blended spices direct from certified farms.',
        icon: '🌶️',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80',
        categoryType: 'Spices & Groceries',
        unitType: 'weight',
        startingPrice: '₹45',
        features: [
          '100% Pure & Authentic Spices',
          'Agmark & FSSAI Certified',
          'No Added Artificial Colors or Preservatives',
          'Aroma Lock Multi-Layer Packaging'
        ],
        subcategories: [
          { name: 'Ground Masala Powders', slug: 'ground-masala', description: 'Pure Haldi, Mirch, Dhaniya & Jeera powders' },
          { name: 'Blended Gourmet Masala', slug: 'blended-masala', description: 'Garam Masala, Chana Masala, Pav Bhaji & Biryani blends' },
          { name: 'Whole Spices (Khada Masala)', slug: 'whole-spices', description: 'Cardamom, Cloves, Black Pepper & Cinnamon sticks' }
        ],
        order: 1
      },
      {
        name: 'Electronics & Smart Tech',
        slug: 'electronics-smart-tech',
        description: 'Premium wireless audio, smart wearables, high-efficiency motors, and cutting-edge home electronics.',
        icon: 'Headphones',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
        categoryType: 'Electronics & Appliances',
        unitType: 'piece',
        startingPrice: '₹799',
        features: [
          'Official OEM Brand Warranties',
          '100% Genuine Certified Gadgets',
          'Fast USB-C & Wireless Charging',
          'Pan-India Doorstep Replacement'
        ],
        subcategories: [
          { name: 'Wireless Audio & Earbuds', slug: 'wireless-audio', description: 'Active noise cancelling headphones and TWS earbuds' },
          { name: 'Smart Home & Wearables', slug: 'smart-wearables', description: 'Fitness watches, smart plugs & home automation' },
          { name: 'Power Drives & Motors', slug: 'power-drives', description: 'High-torque inverter and copper motors' }
        ],
        order: 2
      },
      {
        name: 'Home Decor & Living',
        slug: 'home-decor-living',
        description: 'Handcrafted luxury ceramics, artisan lighting, ambient furnishings, and modern indoor decor.',
        icon: 'Home',
        image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80',
        categoryType: 'Home & Living',
        unitType: 'piece',
        startingPrice: '₹499',
        features: [
          'Artisan Handcrafted Ceramics & Wood',
          'Modern Minimalist Aesthetics',
          'Eco-Friendly Sustainable Materials',
          'Safe Transit Drop-Tested Packing'
        ],
        subcategories: [
          { name: 'Lamps & Ambient Lighting', slug: 'ambient-lighting', description: 'Ceramic bedside lamps and brass pendant fixtures' },
          { name: 'Vases & Ceramic Accents', slug: 'ceramic-accents', description: 'Studio pottery and minimalist vases' },
          { name: 'Wall Decor & Clockwork', slug: 'wall-decor', description: 'Art frames and textured wall art' }
        ],
        order: 3
      },
      {
        name: 'Kitchen & Home Appliances',
        slug: 'kitchen-home-appliances',
        description: 'High-power copper mixer grinders, induction cooktops, air fryers, and modern culinary essentials.',
        icon: 'Coffee',
        image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&q=80',
        categoryType: 'Electronics & Appliances',
        unitType: 'piece',
        startingPrice: '₹1,299',
        features: [
          '100% Heavy Copper Wound Motors',
          'Food Grade 304 Stainless Steel',
          'Overload Protection Technology',
          'Up to 5-Year Comprehensive Warranty'
        ],
        subcategories: [
          { name: 'Mixer Grinders & Blenders', slug: 'mixer-grinders', description: 'Heavy duty 750W-1000W copper grinders' },
          { name: 'Cooktops & Air Fryers', slug: 'cooktops-fryers', description: 'Touch induction cooktops & oil-free air fryers' },
          { name: 'Electric Kettles & Choppers', slug: 'kettles-choppers', description: 'Quick-boil kettles and stainless choppers' }
        ],
        order: 4
      },
      {
        name: 'Hardware & Power Tools',
        slug: 'hardware-power-tools',
        description: 'Professional impact drills, angle grinders, toolkits, and precision workshop gear.',
        icon: 'Wrench',
        image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80',
        categoryType: 'Hardware & Tools',
        unitType: 'piece',
        startingPrice: '₹999',
        features: [
          'Professional Heavy-Duty Grade',
          'Ergonomic Vibration Dampening',
          'Hardened Alloy Steel Gears',
          'Official Service Network Support'
        ],
        subcategories: [
          { name: 'Impact Drills & Rotary Hammers', slug: 'drills-hammers', description: 'Variable speed corded and cordless drills' },
          { name: 'Angle Grinders & Cutters', slug: 'grinders-cutters', description: 'Heavy metal and marble cutting tools' },
          { name: 'Tool Kits & Precision Sets', slug: 'toolkit-sets', description: 'Complete DIY and mechanic toolkits' }
        ],
        order: 5
      },
      {
        name: 'Organic Groceries & Oils',
        slug: 'organic-groceries-oils',
        description: 'Cold-pressed kachi ghani oils, unpolished organic pulses, pure desi ghee, and premium pantry staples.',
        icon: 'ShoppingBag',
        image: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=600&q=80',
        categoryType: 'Spices & Groceries',
        unitType: 'volume',
        startingPrice: '₹85',
        features: [
          'Cold Pressed Wood Churned (Kachi Ghani)',
          'Chemical & Hexane Free Extraction',
          'Direct Farm Sourced Organic Pulses',
          'Rich in Natural Nutrients & Antioxidants'
        ],
        subcategories: [
          { name: 'Cold-Pressed Oils', slug: 'cold-pressed-oils', description: 'Pure Mustard, Groundnut, Sesame & Coconut oils' },
          { name: 'Organic Pulses & Dals', slug: 'organic-pulses', description: 'Unpolished Arhar, Moong, Chana & Urad' },
          { name: 'Farm Fresh Ghee & Honey', slug: 'ghee-honey', description: 'A2 Vedic Bilona Ghee & Raw Wildflower Honey' }
        ],
        order: 6
      }
    ]);

    // 2. Seed Brands
    console.log('[Seeder] Seeding Multi-Category Brands...');
    const brands = await Brand.insertMany([
      { name: 'Everest', slug: 'everest', countryOfOrigin: 'India', description: 'India’s most trusted spice brand with pure whole & ground spices.' },
      { name: 'Tata Sampann', slug: 'tata-sampann', countryOfOrigin: 'India', description: 'Naturally rich, unadulterated spices and farm-sourced organic pulses.' },
      { name: 'boAt Lifestyle', slug: 'boat-lifestyle', countryOfOrigin: 'India', description: 'Leading consumer tech and acoustic wearable brand in India.' },
      { name: 'Philips', slug: 'philips', countryOfOrigin: 'Netherlands', description: 'Global benchmark in domestic appliances, personal care, and home tech.' },
      { name: 'Havells', slug: 'havells', countryOfOrigin: 'India', description: 'Heavy-duty industrial and home electrical appliances & motors.' },
      { name: 'Bosch Professional', slug: 'bosch-professional', countryOfOrigin: 'Germany', description: 'World leader in heavy-duty power tools and precision engineering.' },
      { name: 'Urban Bloom Living', slug: 'urban-bloom-living', countryOfOrigin: 'India', description: 'Handcrafted luxury ceramic lamps, stoneware, and interior aesthetics.' },
      { name: 'Fortune Foods', slug: 'fortune-foods', countryOfOrigin: 'India', description: 'Finest cold-pressed kachi ghani oils and wholesome kitchen staples.' }
    ]);

    // 3. Seed Sample Customers
    console.log('[Seeder] Seeding Customer Users...');
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash('Customer@2026', salt);

    const user1 = await new User({
      name: 'Ramesh Patel',
      email: 'ramesh.patel@example.com',
      phone: '+91 98765 43210',
      password: passHash,
      role: 'CUSTOMER',
      addresses: [{
        fullName: 'Ramesh Patel',
        phone: '+91 98765 43210',
        street: 'Flat 402, Green Park Avenue, Main Road',
        villageCity: 'Ahmedabad',
        district: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380015',
        isDefault: true
      }]
    }).save();

    const user2 = await new User({
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      phone: '+91 98123 45678',
      password: passHash,
      role: 'CUSTOMER',
      addresses: [{
        fullName: 'Priya Sharma',
        phone: '+91 98123 45678',
        street: 'Villa 12, Palm Meadows, Whitefield',
        villageCity: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        pincode: '560066',
        isDefault: true
      }]
    }).save();

    // 4. Seed Multi-Category Products
    console.log('[Seeder] Seeding Balanced Multi-Category Products...');

    // Product 1: Everest Shahi Garam Masala (Spices & Masale)
    const product1 = new Product({
      name: 'Everest Shahi Garam Masala (Special Pure Blend 500g)',
      slug: 'everest-shahi-garam-masala',
      brand: 'Everest',
      modelNumber: 'EGM-500',
      sku: 'EVR-GM-500G',
      productType: 'Spices & Groceries',
      category: 'Spices & Masale',
      subcategory: 'Blended Gourmet Masala',
      unit: 'gm',
      netQuantity: '500',
      unitDisplay: '500 gm',
      variants: [
        { name: '100g Pack', unit: 'gm', quantity: '100', mrp: 55, sellingPrice: 45, discountPercent: 18, stockQuantity: 150, stockStatus: 'IN STOCK', sku: 'EVR-GM-100G', isDefault: false },
        { name: '250g Pack', unit: 'gm', quantity: '250', mrp: 125, sellingPrice: 105, discountPercent: 16, stockQuantity: 100, stockStatus: 'IN STOCK', sku: 'EVR-GM-250G', isDefault: false },
        { name: '500g Pack', unit: 'gm', quantity: '500', mrp: 230, sellingPrice: 195, discountPercent: 15, stockQuantity: 80, stockStatus: 'IN STOCK', sku: 'EVR-GM-500G', isDefault: true },
        { name: '1 Kg Family Pack', unit: 'kg', quantity: '1', mrp: 440, sellingPrice: 375, discountPercent: 15, stockQuantity: 50, stockStatus: 'IN STOCK', sku: 'EVR-GM-1KG', isDefault: false }
      ],
      shortDescription: 'Exquisite aromatic blend of 13 hand-selected whole spices, slow roasted and ground to perfection for authentic Indian cuisine.',
      description: `
        <h3>Aromatic Royal Spices for Authentic Taste</h3>
        <p><strong>Everest Shahi Garam Masala</strong> is crafted from finely selected premium Indian spices including green cardamom, mace, cinnamon, black pepper, and cloves.</p>
        <h4>Quality & Processing Standards</h4>
        <ul>
          <li><strong>Cryogenic Cold Grinding:</strong> Retains essential volatile oils and maximum natural aroma.</li>
          <li><strong>Zero Preservatives:</strong> 100% pure vegetarian spice mix with no filler starches.</li>
          <li><strong>Agmark Grade A Certified:</strong> Rigorously tested for purity and high pungency.</li>
        </ul>
      `,
      status: 'Published',
      hsnCode: '0910',
      manufacturer: 'Everest Food Products Pvt Ltd',
      countryOfOrigin: 'India',
      mrp: 230,
      sellingPrice: 195,
      costPrice: 130,
      gstPercent: 5,
      taxIncluded: true,
      stockQuantity: 80,
      lowStockThreshold: 15,
      stockStatus: 'IN STOCK',
      warehouse: 'Mumbai Spice Hub',
      mainImage: {
        url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80',
        alt: 'Everest Shahi Garam Masala Powder and Whole Spices',
        caption: 'Everest Shahi Garam Masala 100% Pure Blend'
      },
      gallery: [
        { url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80', tag: '01 Main', order: 1 },
        { url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&q=80', tag: '02 Spices', order: 2 }
      ],
      specifications: [
        { group: 'GENERAL', name: 'Form / State', value: 'Fine Ground Powder', unit: '', order: 1 },
        { group: 'GENERAL', name: 'Net Quantity', value: '500', unit: 'gm', order: 2 },
        { group: 'INGREDIENTS', name: 'Ingredients', value: 'Coriander, Cumin, Black Pepper, Cardamom, Clove, Cinnamon, Nutmeg', unit: '', order: 3 },
        { group: 'STORAGE & SHELF LIFE', name: 'Shelf Life', value: '12', unit: 'Months', order: 4 },
        { group: 'CERTIFICATIONS', name: 'FSSAI License', value: '10012022000295', unit: '', order: 5 }
      ],
      idealFor: ['Home Cooking', 'Gourmet Kitchens', 'Restaurants'],
      whatsIncluded: ['500g Aroma-Sealed Foil Pouch with Zip Lock'],
      shipping: {
        available: true,
        panIndia: true,
        estimatedDeliveryDays: '2 - 4 Business Days',
        shippingCharge: 40,
        freeShippingThreshold: 499,
        installationAvailable: false
      },
      warranty: {
        period: '100% Freshness Guarantee',
        type: 'Money Back Quality Guarantee',
        provider: 'Everest Care',
        terms: 'Replacement or refund if freshness seal is compromised upon delivery.'
      },
      emi: { enabled: false },
      ratings: {
        averageRating: 4.9,
        totalReviews: 42,
        ratingBreakdown: { 5: 38, 4: 4, 3: 0, 2: 0, 1: 0 }
      }
    });

    // Product 2: boAt Airdopes 441 Pro ANC Wireless Earbuds (Electronics & Smart Tech)
    const product2 = new Product({
      name: 'boAt Airdopes 441 Pro ANC Wireless Earbuds with 130H Playtime',
      slug: 'boat-airdopes-441-pro-anc-earbuds',
      brand: 'boAt Lifestyle',
      modelNumber: 'AD-441-PRO',
      sku: 'BOAT-AD441-BLK',
      productType: 'Electronics & Gadgets',
      category: 'Electronics & Smart Tech',
      subcategory: 'Wireless Audio & Earbuds',
      shortDescription: 'Active Noise Cancelling true wireless earbuds with 130 hours playback, ENx quad mics, Beast Mode low-latency gaming, and IPX7 water resistance.',
      description: `
        <h3>Immersive Sound with 32dB Active Noise Cancellation</h3>
        <p>The <strong>boAt Airdopes 441 Pro</strong> elevates your acoustic experience with 10mm titanium dynamic drivers and Hybrid ANC that silences ambient drone.</p>
        <h4>Key Engineering Features</h4>
        <ul>
          <li><strong>Massive 130-Hour Battery:</strong> 2600mAh carry case functions as an emergency mobile power bank.</li>
          <li><strong>ENx Quad Microphones:</strong> Crystal clear call audio suppresses wind and background clamor.</li>
          <li><strong>Beast Mode Gaming:</strong> Sub-50ms ultra-low latency synchronization.</li>
          <li><strong>IPX7 Sweat & Water Resistance:</strong> Ready for rain and intense workouts.</li>
        </ul>
      `,
      status: 'Published',
      hsnCode: '8518',
      manufacturer: 'Imagine Marketing Ltd',
      countryOfOrigin: 'India',
      mrp: 5999,
      sellingPrice: 2499,
      costPrice: 1550,
      gstPercent: 18,
      taxIncluded: true,
      stockQuantity: 65,
      lowStockThreshold: 10,
      stockStatus: 'IN STOCK',
      warehouse: 'Delhi Central Hub',
      mainImage: {
        url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        alt: 'boAt Airdopes Pro Premium Earbuds',
        caption: 'boAt Airdopes 441 Pro ANC Earbuds'
      },
      gallery: [
        { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', tag: '01 Main', order: 1 },
        { url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80', tag: '02 Earbuds', order: 2 }
      ],
      specifications: [
        { group: 'AUDIO', name: 'Driver Size', value: '10', unit: 'mm Titanium', order: 1 },
        { group: 'AUDIO', name: 'Active Noise Cancellation', value: 'Up to 32 dB', unit: '', order: 2 },
        { group: 'BATTERY', name: 'Total Battery Life', value: '130', unit: 'Hours', order: 3 },
        { group: 'CONNECTIVITY', name: 'Bluetooth Version', value: 'v5.3 + IWP Instant Pairing', unit: '', order: 4 },
        { group: 'DURABILITY', name: 'Water Resistance', value: 'IPX7 Certified', unit: '', order: 5 }
      ],
      idealFor: ['Music Lovers', 'Commuters', 'Fitness Enthusiasts', 'Gamers'],
      whatsIncluded: ['Airdopes 441 Pro Earbuds', '2600mAh Charging Case', 'USB Type-C Fast Cable', 'Extra Silicone Ear Tips (S/M/L)', 'User Manual & 1-Year Warranty Card'],
      shipping: { available: true, panIndia: true, estimatedDeliveryDays: '2 - 3 Business Days', shippingCharge: 0, freeShippingThreshold: 999 },
      warranty: { period: '1 Year Full Replacement Warranty', type: 'boAt India Official Warranty', provider: 'Imagine Marketing', terms: 'Covers internal circuit, drivers, and charging case defects.' },
      emi: { enabled: true, minDownPayment: 0, minMonthlyEmi: 833, tenureOptions: [3, 6] },
      ratings: { averageRating: 4.8, totalReviews: 54, ratingBreakdown: { 5: 45, 4: 7, 3: 2, 2: 0, 1: 0 } }
    });

    // Product 3: Urban Bloom Handcrafted Ceramic Ambient Table Lamp (Home Decor & Living)
    const product3 = new Product({
      name: 'Urban Bloom Handcrafted Fluted Ceramic Table Lamp with Linen Shade',
      slug: 'urban-bloom-ceramic-table-lamp',
      brand: 'Urban Bloom Living',
      modelNumber: 'UBL-LAMP-01',
      sku: 'UBL-LP-FLUTED',
      productType: 'Home Decor & Living',
      category: 'Home Decor & Living',
      subcategory: 'Lamps & Ambient Lighting',
      shortDescription: 'Artisan fluted stoneware ceramic table lamp paired with a textured off-white natural linen shade, featuring 3-step warm dimming and brass accents.',
      description: `
        <h3>Timeless Minimalist Elegance for Contemporary Homes</h3>
        <p>The <strong>Urban Bloom Fluted Ceramic Lamp</strong> is wheel-thrown by skilled master potters and glazed with a tactile matte terracotta-sand finish.</p>
        <h4>Craftsmanship Highlights</h4>
        <ul>
          <li><strong>Studio Pottery Base:</strong> Heavy stoneware construction prevents tipping and gives an authentic artisan presence.</li>
          <li><strong>Natural Belgian Linen Shade:</strong> Diffuses soft glare-free light ideal for living rooms, nightstands, and consoles.</li>
          <li><strong>3-Way Touch Dimmer:</strong> Touch anywhere on the brass switch to cycle through 2700K ambient warmth.</li>
        </ul>
      `,
      status: 'Published',
      hsnCode: '9405',
      manufacturer: 'Urban Bloom Studio Craftworks',
      countryOfOrigin: 'India',
      mrp: 3499,
      sellingPrice: 1899,
      costPrice: 950,
      gstPercent: 12,
      taxIncluded: true,
      stockQuantity: 42,
      lowStockThreshold: 8,
      stockStatus: 'IN STOCK',
      warehouse: 'Jaipur Craftworks Hub',
      mainImage: {
        url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80',
        alt: 'Handcrafted Fluted Ceramic Table Lamp',
        caption: 'Urban Bloom Fluted Ceramic Ambient Lamp'
      },
      gallery: [
        { url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80', tag: '01 Main', order: 1 }
      ],
      specifications: [
        { group: 'DIMENSIONS', name: 'Height', value: '45', unit: 'cm', order: 1 },
        { group: 'DIMENSIONS', name: 'Shade Diameter', value: '28', unit: 'cm', order: 2 },
        { group: 'MATERIALS', name: 'Base Material', value: 'Hand-thrown Stoneware Ceramic', unit: '', order: 3 },
        { group: 'MATERIALS', name: 'Shade Material', value: 'Pure Belgian Natural Linen', unit: '', order: 4 },
        { group: 'ELECTRICAL', name: 'Bulb Fitting', value: 'Standard E27 (Warm White LED included)', unit: '', order: 5 }
      ],
      idealFor: ['Living Room', 'Bedside Nightstand', 'Work Desks', 'Luxury Consoles'],
      whatsIncluded: ['Handcrafted Ceramic Lamp Base', 'Textured Linen Drum Shade', 'Warm White 7W E27 LED Filament Bulb', 'Braided Fabric Power Cord (1.8m)'],
      shipping: { available: true, panIndia: true, estimatedDeliveryDays: '3 - 5 Business Days', shippingCharge: 0, freeShippingThreshold: 999 },
      warranty: { period: '1 Year Electrical Warranty', type: 'Urban Bloom Care', provider: 'Urban Bloom Living', terms: 'Covers internal wiring and brass socket.' },
      emi: { enabled: true, minDownPayment: 0, minMonthlyEmi: 633, tenureOptions: [3] },
      ratings: { averageRating: 4.9, totalReviews: 21, ratingBreakdown: { 5: 19, 4: 2, 3: 0, 2: 0, 1: 0 } }
    });

    // Product 4: Philips 1000W Turbo Copper Mixer Grinder (Kitchen & Home Appliances)
    const product4 = new Product({
      name: 'Philips 1000W Turbo Copper Mixer Grinder with 3 Heavy SS Jars',
      slug: 'philips-1000w-turbo-copper-mixer-grinder',
      brand: 'Philips',
      modelNumber: 'HL-7703',
      sku: 'PHL-MG1000W-3J',
      productType: 'Kitchen & Appliances',
      category: 'Kitchen & Home Appliances',
      subcategory: 'Mixer Grinders & Blenders',
      shortDescription: 'Commercial-grade 1000W 100% pure copper motor with PowerChop technology, 3 heavy-gauge stainless steel jars, and active air cooling.',
      description: `
        <h3>High-Torque Culinary Performance with 1000W Pure Copper Core</h3>
        <p>The <strong>Philips HL-7703</strong> tackles tough Indian spices, hard turmeric roots, and smooth batters in seconds with its 22,000 RPM high-speed motor.</p>
        <h4>Key Operating Features</h4>
        <ul>
          <li><strong>1000W Pure Copper Motor:</strong> Designed for continuous heavy grinding without thermal stalling.</li>
          <li><strong>Thick Gauge 304 Stainless Steel:</strong> Rust-proof jars with leak-resistant silicon ring gaskets.</li>
          <li><strong>Air Ventilation System:</strong> Prevents motor heating during prolonged grinding.</li>
        </ul>
      `,
      status: 'Published',
      hsnCode: '8509',
      manufacturer: 'Philips Domestic Appliances India Ltd',
      countryOfOrigin: 'India',
      mrp: 6999,
      sellingPrice: 4799,
      costPrice: 3200,
      gstPercent: 18,
      taxIncluded: true,
      stockQuantity: 38,
      lowStockThreshold: 6,
      stockStatus: 'IN STOCK',
      warehouse: 'Chennai Central Hub',
      mainImage: {
        url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80',
        alt: 'Philips 1000W Turbo Copper Mixer Grinder',
        caption: 'Philips 1000W Heavy Duty Mixer Grinder'
      },
      gallery: [
        { url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80', tag: '01 Main', order: 1 }
      ],
      specifications: [
        { group: 'MOTOR', name: 'Power Rating', value: '1000', unit: 'Watts', order: 1 },
        { group: 'MOTOR', name: 'Motor Winding', value: '100% Pure Copper', unit: '', order: 2 },
        { group: 'MOTOR', name: 'No Load Speed', value: '22,000', unit: 'RPM', order: 3 },
        { group: 'JARS', name: 'Wet Grinding Jar', value: '1.5', unit: 'Liters', order: 4 },
        { group: 'JARS', name: 'Dry Multipurpose Jar', value: '1.0', unit: 'Liters', order: 5 },
        { group: 'JARS', name: 'Chutney Jar', value: '0.4', unit: 'Liters', order: 6 }
      ],
      idealFor: ['Home Kitchens', 'Baking & Blending', 'Daily Indian Cooking'],
      whatsIncluded: ['1000W Base Motor Unit', '1.5L Wet Jar with Lid', '1.0L Multipurpose Jar', '0.4L Chutney Jar', 'Ergonomic Spatula', '2-Year Philips Warranty Card'],
      shipping: { available: true, panIndia: true, estimatedDeliveryDays: '2 - 4 Business Days', shippingCharge: 0, freeShippingThreshold: 999 },
      warranty: { period: '2 Years on Product & 5 Years on Motor', type: 'Philips Pan-India Doorstep Warranty', provider: 'Philips India', terms: 'Comprehensive free doorstep technician service.' },
      emi: { enabled: true, minDownPayment: 0, minMonthlyEmi: 800, tenureOptions: [3, 6, 9] },
      ratings: { averageRating: 4.8, totalReviews: 32, ratingBreakdown: { 5: 27, 4: 5, 3: 0, 2: 0, 1: 0 } }
    });

    // Product 5: Bosch Professional 13mm Impact Drill Kit (Hardware & Tools)
    const product5 = new Product({
      name: 'Bosch Professional 13mm 550W Impact Drill Kit with 100-Piece Accessory Set (GSB 550)',
      slug: 'bosch-professional-13mm-impact-drill-gsb-550',
      brand: 'Bosch Professional',
      modelNumber: 'GSB-550-KIT',
      sku: 'BSH-GSB550-100',
      productType: 'Hardware & Tools',
      category: 'Hardware & Power Tools',
      subcategory: 'Impact Drills & Rotary Hammers',
      shortDescription: 'Industrial 550W dual-mode impact drill with forward/reverse, variable electronic speed, and heavy carrying case containing 100 masonry, wood, and metal bits.',
      description: `
        <h3>Industrial Powerhouse for Masonry, Wood, and Metal</h3>
        <p>The <strong>Bosch GSB 550 Professional</strong> provides dual-mode functionality allowing seamless switching between rotary drilling and high-impact hammering.</p>
        <h4>Key Engineering Features</h4>
        <ul>
          <li><strong>550 Watt High-Output Motor:</strong> Easily pierces brick walls, concrete, timber, and steel.</li>
          <li><strong>100-Piece Professional Case:</strong> Includes drill bits, screwdriving bits, expansion plugs, claw hammer, pliers, and measuring tape.</li>
          <li><strong>Slimline Ergonomic Body:</strong> Weighs just 1.8 kg with textured rubber grips.</li>
        </ul>
      `,
      status: 'Published',
      hsnCode: '8467',
      manufacturer: 'Bosch Power Tools India',
      countryOfOrigin: 'Germany / India',
      mrp: 4999,
      sellingPrice: 3299,
      costPrice: 2200,
      gstPercent: 18,
      taxIncluded: true,
      stockQuantity: 40,
      lowStockThreshold: 5,
      stockStatus: 'IN STOCK',
      warehouse: 'Bengaluru Tool Hub',
      mainImage: {
        url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80',
        alt: 'Bosch Professional Impact Drill Kit',
        caption: 'Bosch Professional 13mm Impact Drill Set'
      },
      gallery: [
        { url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80', tag: '01 Main', order: 1 }
      ],
      specifications: [
        { group: 'POWER', name: 'Rated Input Power', value: '550', unit: 'Watts', order: 1 },
        { group: 'PERFORMANCE', name: 'No-Load Speed', value: '0 - 2,800', unit: 'RPM', order: 2 },
        { group: 'PERFORMANCE', name: 'Impact Rate', value: '0 - 41,800', unit: 'BPM', order: 3 },
        { group: 'CAPACITY', name: 'Chuck Capacity', value: '1.5 - 13', unit: 'mm Keyed', order: 4 },
        { group: 'WEIGHT', name: 'Tool Weight', value: '1.8', unit: 'kg', order: 5 }
      ],
      idealFor: ['Home DIY', 'Electricians', 'Carpenters', 'Contractors'],
      whatsIncluded: ['GSB 550 Impact Drill Unit', 'Chuck Key & Auxiliary Handle', 'Depth Gauge Rod', '100-Piece Complete Accessory Box', 'Heavy Duty Hard Carry Case', 'Official 1-Year Bosch Warranty'],
      shipping: { available: true, panIndia: true, estimatedDeliveryDays: '2 - 4 Business Days', shippingCharge: 0, freeShippingThreshold: 999 },
      warranty: { period: '1 Year Manufacturer Warranty', type: 'Bosch Authorized Service Network', provider: 'Bosch India', terms: 'Warranty against material and manufacturing defects.' },
      emi: { enabled: true, minDownPayment: 0, minMonthlyEmi: 1100, tenureOptions: [3] },
      ratings: { averageRating: 4.8, totalReviews: 24, ratingBreakdown: { 5: 20, 4: 4, 3: 0, 2: 0, 1: 0 } }
    });

    // Product 6: Fortune Kachi Ghani Pure Mustard Oil (Organic Groceries & Oils)
    const product6 = new Product({
      name: 'Fortune Kachi Ghani Pure Mustard Oil (Cold Pressed Wood Churned 1L)',
      slug: 'fortune-kachi-ghani-mustard-oil',
      brand: 'Fortune Foods',
      modelNumber: 'FT-MUST-1L',
      sku: 'FT-MUST-1L',
      productType: 'Spices & Groceries',
      category: 'Organic Groceries & Oils',
      subcategory: 'Cold-Pressed Oils',
      unit: 'ltr',
      netQuantity: '1',
      unitDisplay: '1 Ltr',
      variants: [
        { name: '500 ml Bottle', unit: 'ml', quantity: '500', mrp: 95, sellingPrice: 85, discountPercent: 10, stockQuantity: 100, stockStatus: 'IN STOCK', sku: 'FT-MUST-500ML', isDefault: false },
        { name: '1 Liter Jar', unit: 'ltr', quantity: '1', mrp: 185, sellingPrice: 160, discountPercent: 13, stockQuantity: 120, stockStatus: 'IN STOCK', sku: 'FT-MUST-1L', isDefault: true },
        { name: '5 Liter Can', unit: 'ltr', quantity: '5', mrp: 900, sellingPrice: 780, discountPercent: 13, stockQuantity: 40, stockStatus: 'IN STOCK', sku: 'FT-MUST-5L', isDefault: false }
      ],
      shortDescription: 'Traditional cold-pressed mustard oil with pungent natural aroma, Omega-3 fatty acids, and high smoke point for authentic Indian cooking.',
      description: '<p>Extracted from the first press of premium mustard seeds using traditional Kohlu mechanism to preserve natural antioxidants and pungent taste.</p>',
      status: 'Published',
      hsnCode: '1514',
      manufacturer: 'Adani Wilmar Ltd',
      countryOfOrigin: 'India',
      mrp: 185,
      sellingPrice: 160,
      costPrice: 110,
      gstPercent: 5,
      taxIncluded: true,
      stockQuantity: 120,
      lowStockThreshold: 20,
      stockStatus: 'IN STOCK',
      warehouse: 'Ahmedabad Warehouse',
      mainImage: {
        url: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=800&q=80',
        alt: 'Fortune Kachi Ghani Mustard Oil Bottle',
        caption: 'Fortune 100% Pure Mustard Oil 1L'
      },
      specifications: [
        { group: 'GENERAL', name: 'Extraction Method', value: 'Cold Pressed (Kachi Ghani)', unit: '', order: 1 },
        { group: 'GENERAL', name: 'Net Volume', value: '1', unit: 'Liter', order: 2 },
        { group: 'STORAGE & SHELF LIFE', name: 'Shelf Life', value: '9', unit: 'Months', order: 3 },
        { group: 'CERTIFICATIONS', name: 'Agmark Grade 1', value: 'Certified', unit: '', order: 4 }
      ],
      idealFor: ['Daily Cooking', 'Traditional Pickling', 'Health-Conscious Homes'],
      whatsIncluded: ['1 Liter PET Bottle with Tamper Evident Cap'],
      shipping: { available: true, panIndia: true, estimatedDeliveryDays: '2 - 4 Business Days', shippingCharge: 40, freeShippingThreshold: 499 },
      warranty: { period: 'Purity Tested', type: 'Agmark Grade 1', provider: 'Fortune Foods', terms: 'Quality guaranteed' },
      emi: { enabled: false },
      ratings: { averageRating: 4.7, totalReviews: 19, ratingBreakdown: { 5: 15, 4: 3, 3: 1, 2: 0, 1: 0 } }
    });

    // Save all products
    await Promise.all([
      product1.save(),
      product2.save(),
      product3.save(),
      product4.save(),
      product5.save(),
      product6.save()
    ]);

    // Cross-link recommendations
    product1.recommendations = { manualRecommendations: [product6._id] };
    product2.recommendations = { manualRecommendations: [product3._id] };
    product4.recommendations = { manualRecommendations: [product1._id, product6._id] };
    await Promise.all([product1.save(), product2.save(), product4.save()]);

    console.log('[Seeder] Seeded 6 balanced multi-category products.');

    // 5. Seed Customer Review
    console.log('[Seeder] Seeding Verified Product Reviews...');
    const review1 = new Review({
      product: product1._id,
      user: user1._id,
      userName: 'Ramesh Patel',
      order: null,
      rating: 5,
      title: 'Incredible aroma and rich natural flavor!',
      comment: 'The Everest Shahi Garam Masala is pure and wonderfully fragrant. Excellent packaging and fast delivery to Ahmedabad within 2 days.',
      farmContext: {
        city: 'Ahmedabad'
      },
      images: [
        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80'
      ],
      verifiedPurchase: true,
      status: 'Approved',
      helpfulVotes: 18,
      moderatedAt: new Date(),
      moderationNotes: 'Verified buyer in Ahmedabad.'
    });

    await review1.save();

    // 6. Seed Store Coupons
    console.log('[Seeder] Seeding Coupons...');
    await Coupon.insertMany([
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 499,
        maxDiscountAmount: 500,
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      {
        code: 'SUPER500',
        discountType: 'fixed',
        discountValue: 500,
        minOrderAmount: 2999,
        maxDiscountAmount: 500,
        validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      }
    ]);

    console.log('[Seeder] Multi-category database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`[Seeder Error] ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
