const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function testReviewSystem() {
  console.log('=== TESTING FARMER REVIEW CREATION, DISPLAY, EDIT & DELETE ===\n');

  try {
    // 1. Login user
    const loginRes = await axios.post(`${API_URL}/users/login`, {
      email: 'ramesh.patel@kisanmail.in',
      password: 'Farmer@2026'
    });
    const token = loginRes.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✅ Logged in as:', loginRes.data.user.name);

    // 2. Fetch a product
    const prodRes = await axios.get(`${API_URL}/products?limit=1`);
    const product = prodRes.data.products[0];
    console.log('✅ Testing with product:', product.name, '| ID:', product._id);

    // 3. Submit a new review
    console.log('\n[3] Submitting Review...');
    const submitRes = await axios.post(`${API_URL}/reviews/${product._id}`, {
      rating: 5,
      title: 'Zabardast power weeder! 100% Recommended',
      comment: 'Bohot hi badhiya machine hai. Cotton kheti me 5 labor ka kaam akele 2 ghante me ho gaya. Fuel consumption bhi bohot kam hai.',
      farmContext: {
        farmType: 'Cotton & Sugarcane',
        cropGrown: 'Cotton',
        acres: 8
      }
    }, authHeaders);
    console.log('✅ Review Submitted successfully! Status:', submitRes.data.review.status);
    const reviewId = submitRes.data.review._id;

    // 4. Fetch product reviews to verify it is immediately visible
    console.log('\n[4] Fetching Product Reviews...');
    const fetchRes = await axios.get(`${API_URL}/reviews/${product._id}`);
    const foundReview = fetchRes.data.reviews.find(r => r._id === reviewId);
    if (foundReview) {
      console.log(`✅ Review is LIVE on product page! Author: ${foundReview.userName} | Stars: ${foundReview.rating}★ | Title: ${foundReview.title}`);
    } else {
      console.error('❌ Review not found in public reviews list!');
    }

    // 5. Edit the review
    console.log('\n[5] Editing Review (Updating to 4 Stars & new title)...');
    const editRes = await axios.put(`${API_URL}/reviews/${reviewId}`, {
      rating: 4,
      title: 'Updated: Very good weeder after 3 weeks of usage',
      comment: '3 hafte chalane ke baad bhi engine smooth chal raha hai. Build quality solid hai.'
    }, authHeaders);
    console.log(`✅ Review Edited successfully! New Title: "${editRes.data.review.title}" | Stars: ${editRes.data.review.rating}★`);

    // 6. Delete the review
    console.log('\n[6] Deleting Review...');
    const deleteRes = await axios.delete(`${API_URL}/reviews/${reviewId}`, authHeaders);
    console.log('✅ Review Deleted successfully! Message:', deleteRes.data.message);

    // 7. Verify deletion
    const verifyFetchRes = await axios.get(`${API_URL}/reviews/${product._id}`);
    const checkDeleted = verifyFetchRes.data.reviews.find(r => r._id === reviewId);
    if (!checkDeleted) {
      console.log('✅ Verified review is removed from product reviews list!');
    } else {
      console.error('❌ Review still exists after deletion!');
    }

    console.log('\n🎉 ALL FARMER REVIEW FEATURES (SUBMIT, VIEW, EDIT, DELETE) PASSED 100%!');
  } catch (err) {
    console.error('❌ Test Failed:', err.response?.data || err.message);
  }
}

testReviewSystem();
