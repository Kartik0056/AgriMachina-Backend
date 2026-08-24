const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrderDetails } = require('../controllers/orderController');
const { requireUserAuth } = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/sanitize');

router.use(requireUserAuth);

router.post('/', sanitizeInput, createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderDetails);

module.exports = router;
