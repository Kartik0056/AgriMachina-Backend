const XLSX = require('xlsx');
const JSZip = require('jszip');
const Product = require('../models/Product');
const sanitizeHtml = require('sanitize-html');

/**
 * Parses specification string or JSON
 * Format: "GROUP:Name:Value:Unit;GROUP:Name:Value:Unit" or JSON string
 */
const parseSpecificationsField = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        // Fallback to delimiter parsing
      }
    }

    // Delimited parsing: Group:Name:Value:Unit;Group2:Name2:Value2:Unit2
    const items = trimmed.split(';').map(item => item.trim()).filter(Boolean);
    return items.map((item, idx) => {
      const parts = item.split(':').map(p => p.trim());
      return {
        group: (parts[0] || 'GENERAL').toUpperCase(),
        name: parts[1] || 'Spec',
        value: parts[2] || parts[1] || '',
        unit: parts[3] || '',
        order: idx
      };
    });
  }
  return [];
};

/**
 * Parses applications string or JSON
 * Format: "Weeding:Description:image;Spraying:Description:image" or comma separated
 */
const parseApplicationsField = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try { return JSON.parse(trimmed); } catch (e) {}
    }
    const items = trimmed.split(/;|,/).map(item => item.trim()).filter(Boolean);
    return items.map(item => {
      const parts = item.split(':').map(p => p.trim());
      return {
        name: parts[0] || item,
        description: parts[1] || `Optimized for high-efficiency ${parts[0] || item}`,
        icon: 'Sprout',
        image: parts[2] || ''
      };
    });
  }
  return [];
};

/**
 * Parses features string or JSON
 */
const parseFeaturesField = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try { return JSON.parse(trimmed); } catch (e) {}
    }
    const items = trimmed.split(/;|\n/).map(item => item.trim()).filter(Boolean);
    return items.map((item, idx) => {
      const parts = item.split(':').map(p => p.trim());
      return {
        title: parts[0] || item,
        description: parts[1] || '',
        icon: 'CheckCircle',
        image: parts[2] || '',
        order: idx
      };
    });
  }
  return [];
};

/**
 * Parses Ideal For list (comma or semicolon separated)
 */
const parseIdealForField = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    return raw.split(/;|,/).map(s => s.trim()).filter(Boolean);
  }
  return [];
};

/**
 * Parses What's Included list (comma or semicolon separated)
 */
const parseWhatsIncludedField = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    return raw.split(/;|,/).map(s => s.trim()).filter(Boolean);
  }
  return [];
};

/**
 * Parses and Validates an uploaded Excel / CSV workbook buffer
 */
