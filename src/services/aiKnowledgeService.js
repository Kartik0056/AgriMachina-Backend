const axios = require('axios');
const Product = require('../models/Product');
const Category = require('../models/Category');
const env = require('../config/env');

// Non-agricultural / Out-of-scope trigger patterns for strict guardrail protection
const OUT_OF_SCOPE_REGEX = /\b(cricket|bollywood|movie|movies|film|actor|actress|politics|election|modi|biden|putin|president|minister|sports|football|coding|code|python|javascript|java|c\+\+|html|css|crypto|bitcoin|stock market|nifty|sensex|astrology|horoscope|girlfriend|boyfriend|love|dating|joke|jokes|song|songs|shayari|recipe|pizza|burger|ipl|world cup|game|gaming|fibonacci|algorithm|programming)\b/i;

// Complaint, technical issue & grievance triggers
const COMPLAINT_REGEX = /\b(complain|complaint|shikayat|problem|dikkat|issue|kharab|start nahi|chalu nahi|chal nahi|kaam nahi|not working|not start|oil leak|leakage|vibrat|sound|awaaz|smoke|dhuan|defect|damaged|broken|toot|galat|paisa kat|amount deducted|delay|late|pahuncha nahi|refund|return|ticket|call support|engineer|technician|helpline|service center|troubleshoot)\b/i;

// Broad agricultural intent terms
const AGRICULTURAL_WORDS = [
  'weeder', 'weeders', 'tiller', 'tillers', 'cutter', 'cutters', 'brush', 'pump', 'pumps', 'solar',
  'auger', 'augers', 'sprayer', 'sprayers', 'tractor', 'tractors', 'rotavator', 'mower', 'mowers',
  'lawn', 'harvester', 'harvesters', 'blade', 'blades', 'engine', 'engines', 'motor', 'motors',
  'petrol', 'diesel', 'hp', 'cc', 'rpm', 'gear', 'gears', 'price', 'rate', 'cost', 'daam', 'keemat',
  'discount', 'discounts', 'offer', 'offers', 'coupon', 'coupons', 'mrp', 'khareed', 'khareedna',
  'buy', 'purchase', 'emi', 'loan', 'kist', 'installment', 'installments', 'finance', 'subsidy',
  'subsidies', 'smam', 'dbt', 'sarkari', 'anudan', 'delivery', 'shipping', 'track', 'tracking',
  'order', 'orders', 'return', 'refund', 'warranty', 'guarantee', 'service', 'spare', 'spares',
  'part', 'parts', 'attachment', 'attachments', 'paddy', 'wheat', 'cotton', 'sugarcane', 'khet',
  'kheto', 'kisan', 'soil', 'gehu', 'dhaan', 'makka', 'kheti', 'mitti', 'contact', 'phone',
  'helpline', 'customer', 'care', 'payment', 'razorpay', 'cash', 'complain', 'complaint',
  'shikayat', 'kharab', 'problem', 'dikkat', 'issue', 'start', 'chalu', 'leak', 'vibrate', 'damage',
  'chaff', 'kutti', 'thresher', 'trolley', 'seed', 'drill', 'drone', 'milking', 'plough', 'reaper',
  'cultivator', 'harrow', 'planter', 'transplanter', 'generator', 'chainsaw', 'fogger'
];

const AGRI_REGEX = new RegExp(`\\b(${AGRICULTURAL_WORDS.join('|')})\\b`, 'i');

function isStoreOrAgricultureRelated(query) {
  const q = (query || '').toLowerCase().trim();
  if (q.length < 2) return true;

  // Immediate block if matched out-of-scope topic
  if (OUT_OF_SCOPE_REGEX.test(q)) {
    return false;
  }

  // Friendly greetings or common agricultural prompts
  const greetings = ['hi', 'hello', 'namaste', 'kem cho', 'sat sri akaal', 'vanakkam', 'radhe', 'ram ram', 'pranam', 'help', 'kisan', 'agri'];
  if (greetings.some(g => q === g || q.startsWith(g + ' '))) return true;

  return AGRI_REGEX.test(q) || COMPLAINT_REGEX.test(q);
}

