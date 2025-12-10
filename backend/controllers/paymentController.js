const Razorpay = require('razorpay');
const Order = require('../models/Order');

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
});

exports.getRazorpayKey = (req, res) => {
    res.json({ key_id: process.env.RAZORPAY_ID_KEY });
};

exports.initiatePayment = async (req, res) => {
    const { amount, currency } = req.body;
    
    // Check if user is authenticated (populated by middleware)
    if (!req.dbUser) {
        return res.status(401).json({ error: 'User not authenticated. Please login.' });
    }

    const options = {
        amount: amount * 100,
        currency: currency,
        receipt: `receipt_${Date.now()}`,
    };

    try {
        const razorpayOrder = await razorpayInstance.orders.create(options);
        
        const newOrder = new Order({
            userId: req.dbUser._id,
            products: [],
            totalAmount: amount, 
            paymentId: razorpayOrder.id,
            status: 'pending'
        });

        await newOrder.save();

        res.json({
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            dbOrderId: newOrder._id
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ error: 'Failed to initiate payment' });
    }
};

exports.renderProductPage = (req, res) => {
    res.render('product');
};
