const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      name: {
        type: String,
        default: 'Product',
      },
      price: {
        type: Number,
        required: true,
      },
      image: {
        type: String,
        default: '/img/logo.png',
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'shipped', 'delivered', 'cancelled', 'completed'],
    default: 'pending',
  },
  paymentId: {
    type: String,
    // required: true, // Make required once razorpay integration is fully confirmed
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Order', orderSchema);
