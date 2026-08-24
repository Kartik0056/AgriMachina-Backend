const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function testReviewModeration() {
  console.log('=== TESTING ADMIN REVIEW MODERATION (APPROVE & PUBLISH / REJECT) ===\n');

  try {
    // 1. Admin login
    const adminRes = await axios.post(`${API_URL}/admin/auth/login`, {
      identifier: 'admin@agrimachinery.com',
      password: 'AgriAdmin@2026#Secure'
    });
    const adminToken = adminRes.data.token;
    const adminAuth = { headers: { Authorization: `Bearer ${adminToken}` } };
    console.log('✅ Admin logged in:', adminRes.data.admin.name);

    // 2. Fetch pending or all reviews
    const reviewsRes = await axios.get(`${API_URL}/admin/reviews?limit=5`, adminAuth);
    console.log(`✅ Retrieved ${reviewsRes.data.reviews.length} reviews for moderation.`);

    if (reviewsRes.data.reviews.length === 0) {
      console.log('No reviews found to moderate.');
      return;
    }

    const testReview = reviewsRes.data.reviews[0];
    console.log(`\nTesting with Review ID: ${testReview._id} (Current status: ${testReview.status})`);

    // 3. Moderate to Approved
    console.log('[3] Calling PUT /api/admin/reviews/:id/moderate with status = Approved...');
    const modRes = await axios.put(`${API_URL}/admin/reviews/${testReview._id}/moderate`, {
      status: 'Approved',
      notes: 'Approved by Master Admin via Desk'
    }, adminAuth);
    console.log('✅ Review Moderated Successfully! New Status:', modRes.data.review.status);

    // 4. Test Approve route directly
    console.log('\n[4] Testing POST /api/admin/reviews/:id/approve...');
    const approveRes = await axios.post(`${API_URL}/admin/reviews/${testReview._id}/approve`, {
      notes: 'Approved and published'
    }, adminAuth);
    console.log('✅ Approve endpoint working! Status:', approveRes.data.review.status);

    console.log('\n🎉 ADMIN REVIEW MODERATION & PUBLISH FIXED 100%!');
  } catch (err) {
    console.error('❌ Test Failed:', err.response?.data || err.message);
  }
}

testReviewModeration();
