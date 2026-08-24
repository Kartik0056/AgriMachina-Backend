const express = require('express');
const router = express.Router();
const { getAllOrders, getOrderById, updateOrderStatus } = require('../controllers/adminOrderController');
const { requireAdminAuth } = require('../middleware/adminAuth');
const { requireRole } = require('../middleware/checkPermission');

router.use(requireAdminAuth);

router.get('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER']), getAllOrders);
router.get('/:id', requireRole(['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER']), getOrderById);
router.put('/:id/status', requireRole(['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER']), updateOrderStatus);

module.exports = router;
