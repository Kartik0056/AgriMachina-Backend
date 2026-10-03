const axios = require('axios');
const Product = require('../models/Product');
const Category = require('../models/Category');
const env = require('../config/env');

// Out-of-scope trigger patterns for strict guardrail protection
const OUT_OF_SCOPE_REGEX = /\b(politics|election|modi|biden|putin|president|minister|sports|cricket|football|ipl|world cup|coding|code|python|javascript|java|c\+\+|html|css|crypto|bitcoin|stock market|nifty|sensex|astrology|horoscope|girlfriend|boyfriend|love|dating|joke|jokes|song|songs|shayari|fibonacci|algorithm|programming)\b/i;

// Complaint, technical issue & grievance triggers
const COMPLAINT_REGEX = /\b(complain|complaint|shikayat|problem|dikkat|issue|kharab|start nahi|chalu nahi|chal nahi|kaam nahi|not working|not start|leak|leakage|sound|awaaz|smoke|defect|damaged|broken|toot|galat|paisa kat|amount deducted|delay|late|pahuncha nahi|refund|return|ticket|call support|engineer|technician|helpline|service center|troubleshoot)\b/i;

// Broad multi-category shopping terms
const STORE_KEYWORDS = [
  // Spices & Groceries
  'spice', 'spices', 'masala', 'masale', 'haldi', 'turmeric', 'mirch', 'chilli', 'dhaniya',
  'coriander', 'jeera', 'cumin', 'cardamom', 'elaichi', 'laung', 'cloves', 'saffron', 'kesar',
  'dal', 'pulses', 'oil', 'oils', 'ghee', 'honey', 'biryani', 'garam masala', 'organic',
  // Electronics & Gadgets
  'electronic', 'electronics', 'gadget', 'gadgets', 'earbud', 'earbuds', 'headphone', 'headphones',
  'audio', 'bluetooth', 'speaker', 'watch', 'smartwatch', 'charger', 'cable', 'led', 'light', 'strip',
  'tech', 'motor', 'motors', 'pump', 'pumps', 'starter', 'inverter',
  // Home Decor & Living
  'decor', 'decoration', 'lamp', 'lamps', 'lighting', 'vase', 'vases', 'pottery', 'clock', 'clocks',
  'wall', 'candle', 'candles', 'living', 'handicraft', 'aesthetic', 'scented',
  // Kitchen & Home Appliances
  'kitchen', 'appliance', 'appliances', 'mixer', 'grinder', 'blender', 'kettle', 'fryer', 'air fryer',
  'cookware', 'induction', 'pan', 'pot', 'stove',
  // Hardware & Power Tools
  'tool', 'tools', 'drill', 'drills', 'wrench', 'hardware', 'washer', 'pressure washer', 'kit', 'bits',
  'weeder', 'tiller', 'cutter', 'sprayer', 'rotavator',
  // General E-commerce & Shopping
  'price', 'rate', 'cost', 'daam', 'keemat', 'discount', 'discounts', 'offer', 'offers', 'coupon',
  'coupons', 'mrp', 'khareed', 'khareedna', 'buy', 'purchase', 'emi', 'loan', 'kist', 'installment',
  'installments', 'finance', 'delivery', 'shipping', 'track', 'tracking', 'order', 'orders',
  'return', 'refund', 'warranty', 'guarantee', 'service', 'quality', 'purity', 'brand', 'contact',
  'phone', 'helpline', 'customer', 'care', 'payment', 'razorpay', 'cash', 'cod', 'catalog', 'product',
  'products', 'store', 'stock', 'available', 'spec', 'specs'
];

const STORE_REGEX = new RegExp(`\\b(${STORE_KEYWORDS.join('|')})\\b`, 'i');

function isStoreRelated(query) {
  const q = (query || '').toLowerCase().trim();
  if (q.length < 2) return true;

  // Immediate block if matched out-of-scope topic
  if (OUT_OF_SCOPE_REGEX.test(q)) {
    return false;
  }

  // Friendly greetings
  const greetings = ['hi', 'hello', 'namaste', 'kem cho', 'sat sri akaal', 'vanakkam', 'radhe', 'ram ram', 'pranam', 'help', 'eidula', 'siddhiva', 'shopping'];
  if (greetings.some(g => q === g || q.startsWith(g + ' '))) return true;

  return STORE_REGEX.test(q) || COMPLAINT_REGEX.test(q);
}

