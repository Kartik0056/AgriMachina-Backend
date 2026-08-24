const Razorpay = require('razorpay');
const crypto = require('crypto');
const env = require('../config/env');
const { calculateEMI } = require('./emiService');

let razorpayInstance = null;
try {
  razorpayInstance = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET
  });
} catch (err) {
  console.error('Failed to initialize Razorpay SDK:', err.message);
}

/**
 * Create a new Razorpay Order
 * @param {number} amountInRupees 
 * @param {string} receipt 
 * @param {object} notes 
 */
async function createRazorpayOrder(amountInRupees, receipt, notes = {}) {
  const amountInPaise = Math.round(Number(amountInRupees) * 100);
  
  if (!razorpayInstance) {
    throw new Error('Razorpay SDK is not initialized.');
  }

  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: receipt || `rcpt_${Date.now()}`,
    notes: {
      platform: 'AgriMachina E-Commerce',
      ...notes
    }
  };

  const order = await razorpayInstance.orders.create(options);
  return {
    ...order,
    keyId: env.RAZORPAY_KEY_ID
  };
}

/**
 * Verify Razorpay payment signature
 * @param {string} orderId 
 * @param {string} paymentId 
 * @param {string} signature 
 */
function verifyPaymentSignature(orderId, paymentId, signature) {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
}

/**
 * Calculate comprehensive Razorpay EMI options & bank breakdown
 * @param {number} principalAmount 
 */
