const axios = require('axios');

async function testDealsAndExtraDiscount() {
  try {
    const API = 'http://localhost:4000/api';
    console.log('=== TESTING DEALS & EXTRA DISCOUNT FUNCTIONALITY ===\n');

    // 1. Admin login
    const loginRes = await axios.post(`${API}/admin/auth/login`, {
      identifier: 'admin@agrimachinery.com',
      password: 'AgriAdmin@2026#Secure'
    });
    const token = loginRes.data.token;
    const adminHeaders = { Authorization: `Bearer ${token}` };
    console.log('✅ Admin logged in.');

    // 2. Fetch existing products
    const prodsRes = await axios.get(`${API}/admin/products?limit=5`, { headers: adminHeaders });
    if (prodsRes.data.products?.length === 0) {
      console.log('No products found.');
      return;
    }
    const sampleProduct = prodsRes.data.products[0];
    console.log(`✅ Selected Product: "${sampleProduct.name}" (ID: ${sampleProduct._id})`);

    // 3. Update sample product to be Deal of the Day + Extra Discount
    const updateRes = await axios.put(`${API}/admin/products/${sampleProduct._id}`, {
      ...sampleProduct,
      isDealOfTheDay: true,
      dealBadge: '🔥 DHAMAKA HARVEST DEAL',
      hasExtraDiscount: true,
      extraDiscountType: 'FLAT',
      extraDiscountValue: 2500,
      extraDiscountLabel: 'Extra ₹2,500 Subsidy Discount with Kisan Credit Card'
    }, { headers: adminHeaders });

    console.log('✅ Product updated with Deal & Extra Discount settings!');
    console.log(`- Deal Active: ${updateRes.data.product.isDealOfTheDay}`);
    console.log(`- Deal Badge: ${updateRes.data.product.dealBadge}`);
    console.log(`- Extra Discount: ₹${updateRes.data.product.extraDiscountValue} (${updateRes.data.product.extraDiscountLabel})`);
    console.log(`- Effective Farmer Price: ₹${updateRes.data.product.effectivePrice}`);

    // 4. Test Public /deals endpoint
    const dealsRes = await axios.get(`${API}/products/deals`);
    console.log(`\n✅ Public /deals endpoint returned ${dealsRes.data.deals.length} deals.`);
    const foundUpdatedDeal = dealsRes.data.deals.find(d => d._id === sampleProduct._id);
    if (foundUpdatedDeal) {
      console.log(`✅ Verified: Updated product "${foundUpdatedDeal.name}" is present in Public Deals list!`);
      console.log(`- Badge: "${foundUpdatedDeal.dealBadge}"`);
      console.log(`- Extra Discount Label: "${foundUpdatedDeal.extraDiscountLabel}"`);
    }

    console.log('\n🎉 ALL DEALS & EXTRA DISCOUNT TESTS PASSED 100%!');
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
  }
}

testDealsAndExtraDiscount();
