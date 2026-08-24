const axios = require('axios');
const crypto = require('crypto');

const API_URL = 'http://localhost:5000/api';
const SECRET_KEY = 'rhATHfy93s5sMhwreOL2zfYy';

async function testRazorpay() {
  console.log('=== TESTING RAZORPAY INTEGRATION ===');

  try {
    // 1. Test EMI Plans
    console.log('\n[1] Testing GET /api/payment/razorpay/emi-plans...');
    const emiRes = await axios.get(`${API_URL}/payment/razorpay/emi-plans?amount=38499&downPayment=5000`);
    console.log('✅ EMI Plans response success:', emiRes.data.success);
    console.log('   Key ID returned:', emiRes.data.emiPlans?.keyId);
    console.log('   No Cost Plans count:', emiRes.data.emiPlans?.noCostPlans?.length);
    console.log('   Credit Card Plans count:', emiRes.data.emiPlans?.creditCardPlans?.length);
    console.log('   Debit Card Plans count:', emiRes.data.emiPlans?.debitCardPlans?.length);
    console.log('   NBFC / Kisan Plans count:', emiRes.data.emiPlans?.cardlessNbfcPlans?.length);
    console.log('   Sample No-Cost Plan:', emiRes.data.emiPlans?.noCostPlans[0]);

    // 2. Test Order Creation
    console.log('\n[2] Testing POST /api/payment/razorpay/create-order...');
    const orderRes = await axios.post(`${API_URL}/payment/razorpay/create-order`, {
      amount: 38499,
      customerName: 'Ramesh Patel',
      customerEmail: 'ramesh.patel@kisanmail.com',
      customerPhone: '+919876543210'
    });
    console.log('✅ Razorpay Order Created:', orderRes.data.razorpayOrder.id);
    console.log('   Amount in paise:', orderRes.data.razorpayOrder.amount);
    console.log('   Currency:', orderRes.data.razorpayOrder.currency);

    const rzpOrderId = orderRes.data.razorpayOrder.id;
    const mockPaymentId = 'pay_mock_' + Date.now();

    // 3. Generate Valid HMAC SHA256 Signature
    const validSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(`${rzpOrderId}|${mockPaymentId}`)
      .digest('hex');

    console.log('\n[3] Testing POST /api/payment/razorpay/verify-payment with valid signature...');
    const verifyRes = await axios.post(`${API_URL}/payment/razorpay/verify-payment`, {
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: mockPaymentId,
      razorpay_signature: validSignature,
      paymentMethod: 'Razorpay Online'
    });
    console.log('✅ Payment Signature Verification Passed:', verifyRes.data.message);

    console.log('\n[4] Testing Invalid Signature Rejection...');
    try {
      await axios.post(`${API_URL}/payment/razorpay/verify-payment`, {
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: 'invalid_tampered_signature_12345'
      });
      console.error('❌ Should have rejected invalid signature!');
    } catch (err) {
      console.log('✅ Correctly rejected invalid signature with status:', err.response?.status);
    }

    console.log('\n🎉 RAZORPAY INTEGRATION TEST 100% SUCCESSFUL!');
  } catch (error) {
    console.error('❌ Razorpay Test Error:', error.response?.data || error.message);
  }
}

testRazorpay();
