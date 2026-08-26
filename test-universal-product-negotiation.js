const mongoose = require('mongoose');
const { processFarmerQuery } = require('./src/services/aiKnowledgeService');

const MONGO_URI = 'mongodb://127.0.0.1:27017/agricultural_ecom';

async function runUniversalProductTests() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('\n================================================================');
    console.log('🧪 TESTING UNIVERSAL AI PRODUCT & STOCK NEGOTIATION 🧪');
    console.log('================================================================\n');

    const testCases = [
      {
        name: 'Unavailable Product: Chaff Cutter / Kutti Machine',
        query: 'kutti katne ke liye chaff cutter chahiye',
        expectedKeyword: ['chaff cutter', 'kutti', 'available nahi', 'stock', 'brush cutter']
      },
      {
        name: 'Unavailable Spec: 3 HP Solar Pump',
        query: '3 hp solar pump kitne ka hai',
        expectedKeyword: ['3 hp', 'available nahi', '5 hp', 'solar']
      },
      {
        name: 'Unavailable Product: Tractor Trolley / Seed Drill',
        query: 'mujhe tractor trolley ya seed drill chahiye',
        expectedKeyword: ['trolley', 'seed drill', 'available nahi', 'rotavator']
      },
      {
        name: 'Unavailable Spec: 10 HP Diesel Power Tiller',
        query: '10 hp ka diesel power tiller milega kya?',
        expectedKeyword: ['10 hp', 'available nahi', '9 hp', 'tiller']
      },
      {
        name: 'Unavailable Spec: 5 HP Power Weeder',
        query: 'i need 5 hp power weeder',
        expectedKeyword: ['5 hp', 'available nahi', '7 hp', 'weeder']
      },
      {
        name: 'Available Product: 7 HP Power Weeder',
        query: '7 hp power weeder ka kya price hai?',
        expectedKeyword: ['7 hp', '38,499', 'av-708']
      }
    ];

    for (const tc of testCases) {
      console.log(`\n----------------------------------------------------------------`);
      console.log(`[TEST CASE] ${tc.name}`);
      console.log(`Query: "${tc.query}"`);

      const res = await processFarmerQuery(tc.query, 'hi');
      console.log(`\nAI Response Preview:`);
      console.log(res.text.slice(0, 300) + '...\n');
      console.log(`Returned Products (${res.products.length}):`, res.products.map(p => p.title));

      const lowerText = res.text.toLowerCase();
      const matched = tc.expectedKeyword.filter(kw => lowerText.includes(kw.toLowerCase()));
      console.log(`Matched Expected Keywords: [${matched.join(', ')}] / [${tc.expectedKeyword.join(', ')}]`);
    }

    console.log('\n================================================================');
    console.log('🎉 ALL UNIVERSAL PRODUCT TESTS COMPLETE 🎉');
    console.log('================================================================\n');

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runUniversalProductTests();
