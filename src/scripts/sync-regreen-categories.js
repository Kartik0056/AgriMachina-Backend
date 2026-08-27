const mongoose = require('mongoose');
const env = require('../config/env');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Product = require('../models/Product');

const regreenCategories = [
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
      { name: 'Ground Masala Powders', slug: 'ground-masala' },
      { name: 'Blended Gourmet Masala', slug: 'blended-masala' },
      { name: 'Whole Spices (Khada Masala)', slug: 'whole-spices' }
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
      'Direct Farm Sourced Organic Pulses'
    ],
    subcategories: [
      { name: 'Cold-Pressed Oils', slug: 'cold-pressed-oils' },
      { name: 'Organic Pulses & Dals', slug: 'organic-pulses' },
      { name: 'Farm Fresh Ghee & Honey', slug: 'ghee-honey' }
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
      'Pan-India 1-Year Comprehensive Warranty'
    ],
    subcategories: [
      { name: 'Submersible Pump Motors', slug: 'submersible-motors' },
      { name: 'Smart Starter Panels', slug: 'starter-panels' },
      { name: 'Solar MPPT Inverters', slug: 'solar-inverters' }
    ],
    order: 3
  },
  {
    name: 'Power Weeder & Tiller',
    slug: 'power-weeder-tiller',
    description: 'High-torque petrol & diesel weeders, rotary cultivators, and mini tillers for soil preparation and inter-row weeding.',
    icon: 'Tractor',
    image: '/images/machinery/power_weeder.jpg',
    categoryType: 'Agricultural Machinery',
    unitType: 'power',
    startingPrice: '₹38,499',
    subcategories: [
      { name: '7HP Petrol Power Weeders', slug: 'petrol-weeders' },
      { name: '9HP Diesel Heavy Tillers', slug: 'diesel-weeders' },
      { name: 'Mini Rotary Cultivators', slug: 'mini-cultivators' }
    ],
    order: 4
  },
  {
    name: 'Earth Auger',
    slug: 'earth-auger',
    description: '1-man and 2-man post hole diggers, tree planting drills, and soil augers with heavy alloy bits.',
    icon: 'Layers',
    image: '/images/machinery/rotavator.jpg',
    subcategories: [
      { name: '52cc 1-Man Soil Auger', slug: '1-man-auger' },
      { name: '68cc Heavy Duty 2-Man Auger', slug: '2-man-auger' },
      { name: '4" to 12" Auger Drill Bits', slug: 'auger-drill-bits' }
    ],
    order: 2
  },
  {
    name: 'Pumps & Irrigation',
    slug: 'pumps-irrigation',
    description: 'Solar submersible pumps, high-head DC brushless motors, centrifugal water pumps, and drip systems.',
    icon: 'Droplets',
    image: '/images/machinery/solar_pump.jpg',
    subcategories: [
      { name: 'Solar Submersible Pump Sets', slug: 'solar-submersible' },
      { name: 'Petrol / Kerosene Water Pumps', slug: 'petrol-water-pumps' },
      { name: 'MPPT Smart Solar Inverters', slug: 'solar-controllers' }
    ],
    order: 3
  },
  {
    name: 'Sprayers & Crop Protection',
    slug: 'sprayers-crop-protection',
    description: 'Battery knapsack sprayers, high-pressure HTP power sprayers, mist blowers, and chemical lances.',
    icon: 'Sparkles',
    image: '/images/machinery/sprayer.jpg',
    subcategories: [
      { name: '16L / 20L Battery Knapsack Sprayers', slug: 'battery-knapsack' },
      { name: 'Portable Engine HTP Sprayers', slug: 'engine-htp-sprayers' },
      { name: 'Tractor Mounted Boom Sprayers', slug: 'tractor-sprayers' }
    ],
    order: 4
  },
  {
    name: 'Harvesting Machinery',
    slug: 'harvesting-machinery',
    description: 'Multi-crop backpack brush cutters, crop reapers, paddy harvesters, and chainsaws.',
    icon: 'Scissors',
    image: '/images/machinery/brush_cutter.jpg',
    subcategories: [
      { name: '50cc Backpack Brush Cutters', slug: 'backpack-brush-cutters' },
      { name: 'Side-Pack Multi-Tool Harvesters', slug: 'side-pack-cutters' },
      { name: '80T Alloy Crop Harvester Blades', slug: 'harvester-blades' }
    ],
    order: 5
  },
  {
    name: 'Post Harvesting',
    slug: 'post-harvesting',
    description: 'Motorized chaff cutters, grain threshers, commercial flour mills, and mini rice mills.',
    icon: 'CheckCircle',
    image: '/images/machinery/rotavator.jpg',
    subcategories: [
      { name: 'Electric Fodder & Chaff Cutters', slug: 'chaff-cutters' },
      { name: 'Multi-Crop Grain Threshers', slug: 'grain-threshers' },
      { name: 'Flour & Rice Processing Mills', slug: 'processing-mills' }
    ],
    order: 6
  },
  {
    name: 'Power Reaper',
    slug: 'power-reaper',
    description: 'Self-propelled paddy, wheat, and soybean reaper machines with automatic crop windrowing.',
    icon: 'Tractor',
    image: '/images/machinery/brush_cutter.jpg',
    subcategories: [
      { name: 'Walking Tractor Crop Reaper', slug: 'walking-reaper' },
      { name: 'Crop Binder Attachment', slug: 'crop-binder' }
    ],
    order: 7
  },
  {
    name: 'Lawn Mower & Gardening Tools',
    slug: 'lawn-mower-gardening',
    description: 'High-torque hedge trimmers, electric lawn mowers, chain saws, and pruning shears.',
    icon: 'Scissors',
    image: '/images/machinery/brush_cutter.jpg',
    subcategories: [
      { name: 'Self-Propelled Lawn Mowers', slug: 'lawn-mowers' },
      { name: 'Hedge Trimmers & Pruners', slug: 'hedge-trimmers' }
    ],
    order: 8
  },
  {
    name: 'Power & Engines',
    slug: 'power-engines',
    description: 'General purpose 4-stroke OHV petrol engines, diesel power blocks, and agricultural dynamos.',
    icon: 'Zap',
    image: '/images/machinery/power_weeder.jpg',
    subcategories: [
      { name: '7HP 208cc Petrol Engines', slug: 'petrol-engines' },
      { name: '9HP / 12HP Diesel Engines', slug: 'diesel-engines' }
    ],
    order: 9
  },
  {
    name: 'Accessories & Attachment',
    slug: 'accessories-attachment',
    description: 'Heat-treated boron steel tilling blades, ridgers, ditchers, high-pressure spray hoses, and safety gear.',
    icon: 'Layers',
    image: '/images/machinery/rotavator.jpg',
    subcategories: [
      { name: 'Boron Steel Tilling Blades', slug: 'tilling-blades' },
      { name: 'Adjustable Furrower / Ridgers', slug: 'ridger-attachments' },
      { name: 'Anti-Vibration Handles & Safety Kits', slug: 'safety-kits' }
    ],
    order: 10
  }
];

