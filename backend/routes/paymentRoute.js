const express = require('express');
const payment_route = express.Router();
// body-parser is deprecated in newer express but still works, or use express.json()
// app.js handles body parsing globally now (express.json()), so we can skip local body-parser if redundant.
// keeping it safe or removing if causing issues. Let's remove redundant middleware usage if app.js handles it.
// actually app.js mounts this.
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/authMiddleware');

// payment_route.get('/', (req, res) => {
//    res.render('product'); 
// });

// payment_route.get('/product', paymentController.renderProductPage);

payment_route.get('/get-razorpay-key', verifyToken, paymentController.getRazorpayKey);
payment_route.post('/create-order', verifyToken, paymentController.initiatePayment);

module.exports = payment_route;
