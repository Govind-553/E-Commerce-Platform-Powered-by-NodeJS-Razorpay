const express = require('express');
const router = express.Router();
const { getCart, putCart, deleteCart, postCartItem, deleteCartItem } = require('../controllers/cartController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getCart);
router.put('/', verifyToken, putCart);
router.delete('/', verifyToken, deleteCart);
router.post('/item', verifyToken, postCartItem);
router.delete('/item/:productId', verifyToken, deleteCartItem);

module.exports = router;
