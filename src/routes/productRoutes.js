const express = require('express');
const router = express.Router();
const {
  getPublicProducts,
  getDeals,
  getPublicProductBySlugOrId,
  getRecommendations,
  getFrequentlyBoughtTogetherBundle
} = require('../controllers/productController');

router.get('/deals', getDeals);
router.get('/', getPublicProducts);
router.get('/:identifier', getPublicProductBySlugOrId);
router.get('/:id/recommendations', getRecommendations);
router.get('/:id/frequently-bought-together', getFrequentlyBoughtTogetherBundle);

module.exports = router;
