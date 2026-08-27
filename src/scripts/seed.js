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
      InventoryLog.deleteMany({})
    ]);

    // 1. Seed Categories
    console.log('[Seeder] Seeding Categories...');
    const categories = await Category.insertMany([
      {
        name: 'Spices & Masala',
        slug: 'spices-masala',
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
        name: 'Organic Groceries & Oils',
        slug: 'organic-groceries-oils',
        description: 'Cold-pressed kachi ghani oils, unpolished organic pulses, pure desi ghee, and premium grains.',
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
        order: 2
      },
      {
        name: 'Electronics & Motors',
        slug: 'electronics-motors',
        description: 'Submersible water pump motors, smart auto-switch starter panels, and solar MPPT drive inverters.',
        icon: 'Cpu',
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
        categoryType: 'Electronics & Appliances',
        unitType: 'power',
        startingPrice: '₹2,499',
        features: [
          '100% Pure Copper Wound Motor Core',
          'Thermal Overload & Dry Run Auto Protection',
          'ISI / BIS Standard Certified Components',
          'Pan-India 1-Year Comprehensive Warranty'
        ],
        subcategories: [
          { name: 'Submersible Pump Motors', slug: 'submersible-motors', description: 'V4 & V6 oil-cooled / water-cooled pump motors' },
          { name: 'Smart Starter Panels', slug: 'starter-panels', description: 'Digital GSM Mobile Controlled Motor Starters' },
          { name: 'Solar MPPT Inverters', slug: 'solar-inverters', description: 'High-efficiency variable frequency pump drives' }
        ],
        order: 3
      },
      {
        name: 'Power Weeders',
        slug: 'power-weeders',
        description: 'High-torque petrol and diesel weeders for soil loosening, intercultural tilling, and weed removal.',
        icon: 'Tractor',
        image: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=600&q=80',
        categoryType: 'Agricultural Machinery',
        unitType: 'power',
        startingPrice: '₹38,499',
        subcategories: [
          { name: 'Petrol Power Weeders', slug: 'petrol-weeders', description: 'Lightweight and agile weeders for vegetable farms' },
          { name: 'Diesel Heavy Weeders', slug: 'diesel-weeders', description: 'High-torque weeders for hard soil and orchards' }
        ],
        order: 4
      },
      {
        name: 'Rotavators & Tillers',
        slug: 'rotavators-tillers',
        description: 'Tractor attachments and motorized tillers for rapid seedbed preparation and clod breaking.',
        icon: 'Cog',
        image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=600&q=80',
        categoryType: 'Agricultural Machinery',
        unitType: 'power',
        startingPrice: '₹24,999',
        subcategories: [
          { name: 'Mini Rotary Tillers', slug: 'mini-tillers' },
          { name: 'Tractor-Driven Rotavators', slug: 'tractor-rotavators' }
        ],
        order: 5
      },
      {
        name: 'Brush Cutters & Harvesters',
        slug: 'brush-cutters-harvesters',
        description: 'Heavy duty 2-stroke and 4-stroke crop cutters, grass trimmers, and paddy reapers.',
        icon: 'Scissors',
        image: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=600&q=80',
        categoryType: 'Agricultural Machinery',
        unitType: 'power',
        startingPrice: '₹12,499',
        subcategories: [
          { name: 'Backpack Brush Cutters', slug: 'backpack-cutters' },
          { name: 'Side-Pack Cutters', slug: 'sidepack-cutters' }
        ],
        order: 6
      },
      {
        name: 'Water Pumps & Solar Irrigation',
        slug: 'water-pumps-solar-irrigation',
        description: 'Solar powered submersible pumps, centrifugal irrigation pumps, and drip systems.',
        icon: 'Droplets',
        image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80',
        categoryType: 'Agricultural Machinery',
        unitType: 'power',
        startingPrice: '₹18,999',
        subcategories: [
          { name: 'Solar Submersible Pumps', slug: 'solar-pumps' },
          { name: 'Petrol Water Pumps', slug: 'petrol-pumps' }
        ],
        order: 7
      },
      {
        name: 'Agricultural Sprayers',
        slug: 'agricultural-sprayers',
        description: 'Battery operated, knapsack manual, and engine power sprayers for pesticide application.',
        icon: 'Sparkles',
        image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=600&q=80',
        categoryType: 'Agricultural Machinery',
        unitType: 'volume',
        startingPrice: '₹2,799',
        subcategories: [
          { name: '16L Battery Sprayers', slug: 'battery-sprayers' },
          { name: 'Tractor Mount Sprayers', slug: 'tractor-sprayers' }
        ],
        order: 8
      },
      {
        name: 'Chaff Cutters & Threshers',
        slug: 'chaff-cutters-threshers',
        description: 'Motorized fodder cutters and grain threshers for livestock and post-harvest processing.',
        icon: 'Layers',
        image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80',
        categoryType: 'Agricultural Machinery',
        unitType: 'power',
        startingPrice: '₹19,499',
        subcategories: [
          { name: 'Electric Chaff Cutters', slug: 'electric-chaff-cutters' }
        ],
        order: 9
      }
    ]);

    // 2. Seed Brands
    console.log('[Seeder] Seeding Brands...');
    const brands = await Brand.insertMany([
      { name: 'Everest', slug: 'everest', countryOfOrigin: 'India', description: 'India’s most trusted spice brand with pure whole & ground spices.' },
      { name: 'Tata Sampann', slug: 'tata-sampann', countryOfOrigin: 'India', description: 'Naturally rich, unadulterated spices and farm-sourced organic pulses.' },
      { name: 'MDH', slug: 'mdh', countryOfOrigin: 'India', description: 'Classic authentic Indian spice blends and culinary powders.' },
      { name: 'Fortune Foods', slug: 'fortune-foods', countryOfOrigin: 'India', description: 'Finest cold-pressed kachi ghani oils and wholesome kitchen staples.' },
      { name: 'Havells', slug: 'havells', countryOfOrigin: 'India', description: 'Heavy-duty industrial and agricultural electric submersible motors & drives.' },
      { name: 'AgriPro Master', slug: 'agripro-master', countryOfOrigin: 'India', description: 'Pioneering agricultural machinery for Indian farm terrain.' },
      { name: 'SunAgro Tech', slug: 'sunagro-tech', countryOfOrigin: 'India', description: 'Renewable solar pump systems and water solutions.' },
      { name: 'Honda Agro Power', slug: 'honda-agro-power', countryOfOrigin: 'Japan', description: 'World-class 4-stroke OHV engines for agricultural weeders.' },
      { name: 'Shaktiman FarmTech', slug: 'shaktiman-farmtech', countryOfOrigin: 'India', description: 'Heavy-duty rotary tillers and tractor implements.' }
    ]);

    // 3. Seed Sample Customer Users
    console.log('[Seeder] Seeding Customer Users...');
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash('Farmer@2026', salt);

    const user1 = await new User({
      name: 'Ramesh Patel',
      email: 'ramesh.patel@kisanmail.in',
      phone: '+91 98765 43210',
      password: passHash,
      farmDetails: {
        farmType: 'Vegetable & Cotton Farming',
        farmSizeAcres: 8,
        state: 'Gujarat',
        district: 'Rajkot',
        pincode: '360001'
      },
      addresses: [{
        street: 'Farm Plot #14, Gondal Highway',
        city: 'Gondal',
        district: 'Rajkot',
        state: 'Gujarat',
        pincode: '360001',
        isDefault: true
      }]
    }).save();

    const user2 = await new User({
      name: 'Gurpreet Singh',
      email: 'gurpreet.singh@kisanmail.in',
      phone: '+91 98123 45678',
      password: passHash,
      farmDetails: {
        farmType: 'Wheat & Paddy Farming',
        farmSizeAcres: 15,
        state: 'Punjab',
        district: 'Ludhiana',
        pincode: '141001'
      },
      addresses: [{
        street: 'Kisan Basti, Samrala Road',
        city: 'Samrala',
        district: 'Ludhiana',
        state: 'Punjab',
        pincode: '141001',
        isDefault: true
      }]
    }).save();

    // 4. Seed Comprehensive Machinery Products
    console.log('[Seeder] Seeding 15-Tab Agricultural Machinery Products...');
    
    // Product 1: Power Weeder AV-708
    const product1 = new Product({
      name: 'Power Weeder 7HP Petrol 4-Stroke (AV-708)',
      slug: 'power-weeder-7hp-petrol-av-708',
      brand: 'AgriPro Master',
      modelNumber: 'AV-708',
      sku: 'AV-708-4S',
      productType: 'Power Weeder & Cultivator',
      category: 'Power Weeders',
      subcategory: 'Petrol Power Weeders',
      shortDescription: 'Heavy-duty 7 HP petrol engine power weeder engineered with hardened 32-blade rotary set, multi-speed transmission, and ergonomic 360° adjustable handles.',
      description: `
        <h3>Engineered for High-Density Indian Agricultural Soil</h3>
        <p>The <strong>AgriPro AV-708</strong> delivers unrelenting torque through a precision forged cast-iron gearbox paired with a responsive 208cc 4-stroke overhead-valve engine.</p>
        <h4>Key Operating Highlights</h4>
        <ul>
          <li><strong>Deep Inter-Row Weeding:</strong> Penetrates weed roots from 100mm to 150mm depth without root-zone damage to adjacent crops.</li>
          <li><strong>Variable Width Tilling:</strong> Modular blade brackets adjust quickly between 600mm and 900mm width.</li>
          <li><strong>Multi-Crop Compatibility:</strong> Ideal for Cotton, Sugarcane, Maize, Vegetables, and Fruit Orchards.</li>
        </ul>
      `,
      status: 'Published',
      hsnCode: '8432',
      barcode: '8901234567890',
      manufacturer: 'AgriPro Machinery Works India Pvt Ltd',
      countryOfOrigin: 'India',
      mrp: 46999,
      sellingPrice: 38499,
      costPrice: 27500,
      gstPercent: 12,
      taxIncluded: true,
      stockQuantity: 28,
      lowStockThreshold: 6,
      stockStatus: 'IN STOCK',
      warehouse: 'Gujarat Central Hub',
      warehouseLocation: 'Bay W-04',
      mainImage: {
        url: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80',
        alt: 'AgriPro 7HP Power Weeder Front View',
        caption: 'AgriPro AV-708 7HP Petrol Power Weeder'
      },
      gallery: [
        { url: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80', tag: '01 Main', order: 1 },
        { url: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&q=80', tag: '02 Front', order: 2 },
        { url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80', tag: '03 Side', order: 3 },
        { url: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=800&q=80', tag: '06 Engine', order: 4 },
        { url: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&q=80', tag: '07 Application', order: 5 }
      ],
      video: {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoType: 'youtube',
        title: 'AgriPro AV-708 Field Demonstration & Soil Loosening Test',
        description: 'Watch the AV-708 in action tilling hard sugarcane inter-rows with effortless recoil start.'
      },
      specifications: [
        { group: 'ENGINE', name: 'Engine Power', value: '7 HP (5.2 kW)', unit: 'HP', order: 1 },
        { group: 'ENGINE', name: 'Displacement', value: '208', unit: 'cc', order: 2 },
        { group: 'ENGINE', name: 'Fuel Type', value: 'Petrol (Gasoline)', unit: '', order: 3 },
        { group: 'ENGINE', name: 'Starting Mechanism', value: 'Recoil Pull Starter (Easy-Pull Assisted)', unit: '', order: 4 },
        { group: 'ENGINE', name: 'Fuel Tank Capacity', value: '3.6', unit: 'Liters', order: 5 },
        { group: 'PERFORMANCE', name: 'Working Width', value: '600 - 900', unit: 'mm', order: 6 },
        { group: 'PERFORMANCE', name: 'Working Depth', value: '100 - 150', unit: 'mm', order: 7 },
        { group: 'PERFORMANCE', name: 'Fuel Consumption', value: '650 - 750', unit: 'ml/hr', order: 8 },
        { group: 'PERFORMANCE', name: 'Blade Speed', value: '130 - 160', unit: 'RPM', order: 9 },
        { group: 'DIMENSIONS', name: 'Machine Weight', value: '85', unit: 'kg', order: 10 },
        { group: 'DIMENSIONS', name: 'Dimensions (L x W x H)', value: '1400 x 850 x 1050', unit: 'mm', order: 11 },
        { group: 'TRANSMISSION', name: 'Gear System', value: '2 Forward + 1 Reverse (Heavy Cast Iron)', unit: '', order: 12 },
        { group: 'TRANSMISSION', name: 'Clutch Type', value: 'Direct Belt-Tensioner with Safety Lever', unit: '', order: 13 }
      ],
      features: [
        { title: 'Heavy Duty 208cc 4-Stroke Engine', description: 'Delivers continuous reliable torque for 8+ hours uninterrupted operation.', icon: 'Zap', order: 1 },
        { title: '32-Piece Boron Steel Blades', description: 'Hardened anti-wear blades cut through dense weeds and clay soil with ease.', icon: 'Shield', order: 2 },
        { title: '360° Height Adjustable Handlebars', description: 'Ergonomic grips reduce vibration by 40% to eliminate farmer fatigue.', icon: 'Settings', order: 3 },
        { title: 'Multi-Attachment PTO Shaft', description: 'Accepts Ridger, Ditcher, Water Pump, and Wheel Barrow attachments.', icon: 'CheckCircle', order: 4 }
      ],
      applications: [
        { name: 'Weeding & De-weeding', description: 'Uproots stubborn weeds between crop rows cleanly.', icon: 'Scissors', image: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=400&q=80' },
        { name: 'Soil Loosening & Aeration', description: 'Improves oxygenation and fertilizer absorption in root zone.', icon: 'Sprout', image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=400&q=80' },
        { name: 'Bed & Furrow Preparation', description: 'Quickly creates raised beds when paired with the rear ridger.', icon: 'Layers', image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&q=80' },
        { name: 'Inter-Cultivation', description: 'Optimal for Sugarcane, Cotton, Maize, and Orchards.', icon: 'Sun', image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=400&q=80' }
      ],
      idealFor: [
        'Small Farms',
        'Medium Farms',
        'Vegetable Farming',
        'Orchards',
        'Sugarcane',
        'Paddy',
        'Cotton'
      ],
      compatibility: {
        compatibleMachines: ['AV-708 Series', 'AV-750 Pro'],
        compatibleModels: ['AV-708', 'AV-708-4S', 'AV-708-Diesel'],
        compatibleBrands: ['AgriPro Master', 'Honda Agro Power', 'KisanKrafts'],
        compatibleAttachments: ['Adjustable Ridger', 'Single Furrow Plough', 'Iron Paddy Wheels', 'Sprayer Kit']
      },
      whatsIncluded: [
        'AgriPro AV-708 7HP Power Weeder Base Unit',
        '32-Piece Heat Treated Curved Rotary Blades',
        'Heavy Duty Pneumatic Rubber Transport Wheels (4.00-8)',
        'Depth Resistance Rod & Bracket',
        'Farmer Maintenance Spanner & Tool Kit',
        'User Operational Manual & Warranty Registration Card'
      ],
      shipping: {
        available: true,
        panIndia: true,
        restrictedStates: [],
        estimatedDeliveryDays: '3 - 6 Business Days',
        shippingCharge: 0,
        freeShippingThreshold: 4999,
        installationAvailable: true,
        installationCharge: 0
      },
      warranty: {
        period: '1 Year Full Manufacturer Warranty',
        type: 'Comprehensive OEM Support',
        provider: 'AgriPro Pan-India Authorized Service Network',
        terms: 'Complete coverage on engine, gearbox, and frame. Blade set is covered for manufacturing defects.'
      },
      emi: {
        enabled: true,
        minDownPayment: 3999,
        interestRate: 13.5,
        tenureOptions: [3, 6, 9, 12, 18, 24, 36],
        processingFee: 499,
        financePartners: ['HDFC Kisan Finance', 'SBI Agri Credit', 'Bajaj Finserv Farm', 'Kotak Mahindra', 'TVS Credit']
      },
      seo: {
        seoTitle: 'Power Weeder 7HP Petrol 4-Stroke AV-708 | AgriPro Master',
        metaDescription: 'Buy AgriPro AV-708 7HP Petrol Power Weeder. Free pan-India shipping, 1 year warranty, 32 blades, and easy EMI starting from ₹1,290/month.',
        focusKeyword: 'power weeder 7hp petrol av708'
      },
      faqs: [
        { question: 'What is the fuel consumption of this machine?', answer: 'Under full operating load in hard soil, the AV-708 consumes approximately 650ml to 750ml of regular petrol per hour.' },
        { question: 'Can I use this machine for paddy/wetland cultivation?', answer: 'Yes! You can attach optional anti-skid iron paddy cage wheels for mud puddling and wet field weeding.' },
        { question: 'Is spare parts support available?', answer: 'Yes, 100% original spare parts (blades, belts, carburetor kits, spark plugs) are stocked and shipped pan-India within 48 hours.' }
      ],
      ratings: {
        averageRating: 4.8,
        totalReviews: 12,
        ratingBreakdown: { 5: 10, 4: 2, 3: 0, 2: 0, 1: 0 }
      },
      analytics: {
        views: 342,
        purchasesCount: 18,
        totalRevenue: 692982
      }
    });

    // Product 2: Solar Submersible Pump 5HP
    const product2 = new Product({
      name: 'Solar Submersible Water Pump 5HP High-Head DC (SP-500)',
      slug: 'solar-submersible-water-pump-5hp-sp-500',
      brand: 'SunAgro Tech',
      modelNumber: 'SP-500',
      sku: 'SUN-SP500-DC',
      productType: 'Solar Water Pump',
      category: 'Water Pumps & Irrigation',
      subcategory: 'Solar Submersible Pumps',
      shortDescription: 'Zero electricity cost 5 HP brushless DC submersible pump with smart MPPT inverter controller, delivering up to 240,000 liters per day.',
      description: `
        <h3>Harness the Power of the Sun for Reliable Zero-Cost Farm Irrigation</h3>
        <p>The <strong>SunAgro SP-500</strong> is an industrial grade stainless steel 304 solar pump that operates directly on solar DC photovoltaic power without needing grid power or costly diesel generators.</p>
        <h4>Key Engineering Specifications</h4>
        <ul>
          <li><strong>Brushless DC Motor (BLDC):</strong> 92% operating efficiency with rare-earth neodymium permanent magnets.</li>
          <li><strong>Integrated MPPT Smart Controller:</strong> Maximizes water discharge even during low sunlight and overcast mornings.</li>
          <li><strong>Dry Run & Overvoltage Protection:</strong> Integrated sensor probes shut off pump automatically if borewell water drops.</li>
        </ul>
      `,
      status: 'Published',
      hsnCode: '8413',
      manufacturer: 'SunAgro Green Energy Technologies Ltd',
      countryOfOrigin: 'India',
      mrp: 185000,
      sellingPrice: 149999,
      costPrice: 110000,
      gstPercent: 12,
      stockQuantity: 16,
      lowStockThreshold: 4,
      stockStatus: 'IN STOCK',
      mainImage: {
        url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80',
        alt: 'SunAgro 5HP Solar Submersible Pump',
        caption: 'SunAgro SP-500 5HP DC Solar Water Pump'
      },
      gallery: [
        { url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80', tag: '01 Main', order: 1 },
        { url: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&q=80', tag: '02 Front', order: 2 }
      ],
      specifications: [
        { group: 'PERFORMANCE', name: 'Maximum Discharge Flow', value: '24,000', unit: 'Liters/Hour', order: 1 },
        { group: 'PERFORMANCE', name: 'Maximum Head Range', value: '120', unit: 'Meters (400 Feet)', order: 2 },
        { group: 'ELECTRICAL', name: 'Rated Motor Power', value: '5', unit: 'HP (3.7 kW)', order: 3 },
        { group: 'ELECTRICAL', name: 'Operating Voltage Range', value: '110 - 220', unit: 'V DC', order: 4 },
        { group: 'ELECTRICAL', name: 'Recommended Solar Array', value: '4800 - 5400', unit: 'Watts Peak (Wp)', order: 5 },
        { group: 'DIMENSIONS', name: 'Pump Outlet Diameter', value: '2.5 / 3.0', unit: 'Inch', order: 6 },
        { group: 'DIMENSIONS', name: 'Borewell Minimum Size', value: '4 or 6', unit: 'Inch', order: 7 },
        { group: 'GENERAL', name: 'Impeller Material', value: 'Stainless Steel 304 High-Wear', unit: '', order: 8 }
      ],
      features: [
        { title: '92% High Efficiency BLDC Motor', description: 'Advanced permanent magnet motor ensures optimal water output even on cloudy days.', icon: 'Zap', order: 1 },
        { title: 'Smart MPPT Controller with LCD', description: 'Digital screen shows real-time RPM, Power (W), Voltage (V), and Flow Rate (LPH).', icon: 'Cpu', order: 2 },
        { title: 'IP68 Submersible Casing', description: 'Laser welded 304 stainless steel resists corrosion, sand abrasion, and silt buildup.', icon: 'Shield', order: 3 }
      ],
      applications: [
        { name: 'Drip & Micro Irrigation', description: 'Continuous steady pressure for high-precision drip systems.', icon: 'Droplets' },
        { name: 'Flood & Furrow Irrigation', description: 'Discharges up to 240,000 liters per sunny day into farm ponds or field channels.', icon: 'Sun' },
        { name: 'Horticulture & Orchards', description: 'Sustains heavy water-demanding fruit orchards reliably.', icon: 'Sprout' }
      ],
      idealFor: ['Large Farms', 'Medium Farms', 'Commercial Farming', 'Orchards', 'Sugarcane', 'Paddy'],
      compatibility: {
        compatibleMachines: ['SunAgro 5HP Array', 'Solar PV 335W - 550W Modules'],
        compatibleModels: ['SP-500', 'SP-500-Pro'],
        compatibleBrands: ['SunAgro Tech', 'Loom Solar', 'Tata Solar'],
        compatibleAttachments: ['Solar MPPT Smart Box', 'Water Level Probes', 'Lightning Surge Arrester']
      },
      whatsIncluded: [
        '5HP BLDC Submersible Solar Pump Unit',
        'Smart MPPT Solar Inverter Controller with LCD Display',
        'Water Level Sensor Probes (Top & Bottom Well Sensors)',
        'Waterproof Heat-Shrink Joint Kit & Submersible Cable Connectors',
        'High-Tensile Safety Lowering Rope (50m)',
        'Installation & Technical Manual'
      ],
      shipping: {
        available: true,
        panIndia: true,
        estimatedDeliveryDays: '4 - 7 Business Days',
        shippingCharge: 0,
        freeShippingThreshold: 4999,
        installationAvailable: true
      },
      warranty: {
        period: '5 Years Comprehensive Manufacturer Warranty',
        type: 'OEM Replacement & Service Guarantee',
        provider: 'SunAgro National Solar Care',
        terms: '5 years coverage on BLDC motor, pump assembly, and MPPT controller unit.'
      },
      emi: {
        enabled: true,
        minDownPayment: 14999,
        interestRate: 11.5,
        tenureOptions: [6, 12, 18, 24, 36],
        processingFee: 999,
        financePartners: ['SBI Kisan Credit', 'HDFC Agri Loan', 'NABARD Subsidized Finance']
      },
      seo: {
        seoTitle: '5HP Solar Submersible Water Pump | SunAgro SP-500',
        metaDescription: 'Order 5HP Solar Submersible Water Pump with 5 Years Warranty. Max 120m head, 24000 LPH flow rate, smart MPPT controller, and easy EMI financing.',
        focusKeyword: '5hp solar submersible pump'
      },
      ratings: {
        averageRating: 4.9,
        totalReviews: 8,
        ratingBreakdown: { 5: 7, 4: 1, 3: 0, 2: 0, 1: 0 }
      },
      analytics: {
        views: 289,
        purchasesCount: 9,
        totalRevenue: 1349991
      }
    });

    // Product 3: Multi-Crop Rotavator 6 Feet (RT-600)
    const product3 = new Product({
      name: 'Heavy-Duty Multi-Crop Rotavator 6 Feet (RT-600)',
      slug: 'heavy-duty-multi-crop-rotavator-6-feet-rt-600',
      brand: 'Shaktiman FarmTech',
      modelNumber: 'RT-600',
      sku: 'SHK-RT600-6F',
      productType: 'Tractor Rotavator',
      category: 'Rotavators & Tillers',
      subcategory: 'Tractor-Driven Rotavators',
      shortDescription: '6-Feet heavy-duty tractor driven rotary tiller with multi-speed gearbox and 54 L-type boron steel blades for supreme seedbed preparation.',
      description: '<p>Engineered for tractors from 40 HP to 55 HP, the Shaktiman RT-600 breaks hard soil clods into fine tilth in a single pass.</p>',
      status: 'Published',
      hsnCode: '8432',
      mrp: 115000,
      sellingPrice: 94500,
      costPrice: 72000,
      gstPercent: 12,
      stockQuantity: 11,
      lowStockThreshold: 3,
      stockStatus: 'IN STOCK',
      mainImage: {
        url: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&q=80',
        alt: 'Shaktiman RT-600 6 Feet Rotavator',
        caption: 'Shaktiman RT-600 Multi-Speed Rotavator'
      },
      specifications: [
        { group: 'PERFORMANCE', name: 'Tractor Power Requirement', value: '40 - 55', unit: 'HP', order: 1 },
        { group: 'PERFORMANCE', name: 'Working Width', value: '1800', unit: 'mm (6 Feet)', order: 2 },
        { group: 'PERFORMANCE', name: 'Working Depth', value: '150 - 200', unit: 'mm', order: 3 },
        { group: 'DIMENSIONS', name: 'Total Weight', value: '460', unit: 'kg', order: 4 },
        { group: 'TRANSMISSION', name: 'Gearbox Type', value: 'Multi-Speed 4 Gear Selection', unit: '', order: 5 },
        { group: 'GENERAL', name: 'Number of Blades', value: '54', unit: 'L-Type Boron Steel', order: 6 }
      ],
      idealFor: ['Large Farms', 'Medium Farms', 'Wheat', 'Paddy', 'Sugarcane', 'Commercial Farming'],
      whatsIncluded: ['6-Feet Rotavator Assembly', 'Heavy Duty PTO Shaft with Shear Bolt Safety', '54 L-Type Blades Pre-Mounted', 'User Manual'],
      emi: {
        enabled: true,
        minDownPayment: 9999,
        interestRate: 12.0,
        tenureOptions: [6, 12, 18, 24, 36],
        processingFee: 799
      },
      ratings: {
        averageRating: 4.7,
        totalReviews: 6,
        ratingBreakdown: { 5: 4, 4: 2, 3: 0, 2: 0, 1: 0 }
      },
      analytics: {
        views: 198,
        purchasesCount: 5,
        totalRevenue: 472500
      }
    });

    // Product 4: Backpack Brush Cutter 50cc 4-Stroke
    const product4 = new Product({
      name: 'Backpack Brush Cutter 50cc 4-Stroke Multi-Tool (BC-500)',
      slug: 'backpack-brush-cutter-50cc-4-stroke-bc-500',
      brand: 'Honda Agro Power',
      modelNumber: 'BC-500',
      sku: 'HND-BC500-4S',
      productType: 'Brush Cutter & Crop Harvester',
      category: 'Brush Cutters & Harvesters',
      subcategory: 'Backpack Brush Cutters',
      shortDescription: 'Genuine 50cc 4-stroke commercial backpack crop harvester with 80T carbide paddy blade, 3T brush blade, and tap & go nylon grass trimmer head.',
      description: '<p>Ultralight ergonomic backpack brush cutter equipped with Honda GX50 engine for effortless grass cutting, wheat harvesting, and brush clearing.</p>',
      status: 'Published',
      hsnCode: '8433',
      mrp: 29999,
      sellingPrice: 23999,
      costPrice: 16500,
      gstPercent: 12,
      stockQuantity: 34,
      lowStockThreshold: 8,
      stockStatus: 'IN STOCK',
      mainImage: {
        url: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=800&q=80',
        alt: 'Honda BC-500 Backpack Brush Cutter',
        caption: 'Honda BC-500 50cc 4-Stroke Brush Cutter'
      },
      specifications: [
        { group: 'ENGINE', name: 'Engine Model', value: 'GX50 4-Stroke OHV', unit: '', order: 1 },
        { group: 'ENGINE', name: 'Displacement', value: '47.9', unit: 'cc', order: 2 },
        { group: 'ENGINE', name: 'Engine Power', value: '2.0 HP (1.47 kW)', unit: 'HP', order: 3 },
        { group: 'ENGINE', name: 'Fuel Type', value: 'Pure Petrol (No 2T Oil Mixing Required)', unit: '', order: 4 },
        { group: 'DIMENSIONS', name: 'Dry Weight', value: '9.8', unit: 'kg', order: 5 }
      ],
      idealFor: ['Small Farms', 'Medium Farms', 'Gardening', 'Orchards', 'Paddy', 'Wheat', 'Nurseries'],
      whatsIncluded: ['50cc 4-Stroke Engine Unit on Padded Backpack Frame', 'Flexible Drive Shaft with Solid Steel Inner Cable', '80-Teeth Carbide Tipped Crop Blade', '3-Teeth Heavy Brush Blade', 'Nylon Tap & Go Trimmer', 'Protective Safety Goggles & Earplugs', 'Toolkit'],
      emi: {
        enabled: true,
        minDownPayment: 2499,
        interestRate: 13.5,
        tenureOptions: [3, 6, 9, 12, 18, 24],
        processingFee: 299
      },
      ratings: {
        averageRating: 4.9,
        totalReviews: 15,
        ratingBreakdown: { 5: 14, 4: 1, 3: 0, 2: 0, 1: 0 }
      },
      analytics: {
        views: 420,
        purchasesCount: 22,
        totalRevenue: 527978
      }
    });

    // Product 5: 16L Battery Agriculture Sprayer
    const product5 = new Product({
      name: '2-in-1 Battery cum Manual Knapsack Agriculture Sprayer 16L (KS-16B)',
      slug: 'battery-cum-manual-knapsack-sprayer-16l-ks-16b',
      brand: 'KisanKrafts',
      modelNumber: 'KS-16B',
      sku: 'KK-KS16B-12V',
      productType: 'Agricultural Sprayer',
      category: 'Agricultural Sprayers',
      subcategory: '16L Battery Sprayers',
      shortDescription: 'Dual mode 12V 12Ah lithium battery and manual backup knapsack sprayer with telescopic stainless steel lance and 4 adjustable spray nozzles.',
      description: '<p>Sprays up to 35 tanks on a single battery charge. Ideal for horticulture crops, vineyards, cotton, and greenhouse pest management.</p>',
      status: 'Published',
      hsnCode: '8424',
      mrp: 4999,
      sellingPrice: 3499,
      costPrice: 2100,
      gstPercent: 12,
      stockQuantity: 45,
      lowStockThreshold: 10,
      stockStatus: 'IN STOCK',
      mainImage: {
        url: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&q=80',
        alt: 'KisanKrafts 16L Battery Sprayer',
        caption: 'KisanKrafts KS-16B 16L Battery Sprayer'
      },
      specifications: [
        { group: 'PERFORMANCE', name: 'Tank Capacity', value: '16', unit: 'Liters', order: 1 },
        { group: 'PERFORMANCE', name: 'Pump Pressure', value: '0.2 - 0.45', unit: 'MPa (80 PSI)', order: 2 },
        { group: 'ELECTRICAL', name: 'Battery Specs', value: '12V 12Ah Rechargeable Li-Ion', unit: '', order: 3 },
        { group: 'ELECTRICAL', name: 'Battery Backup', value: '6 - 8', unit: 'Hours (30+ Tanks)', order: 4 },
        { group: 'DIMENSIONS', name: 'Machine Net Weight', value: '5.2', unit: 'kg', order: 5 }
      ],
      idealFor: ['Small Farms', 'Medium Farms', 'Vegetable Farming', 'Orchards', 'Nurseries', 'Gardening'],
      whatsIncluded: ['16L Heavy Duty Polypropylene Tank with Padded Straps', '12V 12Ah Battery & Fast Charger', 'Extendable Stainless Steel Telescopic Lance', 'Set of 4 Brass & Plastic Spray Nozzles', 'Filter Screen & Spare Washer Set'],
      emi: {
        enabled: false,
        minDownPayment: 0
      },
      ratings: {
        averageRating: 4.6,
        totalReviews: 9,
        ratingBreakdown: { 5: 6, 4: 2, 3: 1, 2: 0, 1: 0 }
      },
      analytics: {
        views: 310,
        purchasesCount: 31,
        totalRevenue: 108469
      }
    });

    // Product 6: Everest Shahi Garam Masala
    const product6 = new Product({
      name: 'Everest Shahi Garam Masala (Special Pure Blend)',
      slug: 'everest-shahi-garam-masala',
      brand: 'Everest',
      modelNumber: 'EGM-500',
      sku: 'EVR-GM-500G',
      productType: 'Spices & Groceries',
      category: 'Spices & Masala',
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
        <p><strong>Everest Shahi Garam Masala</strong> is made from finely selected premium Indian spices including green cardamom, mace, cinnamon, black pepper, and cloves.</p>
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
      idealFor: ['Spices & Food Processing', 'Commercial & Retail'],
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

    // Product 7: Tata Sampann Pure Turmeric Powder
    const product7 = new Product({
      name: 'Tata Sampann 100% Pure Haldi (Turmeric Powder with Natural Curcumin)',
      slug: 'tata-sampann-pure-turmeric-haldi',
      brand: 'Tata Sampann',
      modelNumber: 'TS-HALDI-500',
      sku: 'TS-HALDI-500G',
      productType: 'Spices & Groceries',
      category: 'Spices & Masala',
      subcategory: 'Ground Masala Powders',
      unit: 'gm',
      netQuantity: '500',
      unitDisplay: '500 gm',
      variants: [
        { name: '200g Pack', unit: 'gm', quantity: '200', mrp: 55, sellingPrice: 48, discountPercent: 12, stockQuantity: 120, stockStatus: 'IN STOCK', sku: 'TS-HALDI-200G', isDefault: false },
        { name: '500g Pack', unit: 'gm', quantity: '500', mrp: 135, sellingPrice: 115, discountPercent: 15, stockQuantity: 90, stockStatus: 'IN STOCK', sku: 'TS-HALDI-500G', isDefault: true },
        { name: '1 Kg Value Pack', unit: 'kg', quantity: '1', mrp: 260, sellingPrice: 220, discountPercent: 15, stockQuantity: 60, stockStatus: 'IN STOCK', sku: 'TS-HALDI-1KG', isDefault: false }
      ],
      shortDescription: 'Farm-sourced golden turmeric powder with guaranteed minimum 3% natural curcumin content for maximum health benefits and rich aroma.',
      description: `
        <h3>Golden Purity with Natural Curcumin Advantage</h3>
        <p><strong>Tata Sampann Turmeric Powder</strong> is sourced directly from certified organic farms in Salem and Erode. Curcumin is naturally retained without oil depletion.</p>
      `,
      status: 'Published',
      hsnCode: '0910',
      manufacturer: 'Tata Consumer Products Ltd',
      countryOfOrigin: 'India',
      mrp: 135,
      sellingPrice: 115,
      costPrice: 75,
      gstPercent: 5,
      taxIncluded: true,
      stockQuantity: 90,
      lowStockThreshold: 15,
      stockStatus: 'IN STOCK',
      warehouse: 'Bengaluru Agro Hub',
      mainImage: {
        url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=80',
        alt: 'Tata Sampann Golden Turmeric Powder',
        caption: 'Tata Sampann 100% Pure Haldi Powder'
      },
      specifications: [
        { group: 'GENERAL', name: 'Form', value: 'Pure Ground Powder', unit: '', order: 1 },
        { group: 'GENERAL', name: 'Curcumin Content', value: 'Min. 3%', unit: '', order: 2 },
        { group: 'STORAGE & SHELF LIFE', name: 'Shelf Life', value: '12', unit: 'Months', order: 3 },
        { group: 'CERTIFICATIONS', name: 'FSSAI License', value: '10014031001025', unit: '', order: 4 }
      ],
      idealFor: ['Spices & Food Processing', 'Commercial & Retail'],
      whatsIncluded: ['500g Air-Tight Zipper Pouch'],
      shipping: { available: true, panIndia: true, estimatedDeliveryDays: '2 - 4 Business Days', shippingCharge: 40, freeShippingThreshold: 499 },
      warranty: { period: '100% Purity Certified', type: 'FSSAI Guaranteed', provider: 'Tata Sampann', terms: 'Quality guaranteed' },
      emi: { enabled: false },
      ratings: { averageRating: 4.8, totalReviews: 28, ratingBreakdown: { 5: 24, 4: 3, 3: 1, 2: 0, 1: 0 } }
    });

    // Product 8: Fortune Cold Pressed Mustard Oil
    const product8 = new Product({
      name: 'Fortune Kachi Ghani Pure Mustard Oil (Cold Pressed Wood Churned)',
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
      idealFor: ['Commercial & Retail', 'Spices & Food Processing'],
      whatsIncluded: ['1 Liter PET Bottle with Tamper Evident Cap'],
      shipping: { available: true, panIndia: true, estimatedDeliveryDays: '2 - 5 Business Days', shippingCharge: 50, freeShippingThreshold: 499 },
      warranty: { period: 'Purity Tested', type: 'Agmark Grade 1', provider: 'Fortune Foods', terms: 'Quality guaranteed' },
      emi: { enabled: false },
      ratings: { averageRating: 4.7, totalReviews: 19, ratingBreakdown: { 5: 15, 4: 3, 3: 1, 2: 0, 1: 0 } }
    });

    // Product 9: Havells Heavy-Duty Submersible Motor
    const product9 = new Product({
      name: 'Havells 5HP Heavy-Duty Agricultural Submersible Pump Motor',
      slug: 'havells-5hp-submersible-pump-motor',
      brand: 'Havells',
      modelNumber: 'HVL-SUB-50',
      sku: 'HVL-SUB-5HP',
      productType: 'Electronics & Appliances',
      category: 'Electronics & Motors',
      subcategory: 'Submersible Pump Motors',
      unit: 'HP',
      netQuantity: '5',
      unitDisplay: '5 HP',
      variants: [
        { name: '3 HP Single Phase', unit: 'HP', quantity: '3', mrp: 17000, sellingPrice: 14500, discountPercent: 15, stockQuantity: 15, stockStatus: 'IN STOCK', sku: 'HVL-SUB-3HP', isDefault: false },
        { name: '5 HP Three Phase', unit: 'HP', quantity: '5', mrp: 23500, sellingPrice: 19800, discountPercent: 16, stockQuantity: 20, stockStatus: 'IN STOCK', sku: 'HVL-SUB-5HP', isDefault: true },
        { name: '7.5 HP High Head', unit: 'HP', quantity: '7.5', mrp: 32000, sellingPrice: 27500, discountPercent: 14, stockQuantity: 10, stockStatus: 'IN STOCK', sku: 'HVL-SUB-7HP', isDefault: false }
      ],
      shortDescription: 'V4 100% pure copper-wound water-cooled submersible motor with stainless steel AISI-304 shaft and carbon thrust bearing for borewells up to 450 feet.',
      description: '<p>High-efficiency continuous duty submersible motor designed to operate with wide voltage fluctuation from 160V to 440V with low power consumption.</p>',
      status: 'Published',
      hsnCode: '8501',
      manufacturer: 'Havells India Ltd',
      countryOfOrigin: 'India',
      mrp: 23500,
      sellingPrice: 19800,
      costPrice: 14500,
      gstPercent: 18,
      taxIncluded: true,
      stockQuantity: 20,
      lowStockThreshold: 4,
      stockStatus: 'IN STOCK',
      warehouse: 'Noida Central Plant',
      mainImage: {
        url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
        alt: 'Havells Submersible Motor Core',
        caption: 'Havells 5HP Heavy-Duty Submersible Motor'
      },
      specifications: [
        { group: 'ENGINE & POWER', name: 'Rated Power', value: '5 HP (3.7 kW)', unit: 'HP', order: 1 },
        { group: 'ELECTRICAL', name: 'Voltage Range', value: '280 - 440 V (3-Phase 50Hz)', unit: 'V', order: 2 },
        { group: 'ELECTRICAL', name: 'Winding Wire', value: '100% Pure EC Grade Dual Coated Copper', unit: '', order: 3 },
        { group: 'PERFORMANCE', name: 'Max Head Range', value: '60 - 140', unit: 'Meters', order: 4 },
        { group: 'DIMENSIONS & WEIGHT', name: 'Shaft Material', value: 'Stainless Steel AISI 410 / 304', unit: '', order: 5 }
      ],
      idealFor: ['Large Farms', 'Medium Farms', 'Orchards', 'Vegetable Farming'],
      whatsIncluded: ['5HP Submersible Motor Unit', 'Waterproof Cable Connector Kit', 'Installation & Wiring Manual', '1-Year Warranty Card'],
      shipping: { available: true, panIndia: true, estimatedDeliveryDays: '3 - 6 Business Days', shippingCharge: 0, freeShippingThreshold: 4999 },
      warranty: { period: '1 Year Full Replacement Warranty', type: 'Havells Pan-India Onsite Service', provider: 'Havells India', terms: 'Covers winding burnout and rotor defects.' },
      emi: { enabled: true, minDownPayment: 0, minMonthlyEmi: 948 },
      ratings: { averageRating: 4.8, totalReviews: 14, ratingBreakdown: { 5: 12, 4: 2, 3: 0, 2: 0, 1: 0 } }
    });

    // Save all products
    await Promise.all([
      product1.save(),
      product2.save(),
      product3.save(),
      product4.save(),
      product5.save(),
      product6.save(),
      product7.save(),
      product8.save(),
      product9.save()
    ]);

    // Cross-link recommendations & frequently bought together
    product1.recommendations = {
      manualRecommendations: [product4._id, product5._id],
      frequentlyBoughtTogether: [product5._id]
    };
    await product1.save();

    console.log('[Seeder] Seeded 5 comprehensive machinery products.');

    // 5. Seed Customer Verified Review for Product 1 (No fake static orders seeded)
    console.log('[Seeder] Seeding Verified Product Reviews...');
    const review1 = new Review({
      product: product1._id,
      user: user1._id,
      userName: 'Ramesh Patel (Cotton Farmer)',
      order: null,
      rating: 5,
      title: 'Remarkable machine! Saved 4 laborers per acre in my cotton farm',
      comment: 'I purchased the AgriPro AV-708 for my 8-acre cotton and vegetable farm in Rajkot. The 7HP engine starts on the first gentle pull. The 32 curved blades loosen black cotton soil deeply without clogging. Highly recommended for every Indian farmer!',
      farmContext: {
        farmType: 'Cotton & Vegetable Farm',
        cropGrown: 'Cotton, Chilli & Tomato',
        acres: 8
      },
      images: [
        'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=600&q=80'
      ],
      verifiedPurchase: true,
      status: 'Approved',
      helpfulVotes: 24,
      moderatedAt: new Date(),
      moderationNotes: 'Verified review in Rajkot Gujarat.'
    });

    await review1.save();

    // 7. Seed Coupons
    console.log('[Seeder] Seeding Coupons...');
    await Coupon.insertMany([
      {
        code: 'KISAN2026',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 10000,
        maxDiscountAmount: 3000,
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      {
        code: 'HARVEST500',
        discountType: 'fixed',
        discountValue: 500,
        minOrderAmount: 4999,
        maxDiscountAmount: 500,
        validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      }
    ]);

    console.log('[Seeder] Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`[Seeder Error] ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