function getComprehensiveEMIPlans(principalAmount = 39999, customDownPayment = 0) {
  const P = Math.max(0, principalAmount - customDownPayment);

  // Helper for reducing-balance EMI
  const getEmi = (months, annualRate) => {
    if (months <= 0 || P <= 0) return { monthlyEMI: 0, totalInterest: 0, totalPayable: 0 };
    if (annualRate === 0) {
      // 0% No Cost EMI
      const monthly = Math.round(P / months);
      return {
        monthlyEMI: monthly,
        totalInterest: 0,
        totalPayable: P,
        discountSubvention: 0
      };
    }
    const r = (annualRate / 12) / 100;
    const factor = Math.pow(1 + r, months);
    const monthly = Math.round(P * r * (factor / (factor - 1)));
    const totalPayable = monthly * months;
    const totalInterest = totalPayable - P;
    return {
      monthlyEMI: monthly,
      totalInterest,
      totalPayable
    };
  };

  // 1. 🔥 NO-COST EMI PLANS (3 & 6 Months)
  const noCostPlans = [
    {
      bank: 'HDFC Bank',
      cardType: 'Credit Card',
      tenureMonths: 3,
      annualRate: 0,
      isNoCost: true,
      badge: '0% Interest No-Cost EMI',
      calculation: getEmi(3, 0),
      instantSavings: Math.round(P * 0.035) // Subsidized discount
    },
    {
      bank: 'HDFC Bank',
      cardType: 'Credit Card',
      tenureMonths: 6,
      annualRate: 0,
      isNoCost: true,
      badge: '0% Interest No-Cost EMI',
      calculation: getEmi(6, 0),
      instantSavings: Math.round(P * 0.065)
    },
    {
      bank: 'ICICI Bank',
      cardType: 'Credit Card',
      tenureMonths: 3,
      annualRate: 0,
      isNoCost: true,
      badge: '0% Interest No-Cost EMI',
      calculation: getEmi(3, 0),
      instantSavings: Math.round(P * 0.035)
    },
    {
      bank: 'ICICI Bank',
      cardType: 'Credit Card',
      tenureMonths: 6,
      annualRate: 0,
      isNoCost: true,
      badge: '0% Interest No-Cost EMI',
      calculation: getEmi(6, 0),
      instantSavings: Math.round(P * 0.065)
    },
    {
      bank: 'SBI Card',
      cardType: 'Credit Card',
      tenureMonths: 6,
      annualRate: 0,
      isNoCost: true,
      badge: '0% Interest No-Cost EMI',
      calculation: getEmi(6, 0),
      instantSavings: Math.round(P * 0.065)
    },
    {
      bank: 'Bajaj Finserv',
      cardType: 'EMI Network Card',
      tenureMonths: 6,
      annualRate: 0,
      isNoCost: true,
      badge: 'Zero Down / 0% Interest',
      calculation: getEmi(6, 0),
      instantSavings: Math.round(P * 0.05)
    }
  ];

  // 2. CREDIT CARD EMI (All major banks)
  const creditCardBanks = [
    { bank: 'State Bank of India (SBI)', code: 'SBIN', rates: { 3: 13.0, 6: 13.0, 9: 13.5, 12: 13.5, 18: 14.0, 24: 14.0, 36: 14.5 } },
    { bank: 'HDFC Bank', code: 'HDFC', rates: { 3: 13.5, 6: 13.5, 9: 14.0, 12: 14.0, 18: 14.5, 24: 15.0 } },
    { bank: 'ICICI Bank', code: 'ICIC', rates: { 3: 13.5, 6: 14.0, 9: 14.0, 12: 14.0, 18: 14.5, 24: 15.0 } },
    { bank: 'Axis Bank', code: 'UTIB', rates: { 3: 13.5, 6: 14.0, 9: 14.0, 12: 14.5, 18: 15.0, 24: 15.0 } },
    { bank: 'Kotak Mahindra Bank', code: 'KKBK', rates: { 3: 14.0, 6: 14.0, 9: 14.5, 12: 14.5, 18: 15.0, 24: 15.0 } },
    { bank: 'Bank of Baroda', code: 'BARB', rates: { 3: 13.0, 6: 13.5, 9: 13.5, 12: 14.0, 18: 14.0, 24: 14.5 } },
    { bank: 'IndusInd Bank', code: 'INDB', rates: { 3: 13.5, 6: 14.0, 9: 14.0, 12: 14.5, 18: 15.0, 24: 15.0 } }
  ];

  const creditCardPlans = [];
  creditCardBanks.forEach(b => {
    Object.entries(b.rates).forEach(([tenure, rate]) => {
      const t = Number(tenure);
      creditCardPlans.push({
        bank: b.bank,
        bankCode: b.code,
        cardType: 'Credit Card',
        tenureMonths: t,
        annualRate: rate,
        isNoCost: false,
        calculation: getEmi(t, rate)
      });
    });
  });

  // 3. DEBIT CARD EMI
  const debitCardBanks = [
    { bank: 'HDFC Bank Debit Card', code: 'HDFC_DC', tenures: [3, 6, 9, 12], rate: 14.0 },
    { bank: 'ICICI Bank Debit Card', code: 'ICIC_DC', tenures: [3, 6, 9, 12], rate: 14.0 },
    { bank: 'Axis Bank Debit Card', code: 'UTIB_DC', tenures: [3, 6, 9, 12], rate: 14.5 },
    { bank: 'SBI Debit Card (Kisan ATM)', code: 'SBIN_DC', tenures: [3, 6, 9, 12, 18], rate: 13.0 }
  ];

  const debitCardPlans = [];
  debitCardBanks.forEach(b => {
    b.tenures.forEach(t => {
      debitCardPlans.push({
        bank: b.bank,
        bankCode: b.code,
        cardType: 'Debit Card',
        tenureMonths: t,
        annualRate: b.rate,
        isNoCost: false,
        calculation: getEmi(t, b.rate)
      });
    });
  });

  // 4. CARDLESS & KISAN NBFC FINANCING
  const cardlessNbfcPlans = [
    {
      partner: 'Bajaj Finserv EMI Network',
      type: 'NBFC / Cardless',
      tenureMonths: 6,
      annualRate: 0,
      isNoCost: true,
      badge: 'Zero Down 0% Interest',
      calculation: getEmi(6, 0)
    },
    {
      partner: 'Bajaj Finserv EMI Network',
      type: 'NBFC / Cardless',
      tenureMonths: 9,
      annualRate: 9.5,
      isNoCost: false,
      calculation: getEmi(9, 9.5)
    },
    {
      partner: 'TVS Credit Kisan Machinery Loan',
      type: 'Kisan Agriculture Loan',
      tenureMonths: 12,
      annualRate: 11.5,
      isNoCost: false,
      badge: 'Subsidized Farm Equipment Rate',
      calculation: getEmi(12, 11.5)
    },
    {
      partner: 'TVS Credit Kisan Machinery Loan',
      type: 'Kisan Agriculture Loan',
      tenureMonths: 24,
      annualRate: 11.5,
      isNoCost: false,
      badge: 'Subsidized Farm Equipment Rate',
      calculation: getEmi(24, 11.5)
    },
    {
      partner: 'TVS Credit Kisan Machinery Loan',
      type: 'Kisan Agriculture Loan',
      tenureMonths: 36,
      annualRate: 11.5,
      isNoCost: false,
      badge: 'Long-Term 36-Month Plan',
      calculation: getEmi(36, 11.5)
    },
    {
      partner: 'HDFC Kisan Gold Card (KGC)',
      type: 'Kisan Agriculture Loan',
      tenureMonths: 12,
      annualRate: 11.0,
      isNoCost: false,
      calculation: getEmi(12, 11.0)
    },
    {
      partner: 'HDFC Kisan Gold Card (KGC)',
      type: 'Kisan Agriculture Loan',
      tenureMonths: 24,
      annualRate: 11.0,
      isNoCost: false,
      calculation: getEmi(24, 11.0)
    },
    {
      partner: 'ZestMoney / DMI Finance',
      type: 'Instant Digital Cardless',
      tenureMonths: 6,
      annualRate: 12.0,
      isNoCost: false,
      calculation: getEmi(6, 12.0)
    }
  ];

  return {
    principalAmount,
    customDownPayment,
    loanAmount: P,
    keyId: env.RAZORPAY_KEY_ID,
    noCostPlans,
    creditCardPlans,
    debitCardPlans,
    cardlessNbfcPlans,
    allBanks: [
      'HDFC Bank',
      'State Bank of India (SBI)',
      'ICICI Bank',
      'Axis Bank',
      'Kotak Mahindra Bank',
      'Bajaj Finserv',
      'TVS Credit Kisan Finance',
      'Bank of Baroda',
      'IndusInd Bank'
    ]
  };
}

module.exports = {
  createRazorpayOrder,
  verifyPaymentSignature,
  getComprehensiveEMIPlans
};