function isComplaintQuery(query) {
  return COMPLAINT_REGEX.test(query || '');
}

function cleanProduct(p) {
  if (!p) return null;
  const title = p.name || p.title || 'Agricultural Machinery';
  const price = p.effectivePrice || p.sellingPrice || p.price || 0;
  const compareAtPrice = p.mrp || p.compareAtPrice || 0;
  const discountPercent = p.discountPercent || (compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0);
  const stock = p.stockQuantity ?? p.stock ?? 10;
  const image = p.mainImage?.url || p.gallery?.[0]?.url || (typeof p.images?.[0] === 'string' ? p.images[0] : p.images?.[0]?.url) || '';

  return {
    _id: p._id,
    title,
    slug: p.slug,
    sku: p.sku || '',
    price,
    compareAtPrice,
    discountPercent,
    stock,
    category: p.category || '',
    image,
    ratingAverage: p.ratings?.averageRating || 4.8,
    specifications: p.specifications || [],
    features: p.features || [],
    idealFor: p.idealFor || [],
    warranty: p.warranty?.period || '1 Year Comprehensive Warranty'
  };
}

/**
 * Universal Semantic & Keyword Catalog Search
 * Finds exact product matches OR intelligent category-level alternatives for any agricultural query
 */
async function searchStoreCatalog(query) {
  try {
    const q = (query || '').toLowerCase().trim();

    // 1. Direct Regex Search on name, category, SKU, idealFor, specifications
    const words = q.split(/\s+/).filter(w => w.length > 2 && !['chahiye', 'need', 'want', 'kya', 'hai', 'price', 'rate', 'give', 'batao'].includes(w));
    const regexTerms = words.map(w => new RegExp(w, 'i'));

    let directProducts = [];
    if (regexTerms.length > 0) {
      directProducts = await Product.find({
        isPublished: true,
        $or: [
          { name: { $in: regexTerms } },
          { category: { $in: regexTerms } },
          { sku: { $in: regexTerms } },
          { idealFor: { $in: regexTerms } },
          { 'specifications.value': { $in: regexTerms } },
          { 'applications.name': { $in: regexTerms } }
        ]
      }).limit(4).lean();
    }

    if (directProducts && directProducts.length > 0) {
      return directProducts.map(cleanProduct).filter(Boolean);
    }

    // 2. Semantic Fallback: Map unavailable products to the closest related store machinery
    let altProducts = [];

    // Fodder / Grass / Crop Cutting / Harvesting / Chaff Cutter -> Recommend 50cc Brush Cutter & Rotavator
    if (q.includes('chaff') || q.includes('kutti') || q.includes('cutter') || q.includes('harvest') || q.includes('reaper') || q.includes('crop') || q.includes('fodder') || q.includes('grass') || q.includes('gehu') || q.includes('paddy')) {
      altProducts = await Product.find({
        isPublished: true,
        $or: [{ category: /Harvesting|Cutter/i }, { name: /Brush Cutter/i }]
      }).limit(2).lean();
    }
    // Water / Pumping / Irrigation -> Recommend 5HP Solar Pump
    else if (q.includes('pump') || q.includes('solar') || q.includes('pani') || q.includes('water') || q.includes('irrigation') || q.includes('tubewell') || q.includes('borewell')) {
      altProducts = await Product.find({
        isPublished: true,
        $or: [{ category: /Pump|Irrigation/i }, { name: /Pump/i }]
      }).limit(2).lean();
    }
    // Tillage / Weeding / Cultivator / Inter-cultivation -> Recommend 7HP Weeder & 9HP Tiller
    else if (q.includes('weeder') || q.includes('tiller') || q.includes('cultivat') || q.includes('plough') || q.includes('harrow') || q.includes('mitti') || q.includes('kheti') || q.includes('ganna') || q.includes('cotton')) {
      altProducts = await Product.find({
        isPublished: true,
        $or: [{ category: /Weeder|Tiller/i }, { name: /Weeder|Tiller/i }]
      }).limit(3).lean();
    }
    // Tractor Implements / Trolley / Seed Drill -> Recommend 6ft Rotavator
    else if (q.includes('tractor') || q.includes('trolley') || q.includes('seed') || q.includes('drill') || q.includes('rotavator')) {
      altProducts = await Product.find({
        isPublished: true,
        $or: [{ category: /Rotavator|Accessories|Attachment/i }, { name: /Rotavator/i }]
      }).limit(2).lean();
    }
    // Spraying / Pesticides / Drone -> Recommend 16L 2-in-1 Sprayer
    else if (q.includes('spray') || q.includes('dawa') || q.includes('drone') || q.includes('pest') || q.includes('chemical')) {
      altProducts = await Product.find({
        isPublished: true,
        $or: [{ category: /Sprayer/i }, { name: /Sprayer/i }]
      }).limit(2).lean();
    }
    // Digging / Fencing / Post Hole -> Recommend 63cc Earth Auger
    else if (q.includes('auger') || q.includes('gaddha') || q.includes('hole') || q.includes('post') || q.includes('fence') || q.includes('drill')) {
      altProducts = await Product.find({
        isPublished: true,
        $or: [{ category: /Auger/i }, { name: /Auger/i }]
      }).limit(2).lean();
    }
    // Lawn / Grass Trimmer -> Recommend Lawn Mower
    else if (q.includes('lawn') || q.includes('mower') || q.includes('garden')) {
      altProducts = await Product.find({
        isPublished: true,
        $or: [{ category: /Mower|Garden/i }, { name: /Lawn Mower/i }]
      }).limit(2).lean();
    }

    if (altProducts && altProducts.length > 0) {
      return altProducts.map(cleanProduct).filter(Boolean);
    }

    // Default top catalog items
    const defaultProds = await Product.find({ isPublished: true }).limit(2).lean();
    return defaultProds.map(cleanProduct).filter(Boolean);

  } catch (err) {
    console.error('Catalog search error in AI knowledge service:', err);
    return [];
  }
}

