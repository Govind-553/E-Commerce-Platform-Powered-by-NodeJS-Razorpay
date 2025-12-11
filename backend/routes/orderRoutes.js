const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getAllOrders, updateOrderStatus, cancelOrder } = require('../controllers/orderController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.post('/', verifyToken, createOrder);
router.get('/myorders', verifyToken, getMyOrders);
router.get('/all', verifyToken, isAdmin, getAllOrders);
router.put('/:id/status', verifyToken, isAdmin, updateOrderStatus);
router.put('/:id/cancel', verifyToken, cancelOrder);

module.exports = router;
