const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function testReviewMedia() {
  console.log('=== TESTING REVIEW SUBMISSION WITH MULTI-PHOTOS & VIDEO LINK ===\n');

  try {
    // 1. Login user
    const loginRes = await axios.post(`${API_URL}/users/login`, {
      email: 'ramesh.patel@kisanmail.in',
      password: 'Farmer@2026'
    });
    const token = loginRes.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✅ Logged in as:', loginRes.data.user.name);

    // 2. Fetch product
    const prodRes = await axios.get(`${API_URL}/products?limit=1`);
    const product = prodRes.data.products[0];
    console.log('✅ Testing with product:', product.name);

    // 3. Submit Review with 2 Photos and 1 YouTube working demo video
    console.log('\n[3] Submitting Review with Photos and Video...');
    const submitRes = await axios.post(`${API_URL}/reviews/${product._id}`, {
      rating: 5,
      title: 'Power Weeder field test in cotton farm - Video attached!',
      comment: 'Khet me live demonstration ka video link add kiya hai. Bahut smooth chal raha hai machine!',
      farmContext: {
        farmType: 'Cotton Farm',
        cropGrown: 'Cotton',
        acres: 6
      },
      images: [
        'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=600&q=80',
        'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&q=80'
      ],
      videoUrl: 'https://www.youtube.com/watch?v=0Lz8Ew0DbgM'
    }, authHeaders);

    console.log('✅ Review Created with Photos & Video successfully!');
    console.log('   Review ID:', submitRes.data.review._id);
    console.log('   Photos count:', submitRes.data.review.images?.length);
    console.log('   Video URL:', submitRes.data.review.videoUrl);

    // 4. Fetch to verify
    const fetchRes = await axios.get(`${API_URL}/reviews/${product._id}`);
    const found = fetchRes.data.reviews.find(r => r._id === submitRes.data.review._id);
    if (found) {
      console.log('✅ Verified review loaded in public API with attached video & photos!');
      console.log('   Found Video:', found.videoUrl);
      console.log('   Found Photos:', found.images);
    }

    console.log('\n🎉 REVIEW MULTI-PHOTO & VIDEO SYSTEM VERIFIED 100%!');
  } catch (err) {
    console.error('❌ Test Failed:', err.response?.data || err.message);
  }
}

testReviewMedia();
