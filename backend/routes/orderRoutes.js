const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders } = require('../controllers/orderController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, createOrder);
router.get('/myorders', verifyToken, getMyOrders);

module.exports = router;
