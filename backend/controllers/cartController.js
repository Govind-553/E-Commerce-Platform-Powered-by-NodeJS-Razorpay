const Cart = require('../models/Cart');
const Product = require('../models/Product');

// GET /api/cart  - return user's cart
const getCart = async (req, res) => {
  try {
    const userId = req.dbUser?._id || null;
    if (!userId) return res.status(401).json({ message: 'User not found' });

    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) return res.json({ items: [] });

    return res.json({ items: cart.items.map(i => ({
      productId: i.product._id || i.product,
      name: i.name || i.product.name,
      price: i.price || i.product.price,
      image: i.image || i.product.image,
      quantity: i.quantity
    })) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/cart - replace or create cart items; body: { items: [{ productId, quantity }] }
const putCart = async (req, res) => {
  try {
    const userId = req.dbUser?._id || null;
    if (!userId) return res.status(401).json({ message: 'User not found' });

    const items = Array.isArray(req.body.items) ? req.body.items : [];

    // build items with product snapshots
    const built = [];
    for (const it of items) {
      if (!it.productId) continue;
      const product = await Product.findById(it.productId).lean();
      if (!product) continue;
      built.push({
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: Math.max(1, parseInt(it.quantity) || 1)
      });
    }

    let cart = await Cart.findOneAndUpdate(
      { user: userId },
      { items: built, updatedAt: Date.now() },
      { upsert: true, new: true }
    );

    return res.json({ items: cart.items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/cart - clear cart
const deleteCart = async (req, res) => {
  try {
    const userId = req.dbUser?._id || null;
    if (!userId) return res.status(401).json({ message: 'User not found' });

    await Cart.findOneAndDelete({ user: userId });
    return res.json({ message: 'Cart cleared' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/cart/item - add or update single item { productId, quantity }
const postCartItem = async (req, res) => {
  try {
    const userId = req.dbUser?._id || null;
    if (!userId) return res.status(401).json({ message: 'User not found' });

    const { productId, quantity } = req.body || {};
    if (!productId) return res.status(400).json({ message: 'productId required' });

    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existing = cart.items.find(i => String(i.product) === String(product._id));
    if (existing) {
      existing.quantity = Math.max(1, parseInt(quantity) || existing.quantity + 1);
      existing.name = product.name;
      existing.price = product.price;
      existing.image = product.image;
    } else {
      cart.items.push({ product: product._id, name: product.name, price: product.price, image: product.image, quantity: Math.max(1, parseInt(quantity) || 1) });
    }

    cart.updatedAt = Date.now();
    await cart.save();

    return res.json({ items: cart.items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/cart/item/:productId - remove single item
const deleteCartItem = async (req, res) => {
  try {
    const userId = req.dbUser?._id || null;
    if (!userId) return res.status(401).json({ message: 'User not found' });

    const { productId } = req.params;
    if (!productId) return res.status(400).json({ message: 'productId required' });

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(i => String(i.product) !== String(productId));
    cart.updatedAt = Date.now();
    await cart.save();

    return res.json({ items: cart.items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getCart, putCart, deleteCart, postCartItem, deleteCartItem };
