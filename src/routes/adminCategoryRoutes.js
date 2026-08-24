const express = require('express');
const router = express.Router();
const {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAdminBrands,
  createBrand,
  getAdminCoupons,
  createCoupon
} = require('../controllers/adminCategoryController');
const { requireAdminAuth } = require('../middleware/adminAuth');
const { requirePermission } = require('../middleware/checkPermission');

router.use(requireAdminAuth);

// Categories
router.get('/categories', getAdminCategories);
router.post('/categories', requirePermission('PRODUCT_CREATE'), createCategory);
router.put('/categories/:id', requirePermission('PRODUCT_UPDATE'), updateCategory);
router.delete('/categories/:id', requirePermission('PRODUCT_DELETE'), deleteCategory);

// Brands
router.get('/brands', getAdminBrands);
router.post('/brands', requirePermission('PRODUCT_CREATE'), createBrand);

// Coupons
router.get('/coupons', getAdminCoupons);
router.post('/coupons', requirePermission('COUPON_MANAGE'), createCoupon);

module.exports = router;
