const mongoose = require('mongoose');
const env = require('../config/env');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const Category = require('../models/Category');

const imageMap = {
  power_weeder: '/images/machinery/power_weeder.jpg',
  solar_pump: '/images/machinery/solar_pump.jpg',
  rotavator: '/images/machinery/rotavator.jpg',
  brush_cutter: '/images/machinery/brush_cutter.jpg',
  sprayer: '/images/machinery/sprayer.jpg'
};

async function updateImages() {
  await connectDB();
  console.log('--- UPDATING PRODUCT & CATEGORY IMAGES WITH MATCHING AGRICULTURAL ASSETS ---');

  // Update Categories
  await Category.updateOne({ name: 'Power Weeders' }, { $set: { image: imageMap.power_weeder } });
  await Category.updateOne({ name: 'Rotavators & Tillers' }, { $set: { image: imageMap.rotavator } });
  await Category.updateOne({ name: 'Brush Cutters & Harvesters' }, { $set: { image: imageMap.brush_cutter } });
  await Category.updateOne({ name: 'Water Pumps & Solar Irrigation' }, { $set: { image: imageMap.solar_pump } });
  await Category.updateOne({ name: 'Agricultural Sprayers' }, { $set: { image: imageMap.sprayer } });
  await Category.updateOne({ name: 'Chaff Cutters & Threshers' }, { $set: { image: imageMap.power_weeder } });
  console.log('✅ Categories updated with authentic machinery images');

  // Update Products
  const products = await Product.find({});
  for (const prod of products) {
    let chosenImg = imageMap.power_weeder;
    const cat = (prod.category || '').toLowerCase();
    const name = (prod.name || '').toLowerCase();

    if (cat.includes('weeder') || name.includes('weeder') || name.includes('tiller')) {
      chosenImg = imageMap.power_weeder;
    } else if (cat.includes('pump') || cat.includes('solar') || name.includes('pump') || name.includes('solar')) {
      chosenImg = imageMap.solar_pump;
    } else if (cat.includes('rotavator') || name.includes('rotavator')) {
      chosenImg = imageMap.rotavator;
    } else if (cat.includes('cutter') || cat.includes('harvest') || name.includes('brush') || name.includes('cutter')) {
      chosenImg = imageMap.brush_cutter;
    } else if (cat.includes('spray') || name.includes('spray')) {
      chosenImg = imageMap.sprayer;
    }

    prod.mainImage = {
      url: chosenImg,
      alt: `${prod.name} Official Machinery Image`,
      caption: prod.name
    };

    if (prod.gallery && prod.gallery.length > 0) {
      prod.gallery = [
        { url: chosenImg, tag: '01 Main', order: 1 },
        { url: chosenImg, tag: '02 Field View', order: 2 },
        { url: chosenImg, tag: '03 Engine Detail', order: 3 }
      ];
    } else {
      prod.gallery = [{ url: chosenImg, tag: '01 Main', order: 1 }];
    }

    await prod.save();
    console.log(`✅ Updated: [${prod.category}] -> ${prod.name} with ${chosenImg}`);
  }

  console.log('🎉 ALL PRODUCTS AND CATEGORIES SYNCED WITH REAL AGRICULTURAL MACHINERY IMAGES!');
  process.exit(0);
}

updateImages().catch(err => {
  console.error('Error updating images:', err);
  process.exit(1);
});