async function syncCategories() {
  await connectDB();
  console.log('--- SYNCING CATEGORIES ACCORDING TO REGREENAGRO.IN SPECIFICATION ---');

  // Clear and re-populate categories
  await Category.deleteMany({});
  const inserted = await Category.insertMany(regreenCategories);
  console.log(`✅ Successfully seeded ${inserted.length} categories from regreenagro.in!`);

  // Update existing products with the matching new category names
  const updates = [
    { filter: { name: { $regex: /weeder|tiller/i } }, update: { category: 'Power Weeder & Tiller' } },
    { filter: { name: { $regex: /solar|pump/i } }, update: { category: 'Pumps & Irrigation' } },
    { filter: { name: { $regex: /spray/i } }, update: { category: 'Sprayers & Crop Protection' } },
    { filter: { name: { $regex: /rotavator/i } }, update: { category: 'Accessories & Attachment' } },
    { filter: { name: { $regex: /brush|cutter|harvest/i } }, update: { category: 'Harvesting Machinery' } },
    { filter: { name: { $regex: /chaff|thresh/i } }, update: { category: 'Post Harvesting' } }
  ];

  for (const u of updates) {
    const res = await Product.updateMany(u.filter, { $set: u.update });
    console.log(`✅ Updated matching products to [${u.update.category}] (Count: ${res.modifiedCount})`);
  }

  console.log('🎉 REGREEN AGRO CATEGORIES SYNC COMPLETE!');
  process.exit(0);
}

syncCategories().catch(err => {
  console.error('Error syncing categories:', err);
  process.exit(1);
});
