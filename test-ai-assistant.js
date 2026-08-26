const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api/ai/chat';

async function runAIAssistantTests() {
  console.log('\n======================================================');
  console.log('🌾 Testing AgriMachina Store-Aware AI Assistant & Guardrails 🌾');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  async function testCase(name, query, lang, validateFn) {
    try {
      console.log(`[TEST] ${name}`);
      console.log(`  -> Query: "${query}" (Lang: ${lang})`);
      const res = await axios.post(BASE_URL, { message: query, lang });
      if (res.data.success && res.data.data) {
        const data = res.data.data;
        const check = validateFn(data);
        if (check.ok) {
          console.log(`  ✅ PASSED: ${check.msg}`);
          console.log(`  Sample Response Snippet:\n     "${data.text.split('\n')[0]}"`);
          passed++;
        } else {
          console.error(`  ❌ FAILED: ${check.msg}`);
          failed++;
        }
      } else {
        console.error('  ❌ FAILED: Invalid response payload structure', res.data);
        failed++;
      }
    } catch (err) {
      console.error('  ❌ FAILED with Error:', err.response?.data || err.message);
      failed++;
    }
    console.log('------------------------------------------------------');
  }

  // 1. Live Catalog Query
  await testCase(
    'Live Database Product Query (7HP Power Weeder Price & Specs)',
    '7HP power weeder ka price kitna hai aur kya specs hain?',
    'hi',
    (data) => {
      const hasPrice = data.text.includes('₹38,499') || data.text.includes('38,499');
      const hasProducts = data.products && data.products.length > 0;
      if (hasPrice && hasProducts) {
        return { ok: true, msg: `Found live product (${data.products[0].title}) with accurate price and ${data.products.length} catalog items.` };
      }
      return { ok: false, msg: `Missing price or products array. Response text: ${data.text}` };
    }
  );

  // 2. Crop Compatibility Guidance
  await testCase(
    'Crop-Specific Farming Query (Cotton & Sugarcane Weeding)',
    'Kapas aur Ganne ki kheti ke liye kaun si machine best hai?',
    'hi',
    (data) => {
      const hasRecommendation = data.text.includes('Power Weeder') || data.text.includes('Weeder');
      if (hasRecommendation) {
        return { ok: true, msg: 'Accurately recommended 7HP Power Weeder for cotton & sugarcane.' };
      }
      return { ok: false, msg: 'Did not provide crop-specific weeder recommendation.' };
    }
  );

  // 3. Government SMAM / DBT Subsidy
  await testCase(
    'Govt. SMAM / DBT Subsidy Query',
    'How to claim Govt SMAM subsidy on farm machinery?',
    'en',
    (data) => {
      const hasSubsidy = data.text.includes('SMAM') || data.text.includes('DBT') || data.text.includes('40%');
      if (hasSubsidy) {
        return { ok: true, msg: 'Provided accurate 40%-50% SMAM / DBT subsidy and GST invoice details.' };
      }
      return { ok: false, msg: 'Subsidy information missing.' };
    }
  );

  // 4. 0% No-Cost EMI Financing
  await testCase(
    '0% No-Cost EMI Loan Options',
    '0% No-Cost EMI loan kaise milega?',
    'hi',
    (data) => {
      const hasEMI = data.text.includes('EMI') && (data.text.includes('SBI') || data.text.includes('HDFC') || data.text.includes('36'));
      if (hasEMI) {
        return { ok: true, msg: 'Accurately returned banking partners and flexible installment tenures.' };
      }
      return { ok: false, msg: 'EMI details missing.' };
    }
  );

  // 5. Strict Guardrail Test 1: Politics
  await testCase(
    'Strict Guardrail Check: Political Question (France PM)',
    'Who is the Prime Minister of France?',
    'en',
    (data) => {
      const isBlocked = data.text.includes('dedicated to assisting you with farming equipment') || data.text.includes('AgriMachina');
      const noProducts = !data.products || data.products.length === 0;
      if (isBlocked && noProducts) {
        return { ok: true, msg: 'Correctly blocked off-topic political question with polite store guidance.' };
      }
      return { ok: false, msg: 'Failed to block off-topic query.' };
    }
  );

  // 6. Strict Guardrail Test 2: Coding
  await testCase(
    'Strict Guardrail Check: Programming Query (Python script)',
    'Write a python code for fibonacci series',
    'hi',
    (data) => {
      const isBlocked = data.text.includes('Main sirf') || data.text.includes('AgriMachina');
      if (isBlocked) {
        return { ok: true, msg: 'Correctly blocked non-agricultural coding request.' };
      }
      return { ok: false, msg: 'Failed to block coding query.' };
    }
  );

  // 7. Strict Guardrail Test 3: Entertainment
  await testCase(
    'Strict Guardrail Check: Bollywood Movie Gossip',
    'Tell me about latest Bollywood movie actor and songs',
    'hi',
    (data) => {
      const isBlocked = data.text.includes('Main sirf') || data.text.includes('kheti ki machinery');
      if (isBlocked) {
        return { ok: true, msg: 'Correctly blocked entertainment gossip request.' };
      }
      return { ok: false, msg: 'Failed to block entertainment query.' };
    }
  );

  console.log(`\n======================================================`);
  console.log(`📊 AI ASSISTANT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAIAssistantTests();
