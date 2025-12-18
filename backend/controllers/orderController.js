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
      userId: req.dbUser ? req.dbUser._id : null, 
      products, 
      totalAmount,
      paymentId,
      status: 'pending' 
    });

    if (!req.dbUser) {
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
    // Populate product basic fields so frontend can show image/name/price even
    // if snapshots are missing on older orders. Merge populated product fields
    // into the product snapshot so frontend can read `product.name` and
    // `product.image` (older UI expects snapshot fields).
    let orders = await Order.find({ userId: req.dbUser._id })
      .populate('products.productId', 'name price image')
      .sort({ createdAt: -1 })
      .lean();

    orders = orders.map((order) => {
      order.products = order.products.map((p) => {
        if (p.productId && typeof p.productId === 'object') {
          const prod = p.productId;
          p.name = prod.name || p.name;
          p.image = prod.image || p.image;
          p.price = prod.price != null ? prod.price : p.price;
          p.productId = prod._id;
        }
        return p;
      });
      return order;
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/all
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    // Populate user details (name, email) from User model
    // Also populate product details for admin view
    let orders = await Order.find({})
      .populate('userId', 'name email')
      .populate('products.productId', 'name price image')
      .sort({ createdAt: -1 })
      .lean();

    orders = orders.map((order) => {
      order.products = order.products.map((p) => {
        if (p.productId && typeof p.productId === 'object') {
          const prod = p.productId;
          p.name = prod.name || p.name;
          p.image = prod.image || p.image;
          p.price = prod.price != null ? prod.price : p.price;
          p.productId = prod._id;
        }
        return p;
      });
      return order;
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    let { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });

    status = String(status).toLowerCase();
    const allowed = ['pending','shipped','delivered','cancelled','completed'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    // Update and return the new document
    const updated = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true })
      .populate('userId', 'name email')
      .populate('products.productId', 'name price image')
      .lean();

    if (!updated) return res.status(404).json({ message: 'Order not found' });

    // Merge populated fields into product snapshot for consistency with other endpoints
    updated.products = (updated.products || []).map((p) => {
      if (p.productId && typeof p.productId === 'object') {
        const prod = p.productId;
        p.name = prod.name || p.name;
        p.image = prod.image || p.image;
        p.price = prod.price != null ? prod.price : p.price;
        p.productId = prod._id;
      }
      return p;
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Cancel order (User)
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
        // Ensure user owns the order
        if (order.userId.toString() !== req.dbUser._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to edit this order' });
        }
        
        if (order.status !== 'pending') {
            return res.status(400).json({ message: 'Cannot cancel order that is not pending' });
        }

        order.status = 'cancelled';
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder
};