/**
 * Loads dynamic live product manifest from database for Gemini context
 */
async function getLiveCatalogManifest() {
  try {
    const products = await Product.find({ isPublished: true }).lean();
    if (!products || products.length === 0) return 'No products currently in database.';

    return products.map((p, idx) => {
      const specs = (p.specifications || []).slice(0, 5).map(s => `${s.name}: ${s.value} ${s.unit || ''}`.trim()).join(', ');
      return `${idx + 1}. [Category: ${p.category}] "${p.name}" (SKU: ${p.sku}) | Price: ₹${(p.sellingPrice || 0).toLocaleString('en-IN')} (MRP: ₹${(p.mrp || 0).toLocaleString('en-IN')}) | Stock: ${p.stockQuantity} units available | Specs: [${specs}] | Slug: ${p.slug}`;
    }).join('\n');
  } catch (e) {
    return 'Catalog manifest load error.';
  }
}

/**
 * Calls Google Gemini (Gemini 3.6 Flash / Gemini 2.5 Flash) with full Agricultural RAG Context & Strict Guardrails
 */
async function callGeminiAssistant(userQuery, lang = 'hi', matchingProducts = []) {
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  if (!apiKey) return null;

  const liveCatalogManifest = await getLiveCatalogManifest();

  const systemInstruction = `You are "Kisan AI Specialist", the official, highly experienced, empathetic agricultural and farm machinery expert for AgriMachina (India's leading agricultural ecommerce platform).

ACTUAL LIVE STORE INVENTORY CATALOG (CURRENTLY PUBLISHED IN DATABASE):
${liveCatalogManifest}

UNIVERSAL INVENTORY & STOCK NEGOTIATION RULES (LIKE A REAL TRUSTED HUMAN AGRICULTURAL DEALER):
1. INVENTORY VERIFICATION:
   - Carefully check the LIVE STORE INVENTORY list above for the user's exact item, horsepower (HP), capacity, or model.
2. IF THE EXACT PRODUCT / SPECIFICATION IS IN OUR LIVE INVENTORY:
   - Confirm it is available in stock.
   - Provide its exact selling price (₹), key specifications, farm benefits, 0% EMI options, 40-50% Govt. SMAM DBT subsidy, and 1-year OEM warranty.
3. IF THE PRODUCT, BRAND, HORSEPOWER, OR TOOL IS NOT IN OUR STORE (OUT OF STOCK OR NOT SOLD):
   - This rule applies to ANY query for something not in our catalog (e.g. "5 HP Power Weeder", "3 HP Solar Pump", "10 HP Tiller", "Chaff Cutter / Kutti Machine", "Tractor Trolley", "Seed Drill", "Drone Sprayer", "Combine Harvester", "Milking Machine", "Reaper", "Cultivator", "Disc Harrow", "Diesel Water Pump", "Chainsaw", etc.):
   - YOU MUST NEVER lie or pretend we have an unlisted product or capacity.
   - Speak naturally and honestly like a friendly, knowledgeable human machinery consultant:
     a) FIRST: Clearly state that the requested model/specification is currently not in stock or not in our catalog:
        (e.g., "Namaste Kisan Bhai! 🙏 Abhi hamare catalog/stock me **[Exact Item Name / HP, e.g. 5 HP Power Weeder / 3 HP Pump / Chaff Cutter]** available nahi hai.")
     b) SECOND: Proactively and thoughtfully recommend the closest available related alternative from our live catalog that fulfills their farming need (e.g. For Chaff Cutter/Reaper -> recommend our Backpack Brush Cutter 50cc; For 3HP Pump -> recommend our 5HP Solar DC Pump SP-500; For 5HP Weeder -> recommend our 7HP Petrol Weeder AV-708; For 10HP/12HP Tiller -> recommend our 9HP Diesel Tiller; For Trolley/Cultivator -> recommend our 6ft Heavy Duty Rotavator).
     c) THIRD: Explain why the recommended alternative is technically sound and advantageous for Indian soils/crops, its price, warranty, 0% No-Cost EMI, and subsidy.

COMPLAINTS & BREAKDOWN RESOLUTION PROTOCOL:
- If the customer reports a machine defect, starting issue, breakdown, oil leak, vibration, abnormal sound, delivery delay, damaged parcel, or payment deduction:
  1. Provide structured 3-4 step technical diagnostic checklist (e.g. Fuel valve ON, choke position, 15W-40 oil level sensor cutoff, spark plug carbon cleaning).
  2. Inform them that if the issue is not solved:
     - 🎫 **Raise Official Support Ticket** directly from /support
     - 📞 **Call OEM Technical Helpline:** 1800-AGRI-FARM (+91 7823354321)
     - 💬 **WhatsApp Certified Field Engineer:** +91 9027799171
     - ✉️ **Email Grievance Desk:** support@agrimachinery.com

FINANCING & POLICIES:
- 0% No-Cost EMI: 3 to 36 months flexible tenure on SBI Kisan Card, HDFC, ICICI, Bajaj Finserv.
- Govt Subsidy: 40% to 50% DBT SMAM subsidy eligible with official GST commercial invoice.
- Free Doorstep Farm Delivery: 100% Free delivery across all rural Indian pincodes (3-6 days).

STRICT GUARDRAILS:
- ONLY answer questions about agriculture, farming, crops, soil, machinery, weeders, pumps, DBT subsidies, 0% EMI, troubleshooting, complaints, and store orders.
- STRICTLY REFUSE off-topic questions (Bollywood, politics, cricket, movies, Python/coding, jokes, dating, etc.) politely in the requested language (${lang}).
- TONE: Warm, energetic, human-like, respectful ("Kisan Bhai", "Namaste"). Use clean markdown with **bold headings**, bullet points (•), and numbered steps.`;

  const modelsToTry = [
    'gemini-3.6-flash',
    env.GEMINI_MODEL || 'gemini-2.5-flash',
    'gemini-2.0-flash'
  ];

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          {
            parts: [{ text: userQuery }]
          }
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 900
        }
      };

      const response = await axios.post(url, payload, { timeout: 15000 });
      const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidate && candidate.trim()) {
        return candidate.trim();
      }
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || err.message;
      console.warn(`[Gemini API] Model ${model} failed (${errMsg}), trying next fallback model...`);
    }
  }

  return null;
}

