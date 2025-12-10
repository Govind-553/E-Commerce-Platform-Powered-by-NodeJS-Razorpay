const Order = require('../models/Order');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  const {
    products,
    totalAmount,
    paymentId,
  } = req.body;

  if (products && products.length === 0) {
    res.status(400).json({ message: 'No order items' });
    return;
  }

  try {
    const order = new Order({
      userId: req.dbUser ? req.dbUser._id : null, // Assuming fetched in middleware
      products, // Expecting array of { productId, quantity }
      totalAmount,
      paymentId,
      status: 'pending' // Initial status
    });

    // If we want to strictly link to a registered user, check req.dbUser.
    // However, if we allow guest checkout (authenticated via firebase but not synced yet), we might leverage firebaseUid.
    // For now assuming we require synced user or at least storing some user identifier.
    // If req.dbUser is null, we might need to handle it. 
    if (!req.dbUser) {
        // Fallback or error? User said "Users after authentication... allowed to perform buying".
        // Use logic from authMiddleware where we check DB.
        return res.status(400).json({ message: 'User info not found in database. Please ensure account is synced.' });
    }

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    if (!req.dbUser) {
        return res.status(401).json({ message: 'User not found' });
    }
    const orders = await Order.find({ userId: req.dbUser._id });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
};