const parseAndValidateSpreadsheet = async (fileBuffer) => {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Workbook contains no sheets.');
  }

  const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { defval: '' });
  if (!rawRows || rawRows.length === 0) {
    throw new Error('The uploaded spreadsheet contains no data rows.');
  }

  // Fetch existing SKUs to test for collision
  const existingProducts = await Product.find({}, { sku: 1 }).lean();
  const existingSkusSet = new Set(existingProducts.map(p => p.sku?.toUpperCase().trim()));

  const seenSkusInSheet = new Set();
  const errors = [];
  const validProducts = [];

  rawRows.forEach((row, index) => {
    const rowNum = index + 2; // 1-based header is row 1
    const rowErrors = [];

    // Map column aliases (flexible header matching)
    const name = String(row.name || row.Name || row['Product Name'] || '').trim();
    const sku = String(row.sku || row.SKU || row['Sku'] || '').trim().toUpperCase();
    const brand = String(row.brand || row.Brand || 'AgriMachina').trim();
    const modelNumber = String(row.model || row.modelNumber || row['Model Number'] || '').trim();
    const category = String(row.category || row.Category || '').trim();
    const subcategory = String(row.subcategory || row.Subcategory || '').trim();
    const shortDescription = String(row.shortDescription || row['Short Description'] || '').trim();
    const description = sanitizeHtml(String(row.description || row.Description || shortDescription || ''), {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'table', 'tr', 'td', 'th'])
    });

    const rawMrp = row.mrp || row.MRP || row['Mrp'];
    const rawPrice = row.price || row.sellingPrice || row['Selling Price'] || row['Price'];
    const rawCost = row.costPrice || row['Cost Price'] || 0;
    const rawStock = row.stock || row.stockQuantity || row['Stock Quantity'] || row['Stock'];
    const rawGst = row.gst || row.gstPercent || row['GST %'] || 12;

    // Field Validations
    if (!name) {
      rowErrors.push({ field: 'name', message: 'Product Name is required.' });
    }

    if (!sku) {
      rowErrors.push({ field: 'sku', message: 'SKU is required.' });
    } else if (seenSkusInSheet.has(sku)) {
      rowErrors.push({ field: 'sku', message: `Duplicate SKU "${sku}" found within the spreadsheet.` });
    } else if (existingSkusSet.has(sku)) {
      rowErrors.push({ field: 'sku', message: `SKU "${sku}" already exists in MongoDB.` });
    } else {
      seenSkusInSheet.add(sku);
    }

    if (!category) {
      rowErrors.push({ field: 'category', message: 'Category is required.' });
    }

    const price = Number(rawPrice);
    if (isNaN(price) || price <= 0) {
      rowErrors.push({ field: 'price', message: 'Price must be a positive numeric value.' });
    }

    let mrp = Number(rawMrp);
    if (isNaN(mrp) || mrp <= 0) {
      mrp = price; // Default MRP to price if not set
    } else if (mrp < price) {
      rowErrors.push({ field: 'mrp', message: `MRP (${mrp}) cannot be less than Selling Price (${price}).` });
    }

    const stock = Number(rawStock);
    if (isNaN(stock) || stock < 0) {
      rowErrors.push({ field: 'stock', message: 'Stock Quantity must be a non-negative integer.' });
    }

    const gst = Number(rawGst);
    if (isNaN(gst) || gst < 0 || gst > 28) {
      rowErrors.push({ field: 'gst', message: 'GST % must be between 0 and 28.' });
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: rowNum,
        sku: sku || 'N/A',
        name: name || 'N/A',
        errors: rowErrors
      });
    } else {
      // Build normalized product object
      const slug = (name + '-' + sku).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const specs = parseSpecificationsField(row.specifications || row.Specifications || '');
      const apps = parseApplicationsField(row.applications || row.Applications || '');
      const feats = parseFeaturesField(row.features || row.Features || '');
      const ideal = parseIdealForField(row.idealFor || row['Ideal For'] || '');
      const whatsIncluded = parseWhatsIncludedField(row.whatsIncluded || row['Whats Included'] || '');
      const mainImageUrl = String(row.mainImage || row['Main Image'] || 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80').trim();

      const tenureRaw = String(row.emiTenures || row['EMI Tenures'] || '3,6,9,12,18,24,36');
      const tenureOptions = tenureRaw.split(',').map(t => Number(t.trim())).filter(n => !isNaN(n) && n > 0);

      validProducts.push({
        name,
        slug,
        brand,
        modelNumber,
        sku,
        category,
        subcategory,
        shortDescription,
        description,
        status: String(row.status || 'Published'),
        hsnCode: String(row.hsn || row.hsnCode || '8432').trim(),
        mrp,
        sellingPrice: price,
        costPrice: Number(rawCost) || 0,
        gstPercent: gst,
        stockQuantity: stock,
        lowStockThreshold: Number(row.lowStockThreshold || 5),
        mainImage: {
          url: mainImageUrl,
          alt: name,
          caption: `${name} ${brand}`
        },
        gallery: [
          { url: mainImageUrl, tag: '01 Main', order: 0 }
        ],
        specifications: specs,
        applications: apps,
        features: feats,
        idealFor: ideal.length ? ideal : ['Small Farms', 'Medium Farms', 'Vegetable Farming'],
        whatsIncluded: whatsIncluded.length ? whatsIncluded : ['Standard Machinery Kit', 'User Manual', 'Toolkit'],
        shipping: {
          available: true,
          panIndia: true,
          estimatedDeliveryDays: String(row.deliveryDays || '4 - 7 Business Days'),
          shippingCharge: Number(row.shippingCharge || 0),
          freeShippingThreshold: 4999,
          installationAvailable: true
        },
        warranty: {
          period: String(row.warranty || '1 Year Manufacturer Warranty'),
          type: 'Comprehensive',
          terms: 'Standard OEM agricultural coverage'
        },
        emi: {
          enabled: String(row.emiEnabled).toLowerCase() !== 'false',
          interestRate: Number(row.emiRate || 13.5),
          tenureOptions: tenureOptions.length ? tenureOptions : [3, 6, 9, 12, 18, 24, 36]
        },
        seo: {
          seoTitle: String(row.seoTitle || `${name} | Buy Online`).trim(),
          metaDescription: String(row.seoDescription || shortDescription || name).trim(),
          focusKeyword: String(row.seoKeywords || `${name} ${brand}`).trim()
        },
        isPublished: String(row.status || 'Published') === 'Published'
      });
    }
  });

  return {
    totalRows: rawRows.length,
    validCount: validProducts.length,
    errorCount: errors.length,
    isValid: errors.length === 0,
    errors,
    validProducts
  };
};

