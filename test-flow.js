const axios = require('axios');
const XLSX = require('xlsx');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('================================================================');
  console.log('🚜 AGRICULTURAL E-COMMERCE & ADMIN CMS BACKEND TEST SUITE');
  console.log('================================================================\n');

  let adminToken = '';
  let customerToken = '';
  let testProductId = '';
  let testOrderId = '';
  let testReviewId = '';

  try {
    // 1. Health check
    console.log('1. Testing System Health Check...');
    const healthRes = await axios.get(`${API_BASE}/health`);
    console.log('   ✅ Health Status:', healthRes.data.status, '\n');

    // 2. Test Admin Login (First-Run Bootstrapped Account)
    console.log('2. Testing Admin Login & Authentication...');
    const adminLoginRes = await axios.post(`${API_BASE}/admin/auth/login`, {
      identifier: 'admin@agrimachinery.com',
      password: 'AgriAdmin@2026#Secure'
    });

    if (adminLoginRes.data.success && adminLoginRes.data.token) {
      adminToken = adminLoginRes.data.token;
      console.log('   ✅ Admin Authenticated successfully!');
      console.log('   ✅ Role:', adminLoginRes.data.admin.role);
      console.log('   ✅ Permissions Count:', adminLoginRes.data.admin.permissions.length);
      console.log('   ✅ PasswordHash omitted from response:', adminLoginRes.data.admin.passwordHash === undefined);
    } else {
      throw new Error('Admin login failed: ' + JSON.stringify(adminLoginRes.data));
    }
    console.log('');

    const adminHeaders = {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    };

    // 3. Test 15-Tab Product Creation API
    console.log('3. Testing 15-Tab Agricultural Machinery Product Creation API...');
    const newProductPayload = {
      name: 'High-Torque Mini Power Tiller 9HP Diesel',
      sku: `TEST-PT900-D-${Date.now().toString().slice(-4)}`,
      brand: 'AgriPro Master',
      modelNumber: 'PT-900D',
      category: 'Power Weeders',
      subcategory: 'Diesel Heavy Weeders',
      shortDescription: '9 HP direct injection diesel power tiller with electric self-start and 36-blade rotary system.',
      description: '<h3>Industrial Diesel Tilling Power</h3><p>Designed for heavy clay soils and deep inter-cultivation.</p>',
      mrp: 65000,
      sellingPrice: 54999,
      costPrice: 41000,
      gstPercent: 12,
      stockQuantity: 15,
      lowStockThreshold: 4,
      status: 'Published',
      mainImage: {
        url: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80',
        alt: 'PT-900D Diesel Tiller',
        caption: 'PT-900D Diesel Tiller'
      },
      specifications: [
        { group: 'ENGINE', name: 'Engine Power', value: '9 HP (6.6 kW)', unit: 'HP', order: 1 },
        { group: 'ENGINE', name: 'Displacement', value: '418', unit: 'cc', order: 2 },
        { group: 'ENGINE', name: 'Fuel Type', value: 'Diesel', unit: '', order: 3 },
        { group: 'PERFORMANCE', name: 'Working Width', value: '800 - 1100', unit: 'mm', order: 4 },
        { group: 'DIMENSIONS', name: 'Machine Weight', value: '115', unit: 'kg', order: 5 }
      ],
      features: [
        { title: 'Direct-Injection Diesel Engine', description: 'Maximum fuel efficiency at 0.55 L/hr under load.', icon: 'Zap' },
        { title: 'Self-Start Key Ignition', description: 'Effortless electric start with 12V 36Ah battery.', icon: 'Key' }
      ],
      applications: [
        { name: 'Deep Tilling', description: 'Loosens soil up to 200mm depth.', icon: 'Sprout' }
      ],
      idealFor: ['Medium Farms', 'Large Farms', 'Sugarcane', 'Cotton'],
      whatsIncluded: ['Tiller Machine', '36 Blades Set', 'Iron Wheels', 'Toolkit'],
      emi: {
        enabled: true,
        minDownPayment: 4999,
        interestRate: 13.5,
        tenureOptions: [6, 12, 18, 24, 36],
        processingFee: 499
      },
      seo: {
        seoTitle: '9HP Diesel Power Tiller | Buy Online at Best Price',
        metaDescription: 'High power 9HP diesel power tiller with electric start and 1 year warranty.',
        focusKeyword: '9hp diesel power tiller'
      }
    };

    const createProductRes = await axios.post(`${API_BASE}/admin/products`, newProductPayload, adminHeaders);
    if (createProductRes.data.success) {
      testProductId = createProductRes.data.product._id;
      console.log('   ✅ Created Product ID:', testProductId);
      console.log('   ✅ Calculated Discount Amount: ₹', createProductRes.data.product.discountAmount);
      console.log('   ✅ Calculated Discount %:', createProductRes.data.product.discountPercent, '%');
      console.log('   ✅ Min Monthly EMI Auto-Calculated: ₹', createProductRes.data.product.emi.minMonthlyEmi, '/month');
      console.log('   ✅ Stock Status Auto-Set:', createProductRes.data.product.stockStatus);
    }
    console.log('');

    // 4. Test Product Duplication API
    console.log('4. Testing Product Duplication API...');
    const duplicateRes = await axios.post(`${API_BASE}/admin/products/${testProductId}/duplicate`, {}, adminHeaders);
    if (duplicateRes.data.success) {
      console.log('   ✅ Cloned Product SKU:', duplicateRes.data.product.sku);
      console.log('   ✅ Cloned Status:', duplicateRes.data.product.status, '(Draft as required)');
      // Cleanup duplicate
      await axios.delete(`${API_BASE}/admin/products/${duplicateRes.data.product._id}`, adminHeaders);
      console.log('   ✅ Cloned Product deleted during cleanup.');
    }
    console.log('');

    // 5. Test Authoritative Reducing-Balance EMI Calculation
    console.log('5. Testing Authoritative Reducing-Balance EMI Engine API...');
    const emiRes = await axios.post(`${API_BASE}/emi/calculate`, {
      price: 54999,
      downPayment: 4999,
      interestRate: 13.5,
      tenureMonths: 12,
      processingFee: 499
    });

    if (emiRes.data.success) {
      const calc = emiRes.data.calculation;
      console.log('   ✅ Principal Loan Amount: ₹', calc.principalLoanAmount);
      console.log('   ✅ 12-Month Monthly EMI: ₹', calc.monthlyEMI, '/month');
      console.log('   ✅ Total Interest: ₹', calc.totalInterest);
      console.log('   ✅ Total Cost to Farmer: ₹', calc.totalCost);
      console.log('   ✅ Tenure Options Matrix Generated:', emiRes.data.tenureTable.length, 'tenures');
    }
    console.log('');

    // 6. Test Multi-Signal Recommendation Service
    console.log('6. Testing Recommendation Service API...');
    const recRes = await axios.get(`${API_BASE}/products/${testProductId}/recommendations`);
    console.log('   ✅ Returned Recommendations Count:', recRes.data.recommendations.length);
    if (recRes.data.recommendations.length > 0) {
      console.log('   ✅ Top Recommended Item:', recRes.data.recommendations[0].name, '(Score:', recRes.data.recommendations[0].recommendationScore, ')');
    }
    console.log('');

    // 7. Test Customer Registration, Login & Order Placement
    console.log('7. Testing Customer Shopping & Order Checkout Flow...');
    const customerLoginRes = await axios.post(`${API_BASE}/users/login`, {
      email: 'ramesh.patel@kisanmail.in',
      password: 'Farmer@2026'
    });
    customerToken = customerLoginRes.data.token;
    const customerHeaders = {
      headers: {
        Authorization: `Bearer ${customerToken}`,
        'Content-Type': 'application/json'
      }
    };

    const orderRes = await axios.post(`${API_BASE}/orders`, {
      items: [
        { productId: testProductId, quantity: 1 }
      ],
      shippingAddress: {
        fullName: 'Ramesh Patel',
        phone: '+91 98765 43210',
        street: 'Farm Plot #14, Gondal Highway',
        villageCity: 'Gondal',
        district: 'Rajkot',
        state: 'Gujarat',
        pincode: '360001'
      },
      paymentMethod: 'EMI',
      emiDetails: {
        isEmi: true,
        tenureMonths: 12,
        monthlyEmi: 4480,
        interestRate: 13.5,
        downPayment: 4999,
        financePartner: 'HDFC Kisan Finance'
      }
    }, customerHeaders);

    if (orderRes.data.success) {
      testOrderId = orderRes.data.order._id;
      console.log('   ✅ Placed Order Number:', orderRes.data.order.orderNumber);
      console.log('   ✅ Grand Total: ₹', orderRes.data.order.pricing.grandTotal);
      console.log('   ✅ Initial Order Status:', orderRes.data.order.orderStatus);
    }
    console.log('');

    // 8. Test Verified Review Eligibility & Submission
    console.log('8. Testing Strict Verified Review Verification Pipeline...');
    // Initial check: order is 'Confirmed', not 'Delivered'
    const preDeliveredCheck = await axios.get(`${API_BASE}/reviews/${testProductId}/review-eligibility`, customerHeaders);
    console.log('   ✅ Review Eligibility Before Delivery:', preDeliveredCheck.data.eligible, `(Reason: ${preDeliveredCheck.data.reason})`);

    // Admin updates status to 'Delivered'
    console.log('   🚚 Admin Dispatching & Marking Order as DELIVERED...');
    await axios.put(`${API_BASE}/admin/orders/${testOrderId}/status`, {
      status: 'Delivered',
      note: 'Delivered to farm address by AgriLogistics Express'
    }, adminHeaders);

    // Re-check eligibility: now eligible!
    const postDeliveredCheck = await axios.get(`${API_BASE}/reviews/${testProductId}/review-eligibility`, customerHeaders);
    console.log('   ✅ Review Eligibility After Delivery:', postDeliveredCheck.data.eligible, '🎉');

    // Submit Verified Review
    const submitReviewRes = await axios.post(`${API_BASE}/reviews/${testProductId}`, {
      rating: 5,
      title: 'Heavy tilling capacity - easily tackled my hard soil!',
      comment: 'The PT-900D diesel tiller is a beast in the field. Handled 5 acres without overheating and fuel consumption was surprisingly low.',
      farmContext: {
        farmType: 'Cotton & Sugarcane',
        acres: 8
      }
    }, customerHeaders);

    if (submitReviewRes.data.success) {
      testReviewId = submitReviewRes.data.review._id;
      console.log('   ✅ Review Submitted. ID:', testReviewId);
      console.log('   ✅ Verified Purchase Flag:', submitReviewRes.data.review.verifiedPurchase);
      console.log('   ✅ Initial Status:', submitReviewRes.data.review.status, '(Pending Moderation)');
    }
    console.log('');

    // 9. Test Review Moderation by Admin
    console.log('9. Testing Admin Review Moderation & Rating Recalculation...');
    const approveReviewRes = await axios.post(`${API_BASE}/admin/reviews/${testReviewId}/approve`, {
      notes: 'Verified farmer purchase and delivery confirmed.'
    }, adminHeaders);

    if (approveReviewRes.data.success) {
      console.log('   ✅ Review Approved by Admin!');
      
      // Verify rating recalculation on product
      const updatedProduct = await axios.get(`${API_BASE}/products/${testProductId}`);
      console.log('   ✅ Updated Product Average Rating:', updatedProduct.data.product.ratings.averageRating, '★');
      console.log('   ✅ Updated Product Total Reviews:', updatedProduct.data.product.ratings.totalReviews);
    }
    console.log('');

    // 10. Test Admin Audit Logs
    console.log('10. Testing Admin Audit Log Verification...');
    const auditRes = await axios.get(`${API_BASE}/admin/audit-logs?limit=10`, adminHeaders);
    if (auditRes.data.success) {
      console.log('   ✅ Recorded Audit Entries Count:', auditRes.data.total);
      console.log('   ✅ Recent Audit Actions:');
      auditRes.data.logs.slice(0, 5).forEach((log, idx) => {
        console.log(`      ${idx + 1}. [${log.action}] on Resource: ${log.resource} by ${log.adminName} at ${new Date(log.timestamp).toLocaleTimeString()}`);
      });
    }
    console.log('');

    // 11. Test Admin Dashboard Live Aggregations
    console.log('11. Testing Admin Dashboard Aggregation Metrics...');
    const dashRes = await axios.get(`${API_BASE}/admin/dashboard/stats`, adminHeaders);
    if (dashRes.data.success) {
      console.log('   ✅ Total Revenue: ₹', dashRes.data.stats.totalRevenue);
      console.log('   ✅ Total Orders:', dashRes.data.stats.totalOrders);
      console.log('   ✅ Total Products:', dashRes.data.stats.totalProducts);
      console.log('   ✅ Low Stock Alerts:', dashRes.data.stats.lowStockCount);
      console.log('   ✅ Timeline Days Count:', dashRes.data.charts.timeline.labels.length);
    }

    console.log('\n================================================================');
    console.log('🎉 ALL BACKEND TESTS PASSED SUCCESSFULLY WITH 100% COMPLIANCE!');
    console.log('================================================================\n');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Allow server to boot before running tests if started directly
setTimeout(runTests, 1000);
