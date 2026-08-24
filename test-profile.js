const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function testProfileAndCategories() {
  console.log('=== TESTING USER PROFILE, ADDRESSES, PASSWORD & REGREEN CATEGORIES ===\n');

  try {
    // 1. Check regreen categories
    console.log('[1] Testing GET /api/categories (Regreen Agro Sync)...');
    const catRes = await axios.get(`${API_URL}/categories`);
    console.log('✅ Categories count:', catRes.data.categories?.length);
    console.log('   Categories list:', catRes.data.categories?.map(c => c.name).join(', '));

    // 2. Register / Login test user
    console.log('\n[2] Testing User Login...');
    const loginRes = await axios.post(`${API_URL}/users/login`, {
      email: 'ramesh.patel@kisanmail.in',
      password: 'Farmer@2026'
    });
    const token = loginRes.data.token;
    console.log('✅ Logged in as:', loginRes.data.user.name);

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 3. Test Update Profile
    console.log('\n[3] Testing PUT /api/users/profile (Edit profile & farm info)...');
    const updateRes = await axios.put(`${API_URL}/users/profile`, {
      name: 'Ramesh Patel (Kisan Ratna)',
      phone: '+91 98765 43210',
      farmDetails: {
        farmType: 'Cotton & Sugarcane Mechanized Farm',
        farmSizeAcres: 12,
        state: 'Gujarat',
        district: 'Rajkot',
        preferredLanguage: 'Gujarati'
      }
    }, authHeaders);
    console.log('✅ Profile updated:', updateRes.data.user.name, '| Acres:', updateRes.data.user.farmDetails?.farmSizeAcres);

    // 4. Test Add Multiple Saved Addresses
    console.log('\n[4] Testing POST /api/users/addresses (Add multiple farm addresses)...');
    const addr1Res = await axios.post(`${API_URL}/users/addresses`, {
      fullName: 'Ramesh Patel',
      phone: '+91 98765 43210',
      street: 'Survey No. 88, Near Canal Bridge',
      villageCity: 'Gondal',
      district: 'Rajkot',
      state: 'Gujarat',
      pincode: '360001',
      addressType: 'Farm',
      isDefault: true
    }, authHeaders);
    console.log('✅ Address 1 added. Total saved addresses:', addr1Res.data.addresses?.length);

    const addr2Res = await axios.post(`${API_URL}/users/addresses`, {
      fullName: 'Ramesh Patel (Warehouse)',
      phone: '+91 98765 43210',
      street: 'Godown #4, APMC Market Yard',
      villageCity: 'Rajkot',
      district: 'Rajkot',
      state: 'Gujarat',
      pincode: '360003',
      addressType: 'Warehouse',
      isDefault: false
    }, authHeaders);
    console.log('✅ Address 2 (Warehouse) added. Total addresses:', addr2Res.data.addresses?.length);

    // 5. Test Change Password
    console.log('\n[5] Testing PUT /api/users/change-password...');
    const passRes = await axios.put(`${API_URL}/users/change-password`, {
      currentPassword: 'Farmer@2026',
      newPassword: 'Farmer@2026#New'
    }, authHeaders);
    console.log('✅ Password changed:', passRes.data.message);

    // Revert password back for consistency
    await axios.put(`${API_URL}/users/change-password`, {
      currentPassword: 'Farmer@2026#New',
      newPassword: 'Farmer@2026'
    }, authHeaders);
    console.log('✅ Password reset back to default.');

    // 6. Test Forgot Password OTP flow
    console.log('\n[6] Testing POST /api/users/forgot-password (OTP Flow)...');
    const forgotRes = await axios.post(`${API_URL}/users/forgot-password`, {
      email: 'ramesh.patel@kisanmail.in'
    });
    console.log('✅ Forgot password OTP generated:', forgotRes.data.demoOtp);

    const resetRes = await axios.post(`${API_URL}/users/reset-password`, {
      email: 'ramesh.patel@kisanmail.in',
      otp: forgotRes.data.demoOtp,
      newPassword: 'Farmer@2026'
    });
    console.log('✅ Password reset with OTP success:', resetRes.data.message);

    console.log('\n🎉 ALL USER PROFILE & REGREEN CATEGORIES TESTS PASSED 100%!');
  } catch (err) {
    console.error('❌ Test error:', err.response?.data || err.message);
  }
}

testProfileAndCategories();