/**
 * Bulk Image Mapper by SKU
 * Extracts ZIP archive and maps filenames like "SKU-01.jpg", "SKU-02.png" to product galleries
 */
const mapImagesFromZip = async (zipBuffer) => {
  const zip = await JSZip.loadAsync(zipBuffer);
  const mappedResults = {}; // { SKU: [ { filename, base64Url, order, tag } ] }
  const unmappedFiles = [];

  const fileEntries = Object.keys(zip.files).filter(filename => {
    return !zip.files[filename].dir && /\.(jpg|jpeg|png|webp)$/i.test(filename);
  });

  for (const filename of fileEntries) {
    const file = zip.files[filename];
    const base64Data = await file.async('base64');
    const ext = filename.split('.').pop().toLowerCase();
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const dataUrl = `data:${mime};base64,${base64Data}`;

    // Extract SKU from filename (e.g., "AV708-01.jpg" -> SKU: "AV708", order: 1)
    const cleanBasename = filename.split('/').pop().replace(/\.[^/.]+$/, '');
    const match = cleanBasename.match(/^([A-Za-z0-9_-]+?)(?:[-_](\d+))?$/);

    if (match) {
      const detectedSku = match[1].toUpperCase();
      const orderNum = match[2] ? parseInt(match[2], 10) : 1;
      
      const tagLabels = ['01 Main', '02 Front', '03 Side', '04 Back', '05 Detail', '06 Engine', '07 Application', '08 Accessories'];
      const tag = tagLabels[orderNum - 1] || `Gallery Image ${orderNum}`;

      if (!mappedResults[detectedSku]) {
        mappedResults[detectedSku] = [];
      }
      mappedResults[detectedSku].push({
        filename,
        dataUrl,
        order: orderNum,
        tag
      });
    } else {
      unmappedFiles.push(filename);
    }
  }

  return {
    totalFiles: fileEntries.length,
    matchedSkus: Object.keys(mappedResults),
    mappedResults,
    unmappedFiles
  };
};

/**
 * Generates Starter Excel Template Buffer
 */
