const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const { logAuditAction } = require('../services/auditService');
const {
  parseAndValidateSpreadsheet,
  mapImagesFromZip,
  generateStarterTemplateBuffer
} = require('../services/bulkImportService');

const downloadStarterTemplate = (req, res) => {
  try {
    const buffer = generateStarterTemplateBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="agro-product-import-template.xlsx"');
    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const parseAndValidateBulkImport = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel (.xlsx) or CSV (.csv) file.' });
    }

    const validationResult = await parseAndValidateSpreadsheet(req.file.buffer);

    return res.status(200).json({
      success: true,
      data: validationResult
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const executeBulkImport = async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid products provided to import.' });
    }

    const insertedDocs = [];
    const inventoryLogs = [];

    for (const prodData of products) {
      // Check SKU duplication again in case of race condition
      const exists = await Product.findOne({ sku: prodData.sku.toUpperCase().trim() });
      if (!exists) {
        const newProduct = new Product(prodData);
        const saved = await newProduct.save();
        insertedDocs.push(saved);

        if (saved.stockQuantity > 0) {
          inventoryLogs.push({
            product: saved._id,
            productName: saved.name,
            sku: saved.sku,
            previousStock: 0,
            newStock: saved.stockQuantity,
            changeAmount: saved.stockQuantity,
            reason: 'Bulk Spreadsheet Import',
            admin: req.admin?._id,
            adminName: req.admin?.name || 'Admin'
          });
        }
      }
    }

    if (inventoryLogs.length > 0) {
      await InventoryLog.insertMany(inventoryLogs);
    }

    await logAuditAction({
      admin: req.admin,
      action: 'BULK_IMPORT',
      resource: 'Product',
      details: { importedCount: insertedDocs.length, requestedCount: products.length },
      req
    });

    return res.status(201).json({
      success: true,
      message: `Successfully imported ${insertedDocs.length} agricultural products into MongoDB.`,
      importedCount: insertedDocs.length,
      products: insertedDocs
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Bulk import execution failed: ${error.message}`
    });
  }
};

const bulkUpdateProducts = async (req, res) => {
  try {
    const { productIds, updateFields, stockChangeReason } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0 || !updateFields) {
      return res.status(400).json({ success: false, message: 'Product IDs and update fields are required.' });
    }

    const products = await Product.find({ _id: { $in: productIds } });
    const inventoryLogs = [];

    for (const product of products) {
      if (updateFields.stockQuantity !== undefined && Number(updateFields.stockQuantity) !== product.stockQuantity) {
        const oldStock = product.stockQuantity;
        const newStock = Number(updateFields.stockQuantity);
        inventoryLogs.push({
          product: product._id,
          productName: product.name,
          sku: product.sku,
          previousStock: oldStock,
          newStock: newStock,
          changeAmount: newStock - oldStock,
          reason: stockChangeReason || 'Bulk Stock Update',
          admin: req.admin?._id,
          adminName: req.admin?.name || 'Admin'
        });
      }

      Object.assign(product, updateFields);
      await product.save();
    }

    if (inventoryLogs.length > 0) {
      await InventoryLog.insertMany(inventoryLogs);
    }

    await logAuditAction({
      admin: req.admin,
      action: 'BULK_UPDATE',
      resource: 'Product',
      details: { updatedCount: products.length, fields: Object.keys(updateFields) },
      req
    });

    return res.status(200).json({
      success: true,
      message: `Bulk update applied to ${products.length} products.`,
      updatedCount: products.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const bulkImageMapUpload = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'Please upload a ZIP archive containing images named with SKU prefixes.' });
    }

    const mapResults = await mapImagesFromZip(req.file.buffer);

    // If apply=true query param, apply to matching products
    if (req.query.apply === 'true') {
      let updatedProductsCount = 0;
      for (const [sku, images] of Object.entries(mapResults.mappedResults)) {
        const product = await Product.findOne({ sku: sku.toUpperCase().trim() });
        if (product) {
          const galleryEntries = images.map(img => ({
            url: img.dataUrl,
            tag: img.tag,
            order: img.order,
            alt: `${product.name} - ${img.tag}`,
            caption: `${product.name} ${img.tag}`
          }));

          product.gallery = galleryEntries;
          if (galleryEntries.length > 0 && (!product.mainImage || !product.mainImage.url)) {
            product.mainImage = {
              url: galleryEntries[0].url,
              alt: product.name,
              caption: product.name
            };
          }
          await product.save();
          updatedProductsCount++;
        }
      }

      await logAuditAction({
        admin: req.admin,
        action: 'BULK_IMAGE_MAP_APPLIED',
        resource: 'ProductMedia',
        details: { matchedSkus: mapResults.matchedSkus.length, updatedProducts: updatedProductsCount },
        req
      });

      return res.status(200).json({
        success: true,
        message: `Applied image gallery mapping to ${updatedProductsCount} products.`,
        data: mapResults
      });
    }

    return res.status(200).json({
      success: true,
      data: mapResults
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  downloadStarterTemplate,
  parseAndValidateBulkImport,
  executeBulkImport,
  bulkUpdateProducts,
  bulkImageMapUpload
};
