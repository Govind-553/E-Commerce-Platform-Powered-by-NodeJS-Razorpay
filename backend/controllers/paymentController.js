const Razorpay = require('razorpay');

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
});

exports.getRazorpayKey = (req, res) => {
    res.json({ key_id: process.env.RAZORPAY_ID_KEY });
};

exports.initiatePayment = async (req, res) => {
    const { amount, currency } = req.body;
    const options = {
        amount: amount * 100,
        currency: currency,
        receipt: `receipt_${Date.now()}`,
    };

    try {
        const order = await razorpayInstance.orders.create(options);
        res.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ error: 'Failed to initiate payment' });
    }
};

exports.renderProductPage = (req, res) => {
    res.render('product');
};