const generateStarterTemplateBuffer = () => {
  const sampleHeaders = [
    {
      name: 'Power Weeder 7HP Petrol 4-Stroke',
      sku: 'AV-PW708-4S',
      brand: 'AgriPro Master',
      model: 'AV-708',
      category: 'Power Weeders',
      subcategory: 'Inter-Cultivation',
      shortDescription: 'Heavy-duty 7 HP petrol engine power weeder for intercultural operations, soil loosening, and weeding.',
      description: 'The AgriPro Master 7HP Power Weeder is an indispensable machine for modern farmers. Engineered with high-strength rotary blades, ergonomic anti-vibration handles, and a high-torque gearbox.',
      mrp: 48500,
      price: 39999,
      costPrice: 28000,
      gst: 12,
      stock: 25,
      hsn: '8432',
      warranty: '1 Year Comprehensive Warranty',
      idealFor: 'Small Farms, Vegetable Farming, Orchards, Sugarcane, Cotton',
      applications: 'Weeding;Soil Preparation;Bed Preparation;Tilling',
      features: 'High Performance 208cc Engine:Easy Recoil Starting:Heavy Duty Tilling Blades:Ergonomic Handle',
      specifications: 'ENGINE:Engine Power:7 HP:HP;ENGINE:Displacement:208:cc;ENGINE:Fuel Type:Petrol:;PERFORMANCE:Working Width:600-900:mm;PERFORMANCE:Working Depth:100-150:mm;DIMENSIONS:Machine Weight:85:kg',
      whatsIncluded: 'Power Weeder Machine, 32-Piece Blade Set, Transport Wheels, Toolkit, User Manual',
      shippingCharge: 0,
      deliveryDays: '3 - 6 Business Days',
      emiEnabled: true,
      emiRate: 13.5,
      emiTenures: '3,6,9,12,18,24,36',
      seoTitle: 'Power Weeder 7HP Petrol Engine - Buy at Best Price',
      seoDescription: 'Order 7HP Power Weeder online with pan-India delivery, 1 year warranty, and easy monthly EMI.',
      seoKeywords: 'power weeder, agricultural weeder, petrol cultivator, rotary tiller',
      status: 'Published'
    },
    {
      name: 'Solar Submersible Water Pump 3HP DC',
      sku: 'SOLAR-PUMP-3HP',
      brand: 'SunAgro Tech',
      model: 'SA-SP300',
      category: 'Water Pumps & Irrigation',
      subcategory: 'Solar Pumps',
      shortDescription: 'High efficiency 3 HP DC solar powered submersible pump for zero electricity irrigation.',
      description: 'SunAgro 3HP solar submersible pump operates on solar PV modules, delivering up to 180,000 liters per day with stainless steel impeller and MPPT smart controller.',
      mrp: 145000,
      price: 118000,
      costPrice: 92000,
      gst: 12,
      stock: 14,
      hsn: '8413',
      warranty: '5 Years Manufacturer Warranty on Pump & Controller',
      idealFor: 'Large Farms, Medium Farms, Orchards, Commercial Farming',
      applications: 'Drip Irrigation;Flood Irrigation;Sprinkler Systems',
      features: 'Brushless DC Motor:Smart MPPT Controller:Stainless Steel 304 Casing:Dry Run Protection',
      specifications: 'PERFORMANCE:Max Flow:18000:LPH;PERFORMANCE:Max Head:90:Meters;ELECTRICAL:Voltage:96:V DC;ELECTRICAL:Power Rating:3:HP;DIMENSIONS:Pump Diameter:4:Inch',
      whatsIncluded: '3HP DC Submersible Pump, MPPT Solar Controller, Cable Joint Kit, Safety Rope',
      shippingCharge: 0,
      deliveryDays: '5 - 8 Business Days',
      emiEnabled: true,
      emiRate: 12.0,
      emiTenures: '6,12,18,24,36',
      seoTitle: '3HP Solar Submersible Pump for Agriculture | SunAgro',
      seoDescription: 'Get 3HP Solar Water Pump with 5 years warranty and subsidies eligibility.',
      seoKeywords: 'solar pump, 3hp solar water pump, agricultural solar pump',
      status: 'Published'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleHeaders);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'AgroProductsTemplate');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

module.exports = {
  parseAndValidateSpreadsheet,
  mapImagesFromZip,
  generateStarterTemplateBuffer,
  parseSpecificationsField,
  parseApplicationsField,
  parseFeaturesField,
  parseIdealForField,
  parseWhatsIncludedField
};
