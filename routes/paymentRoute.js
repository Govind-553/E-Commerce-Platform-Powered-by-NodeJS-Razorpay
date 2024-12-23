const express = require('express');
const payment_route = express.Router();
const bodyParser = require('body-parser');
const paymentController = require('../controllers/paymentController');

payment_route.use(bodyParser.json());
payment_route.use(bodyParser.urlencoded({ extended: false }));

payment_route.get('/', (req, res) => {
    res.render('product'); 
});

payment_route.get('/product', paymentController.renderProductPage);
payment_route.get('/get-razorpay-key', paymentController.getRazorpayKey);
payment_route.post('/create-order', paymentController.initiatePayment);

module.exports = payment_route;