const isStoreOrAgricultureRelated = isStoreRelated; // Alias for backward compatibility

function isComplaintQuery(query) {
  return COMPLAINT_REGEX.test(query || '');
}

/**
 * Searches the live MongoDB catalog for products
 */
async function searchStoreCatalog(query) {
  try {
    const cleanTokens = (query || '')
      .replace(/[^\w\s]/gi, ' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2);

    if (cleanTokens.length === 0) {
      const recents = await Product.find({ status: 'Published' })
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(4)
        .select('name title slug brand category sellingPrice price compareAtPrice mrp mainImage stockQuantity specifications emi');
      return recents.map(formatProductForAI);
    }

    const regexArray = cleanTokens.map(tok => new RegExp(tok, 'i'));

    let products = await Product.find({
      status: 'Published',
      $or: [
        { name: { $in: regexArray } },
        { title: { $in: regexArray } },
        { brand: { $in: regexArray } },
        { category: { $in: regexArray } },
        { subcategory: { $in: regexArray } },
        { shortDescription: { $in: regexArray } }
      ]
    })
      .sort({ stockQuantity: -1 })
      .limit(4)
      .select('name title slug brand category sellingPrice price compareAtPrice mrp mainImage stockQuantity specifications emi');

    if (!products || products.length === 0) {
      products = await Product.find({ status: 'Published' })
        .sort({ isFeatured: -1, rating: -1 })
        .limit(3)
        .select('name title slug brand category sellingPrice price compareAtPrice mrp mainImage stockQuantity specifications emi');
    }

    return products.map(formatProductForAI);
  } catch (err) {
    console.error('Database catalog search error:', err.message);
    return [];
  }
}

function formatProductForAI(p) {
  const title = p.name || p.title || 'Eidula Product';
  const price = p.sellingPrice || p.price || 0;
  const mrp = p.compareAtPrice || p.mrp || Math.round(price * 1.25);
  const specs = (p.specifications || []).slice(0, 5).map(s => `${s.name}: ${s.value}${s.unit ? ' ' + s.unit : ''}`).join(', ');
  const image = p.mainImage?.url || '';
  const emiPerMonth = p.emi?.enabled && p.emi?.minMonthlyEmi ? p.emi.minMonthlyEmi : Math.round(price / 6);

  return {
    id: p._id,
    title,
    slug: p.slug,
    brand: p.brand || 'Eidula Assured',
    category: p.category,
    price,
    compareAtPrice: mrp,
    inStock: (p.stockQuantity || 0) > 0,
    stockCount: p.stockQuantity || 0,
    specsSummary: specs || 'Genuine Brand Certified Quality',
    monthlyEmi: emiPerMonth,
    image
  };
}

/**
 * Returns summary string of live store catalog
 */
async function getLiveCatalogManifest() {
  try {
    const prods = await Product.find({ status: 'Published' })
      .select('name title brand category sellingPrice price stockQuantity specifications')
      .limit(20);

    if (!prods || prods.length === 0) {
      return `Our store carries verified products across: Pure Spices & Masale, Electronics & Gadgets, Home Decor & Living, Kitchen & Home Appliances, and Hardware Tools.`;
    }

    return prods.map((p, idx) => {
      const name = p.name || p.title;
      const price = p.sellingPrice || p.price;
      const stock = p.stockQuantity > 0 ? `${p.stockQuantity} in stock` : 'Out of stock';
      return `${idx + 1}. [${p.category || 'General'}] "${name}" by ${p.brand || 'Eidula'} - ₹${price} (${stock})`;
    }).join('\n');
  } catch {
    return 'Catalog available on Eidula Online Store.';
  }
}

/**
 * Calls Google Gemini REST endpoint with live store context
 */
async function callGeminiAssistant(query, lang = 'hi', matchingProducts = []) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const liveCatalogManifest = await getLiveCatalogManifest();

  const systemInstruction = `You are "Eidula AI Assistant", the official, friendly, knowledgeable shopping and customer support expert for Eidula (India's premier e-commerce destination offering pure spices & masale, smart electronics, luxury home decor, kitchen appliances, hardware & tools, and everyday lifestyle essentials).

ACTUAL LIVE STORE INVENTORY CATALOG:
${liveCatalogManifest}

CUSTOMER ASSISTANCE & INVENTORY RULES:
1. INVENTORY VERIFICATION:
   - Check the LIVE STORE INVENTORY list above for products matching the user's inquiry.
2. IF PRODUCT IS IN INVENTORY:
   - Provide its exact price (₹), key specifications, quality certifications, 0% No-Cost EMI options, and official brand warranty.
3. IF REQUESTED PRODUCT / SPECIFICATION IS CURRENTLY OUT OF STOCK:
   - Honestly inform the user that the specific model/item is currently out of stock or being replenished.
   - Thoughtfully recommend the closest available alternative from our live catalog that fulfills their requirement.
4. ORDER TRACKING & SUPPORT:
   - Direct users to /orders for order invoices & live courier tracking.
   - For complaints, defective items, or order inquiries, guide them to /support to raise a ticket or connect on WhatsApp (+91 63952 11953).
5. FINANCING:
   - 0% No-Cost EMI is available for 3 to 24 months via leading credit & debit cards (SBI, HDFC, ICICI, Axis, Bajaj Finserv).
6. STRICT GUARDRAILS:
   - ONLY answer questions about products on Eidula, shopping, orders, delivery, EMI, warranties, and customer care.
   - Politely decline off-topic queries (politics, coding, sports, movies, etc.) in the requested language (${lang}).
   - TONE: Warm, energetic, polite, and helpful. Use clean markdown formatting with **bold headings**, bullet points (•), and numbered steps.`;

  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nUser Question (respond in ${lang}): ${query}` }]
          }
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 500
        }
      };

      const res = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      const cand = res.data?.candidates?.[0];
      const text = cand?.content?.parts?.[0]?.text;
      if (text && text.trim().length > 10) {
        return text.trim();
      }
    } catch {
      // Try next model
    }
  }

  return null;
}

/**
 * Main Controller Handler for AI Shopping Assistant
 */
async function processFarmerQuery(userInput, lang = 'hi') {
  const query = userInput ? userInput.trim() : '';

  // 1. STRICT GUARDRAIL CHECK: Block irrelevant / out-of-scope non-store questions immediately
  if (!isStoreRelated(query)) {
    if (lang === 'hi') {
      return {
        text: `🙏 **नमस्ते! Eidula शॉपिंग असिस्टेंट में आपका स्वागत है।**\n\nमैं सिर्फ **हमारे स्टोर के उत्पादों (शुद्ध मसाले, इलेक्ट्रॉनिक्स, होम डेकोर, किचन उपकरण, टूल्स), 0% ईएमआई, वारंटी, ऑर्डर ट्रैकिंग और सहायता** के सवालों में मदद कर सकता हूँ।\n\nकृपया हमारे स्टोर उत्पादों या शॉपिंग से जुड़ा कोई सवाल पूछें! ✨`,
        actionLink: { label: 'Explore All Categories', url: '/products' },
        products: [],
        supportActions: []
      };
    } else if (lang === 'gu') {
      return {
        text: `🙏 **નમસ્તે! Eidula શોપિંગ AI સહાયકમાં આપનું સ્વાગત છે.**\n\nહું ફક્ત **અમારા સ્ટોરના ઉત્પાદનો (શુદ્ધ મસાલા, ઇલેક્ટ્રોનિક્સ, હોમ ડેકોર, કિચનવેર, ટૂલ્સ), 0% EMI અને ઓર્ડર ટ્રેકિંગ** બાબતે જ મદદ કરી શકું છું.`,
        actionLink: { label: 'બધા ઉત્પાદનો જુઓ', url: '/products' },
        products: [],
        supportActions: []
      };
    } else {
      return {
        text: `🙏 **Hello & Welcome to Eidula!**\n\nI am your 24x7 **Eidula Smart AI Shopping Assistant**. I am dedicated to assisting you with **our products (Pure Spices, Electronics, Home Decor, Kitchen Appliances, Tools), 0% No-Cost EMI, order tracking, warranties, and customer support**.\n\nPlease feel free to ask anything about our catalog or orders! ✨`,
        actionLink: { label: 'Explore All Categories', url: '/products' },
        products: [],
        supportActions: []
      };
    }
  }

  // 2. Detect Complaint Intent
  const hasComplaint = isComplaintQuery(query);
  const supportActions = hasComplaint ? [
    { type: 'ticket', label: '🎫 Raise Support Ticket', url: '/support' },
    { type: 'call', label: '📞 Call Helpline (+91 63952 11953)', phone: '+91 63952 11953' },
    { type: 'whatsapp', label: '💬 WhatsApp Support', url: 'https://wa.me/916395211953?text=Hello%20Eidula%20Support' }
  ] : [];

  // 3. Query Live Database Catalog for matching products
  const matchingProducts = await searchStoreCatalog(query);

  // 4. Attempt Gemini Generation with Live Inventory RAG
  try {
    const geminiText = await callGeminiAssistant(query, lang, matchingProducts);
    if (geminiText) {
      const topProduct = matchingProducts[0];
      return {
        text: geminiText,
        actionLink: topProduct
          ? { label: `View ${topProduct.title.slice(0, 26)}...`, url: `/products/${topProduct.slug}` }
          : (hasComplaint ? { label: 'Go to Support Desk', url: '/support' } : { label: 'Explore All Categories', url: '/products' }),
        products: matchingProducts,
        supportActions
      };
    }
  } catch (geminiErr) {
    console.error('Gemini processing error:', geminiErr.message);
  }

  // 5. Fallback Response
  if (hasComplaint) {
    return {
      text: `🛠️ **Eidula Customer Support & Resolution:**\n\nAapki suvidha ke liye hamari customer support team 24x7 uplabdh hai:\n\n1. **Raise Support Ticket:** Aap turant neeche diye gaye button se support ticket raise kar sakte hain.\n2. **WhatsApp Support:** +91 63952 11953 par direct WhatsApp message karein.\n3. **Quick Return / Replacement:** Agar parcel damaged ya defective hai, to 7 dino ke andar hassle-free replacement uplabdh hai.`,
      actionLink: { label: 'Open Support Desk', url: '/support' },
      products: [],
      supportActions
    };
  }

  const topAlternative = matchingProducts[0];
  if (topAlternative) {
    return {
      text: `🙏 **Namaste & Welcome to Eidula!**\n\nHamare store me aapki pasand ke anusaar **${topAlternative.title}** uplabdh hai!\n\n• **Price:** ₹${topAlternative.price.toLocaleString('en-IN')} (MRP: ₹${topAlternative.compareAtPrice.toLocaleString('en-IN')})\n• **0% No-Cost EMI:** Available from ₹${topAlternative.monthlyEmi}/month\n• **Quality:** 100% Genuine Brand Certified with Official Warranty\n• **Delivery:** Fast Express Pan-India Doorstep Delivery\n\nKya aap is product ke baare me aur janna chahte hain?`,
      actionLink: { label: `View ${topAlternative.title.slice(0, 24)}...`, url: `/products/${topAlternative.slug}` },
      products: matchingProducts.slice(0, 2),
      supportActions: []
    };
  }

  return {
    text: `Namaste & Welcome to Eidula! 🙏 Main aapka 24x7 **Smart Shopping AI Assistant** hoon.\n\nAap mujhse hamare catalog me uplabdh **Pure Spices & Masale, Smart Electronics, Home Decor, Kitchen Appliances, Power Tools, 0% No-Cost EMI, order tracking, ya warranties** ke baare me pooch sakte hain.\n\nKahiye, main aapki kya seva karoon?`,
    actionLink: { label: 'Explore All Categories', url: '/products' },
    products: matchingProducts.slice(0, 2),
    supportActions: []
  };
}

module.exports = {
  isStoreRelated,
  isStoreOrAgricultureRelated,
  searchStoreCatalog,
  callGeminiAssistant,
  processFarmerQuery
};