/**
 * Main Controller Handler for Agricultural AI Assistant
 */
async function processFarmerQuery(userInput, lang = 'hi') {
  const query = userInput ? userInput.trim() : '';
  const qLower = query.toLowerCase();

  // 1. STRICT GUARDRAIL CHECK: Block irrelevant / out-of-scope non-store questions immediately
  if (!isStoreOrAgricultureRelated(query)) {
    if (lang === 'hi') {
      return {
        text: `🙏 **Namaste Kisan Bhai!**\n\nMain **AgriMachina** ka 24x7 Agricultural AI Specialist hoon.\n\nMain sirf **hamare store ki kheti machinery, power weeders, solar pumps, brush cutters, 0% EMI loan, Govt. SMAM subsidy, machine troubleshooting, shikayat nivaran aur orders** ke sawalon me madad kar sakta hoon.\n\nKripya hamari machinery ya kisan upkaran se juda koi sawal poochhein! 🚜🌾`,
        actionLink: { label: 'Explore Agriculture Store', url: '/products' },
        products: [],
        supportActions: []
      };
    } else if (lang === 'gu') {
      return {
        text: `🙏 **નમસ્તે કિસાન મિત્ર!**\n\nહું **AgriMachina** નો કૃષિ AI સહાયક છું. હું ફક્ત **ખેતીની મશીનરી, પાવર વીડર, સોલર પંપ, સરકારી સબસિડી, 0% EMI અને સ્ટોર ઓર્ડર** બાબતે જ મદદ કરી શકું છું. કૃપા કરીને ખેતીના ઉપકરણો અંગે પૂછો. 🚜`,
        actionLink: { label: 'મશીનરી જુઓ', url: '/products' },
        products: [],
        supportActions: []
      };
    } else if (lang === 'pa') {
      return {
        text: `🙏 **ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ!**\n\nਮੈਂ **AgriMachina** ਦਾ ਖੇਤੀਬਾੜੀ AI ਅਸਿਸਟੈਂਟ ਹਾਂ। ਮੈਂ ਸਿਰਫ਼ **ਖੇਤੀ ਮਸ਼ੀਨਰੀ, ਪਾਵਰ ਵੀਡਰ, ਸੋਲਰ ਪੰਪ, ਸਰਕਾਰੀ ਸਬਸਿਡੀ, 0% EMI ਅਤੇ ਸਟੋਰ ਆਰਡਰਾਂ** ਬਾਰੇ ਹੀ ਜਾਣਕਾਰੀ ਦੇ ਸਕਦਾ ਹਾਂ।`,
        actionLink: { label: 'ਸਟੋਰ ਖੋਲ੍ਹੋ', url: '/products' },
        products: [],
        supportActions: []
      };
    } else {
      return {
        text: `🙏 **Hello Farmer Friend!**\n\nI am the **AgriMachina Agricultural AI Assistant**. I am dedicated to assisting you with **farming equipment, power weeders, solar pumps, brush cutters, 0% No-Cost EMI, Govt. SMAM Subsidies, machinery troubleshooting, complaints, and store policies**.\n\nPlease feel free to ask anything about our agricultural machinery or farming solutions! 🚜🌾`,
        actionLink: { label: 'Explore Equipment Catalog', url: '/products' },
        products: [],
        supportActions: []
      };
    }
  }

  // 2. Detect Complaint / Technical Grievance Intent
  const hasComplaint = isComplaintQuery(query);
  const supportActions = hasComplaint ? [
    { type: 'ticket', label: '🎫 Raise Support Ticket', url: '/support' },
    { type: 'call', label: '📞 Call Helpline (1800-AGRI-FARM)', phone: '1800-AGRI-FARM' },
    { type: 'whatsapp', label: '💬 WhatsApp Support', url: 'https://wa.me/919027799171?text=Namaste%20AgriMachina%20Technical%20Support' }
  ] : [];

  // 3. Query Live Database Catalog for matching or alternative machinery
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
          : (hasComplaint ? { label: 'Go to Support Desk', url: '/support' } : { label: 'Explore Agriculture Store', url: '/products' }),
        products: matchingProducts,
        supportActions
      };
    }
  } catch (geminiErr) {
    console.error('Gemini processing error:', geminiErr.message);
  }

  // 5. Dynamic Universal Local Fallback (if Gemini REST call is offline)
  if (hasComplaint) {
    return {
      text: `🛠️ **Namaste Kisan Bhai! Technical Troubleshooting Guide:**\n\n1. **Fuel & Choke Check:** Engine ka fuel switch ON karein aur cold start ke liye choke lever band (Close) karein. Start hone par choke open karein.\n2. **Oil Sensor Safety:** Engine me **15W-40 grade oil** ka level check karein. Kam oil hone par engine auto-cutoff ho jata hai.\n3. **Spark Plug:** Spark plug nikal kar carbon saaf karein aur gap (0.7-0.8mm) check karein.\n\n⚠️ **Agar dikkat solve nahi hoti hai:**\nAap bilkul fikar na karein! Aap neeche diye gaye button se turant **Support Ticket** raise kar sakte hain ya hamare toll-free helpline **1800-AGRI-FARM** par baat kar sakte hain. Hamare engineer video call par live check karenge.`,
      actionLink: { label: 'Open Support Desk', url: '/support' },
      products: [],
      supportActions
    };
  }

  // Generic Dynamic Stock & Alternative Recommendation Fallback
  const topAlternative = matchingProducts[0];
  if (topAlternative) {
    return {
      text: `🙏 **Namaste Kisan Bhai!**\n\nAbhi hamare store catalog me aapke dwara maange gaye specific model ka stock uplabdh nahi hai.\n\nLekin aapki kheti ki zaroorat ke liye hamare paas sabse behtareen alternative **${topAlternative.title}** uplabdh hai!\n\n• **Price:** ₹${topAlternative.price.toLocaleString('en-IN')} (MRP: ₹${topAlternative.compareAtPrice.toLocaleString('en-IN')})\n• **0% No-Cost EMI:** Aasan kishton me uplabdh\n• **Sarkari Subsidy:** 40-50% DBT SMAM anudan approved\n• **Warranty:** 1-Saal ki poori OEM warranty\n\nKya aap is machine ke baare me aur janna chahte hain?`,
      actionLink: { label: `View ${topAlternative.title.slice(0, 24)}...`, url: `/products/${topAlternative.slug}` },
      products: matchingProducts.slice(0, 2),
      supportActions: []
    };
  }

  return {
    text: `Namaste Kisan Bhai! 🙏 Main **AgriMachina** ka AI Specialist hoon.\n\nAap mujhse hamari website par uplabdh **Power Weeders, Brush Cutters, Solar Pumps, Earth Augers, Sprayers, 0% No-Cost EMI, Govt. SMAM Subsidy, technical troubleshooting, ya support** ke baare me pooch sakte hain.\n\nKahiye, main aapki kya seva karoon?`,
    actionLink: { label: 'View All Farm Equipment', url: '/products' },
    products: matchingProducts.slice(0, 2),
    supportActions: []
  };
}

module.exports = {
  isStoreOrAgricultureRelated,
  searchStoreCatalog,
  callGeminiAssistant,
  processFarmerQuery
};
