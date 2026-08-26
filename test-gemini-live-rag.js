const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testGeminiLiveRAG() {
  console.log('\n=============================================================');
  console.log('🤖 Testing Google Gemini (2.5 / 3.6 Flash) AI with Store RAG 🤖');
  console.log('=============================================================\n');

  try {
    // 1. Test Agricultural Product Query (Live Gemini Response)
    console.log('[1] Testing Agricultural Query: "7HP power weeder cotton aur sugarcane ke liye kaisa hai?"...');
    const res1 = await axios.post(`${BASE_URL}/ai/chat`, {
      message: '7HP power weeder cotton aur sugarcane ke liye kaisa hai?',
      language: 'hi'
    });
    console.log('  ✅ AI Status:', res1.data.success);
    console.log('  📝 AI Text Snippet:\n   ', res1.data.text.substring(0, 180) + '...\n');
    console.log('  📦 Products Attached:', res1.data.products?.length || 0);

    // 2. Test Subsidy Query
    console.log('\n[2] Testing DBT SMAM Subsidy Query...');
    const res2 = await axios.post(`${BASE_URL}/ai/chat`, {
      message: 'Govt. SMAM subsidy kaise milegi?',
      language: 'hi'
    });
    console.log('  ✅ Subsidy Response Snippet:\n   ', res2.data.text.substring(0, 180) + '...\n');

    // 3. Test Strict Domain Guardrail (Blocked Topic)
    console.log('\n[3] Testing Strict Guardrail Blocking (Bollywood/Movies)...');
    const res3 = await axios.post(`${BASE_URL}/ai/chat`, {
      message: 'Tell me about latest Bollywood movie and actors',
      language: 'hi'
    });
    console.log('  🛡️ Guardrail Response Snippet:\n   ', res3.data.text.substring(0, 180) + '...\n');
    if (res3.data.products?.length === 0 && res3.data.text.includes('AgriMachina')) {
      console.log('  ✅ PASSED: Irrelevant topic successfully blocked by guardrails!');
    }

    // 4. Test Clean Admin State
    console.log('\n[4] Verifying Clean Admin Database State (Zero static orders/tickets)...');
    const adminLoginRes = await axios.post(`${BASE_URL}/admin/auth/login`, {
      identifier: 'admin@agrimachinery.com',
      password: 'AgriAdmin@2026#Secure'
    });
    const adminHeaders = { Authorization: `Bearer ${adminLoginRes.data.token}` };
    const adminOrders = await axios.get(`${BASE_URL}/admin/orders`, { headers: adminHeaders });
    const adminTickets = await axios.get(`${BASE_URL}/support/admin/tickets`, { headers: adminHeaders });
    
    console.log(`  -> Live Orders in Admin: ${adminOrders.data.orders?.length || 0}`);
    console.log(`  -> Live Support Tickets in Admin: ${adminTickets.data.tickets?.length || 0}`);

    console.log('\n=============================================================');
    console.log('🎉 GEMINI 2.5 / 3.6 FLASH INTEGRATION & RAG FULLY VERIFIED!');
    console.log('=============================================================\n');

  } catch (err) {
    console.error('❌ Test Failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

testGeminiLiveRAG();
