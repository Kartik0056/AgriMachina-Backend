require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agricultural_ecom';

async function seedVideos() {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected for video seeding');

  const updates = [
    {
      slug: 'power-weeder-7hp-petrol-av-708',
      video: {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Power Weeder 7HP Petrol 4-Stroke - Hard Soil Tilling Demo'
      }
    },
    {
      slug: '5hp-solar-submersible-pump-set',
      video: {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: '5HP Solar Submersible Pump - Live Canal Discharge & MPPT Tracking'
      }
    },
    {
      slug: '50cc-multi-crop-backpack-brush-cutter',
      video: {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: '50cc Backpack Multi-Crop Brush Cutter - Paddy & Wheat Harvesting Demo'
      }
    },
    {
      slug: '2-in-1-battery-cum-manual-knapsack-agriculture-sprayer-16l',
      video: {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: '16L Battery Knapsack Sprayer - Dual Motor Pressure Spraying Demo'
      }
    }
  ];

  for (const item of updates) {
    const res = await Product.findOneAndUpdate(
      { slug: item.slug },
      { $set: { video: item.video } },
      { new: true }
    );
    if (res) {
      console.log(`✅ Video attached to ${res.name}: ${item.video.title}`);
    }
  }

  console.log('🎉 Product videos seeded successfully!');
  process.exit(0);
}

seedVideos().catch(err => {
  console.error(err);
  process.exit(1);
});
