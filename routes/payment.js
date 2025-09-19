const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');

const Order = require('../models/Order');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ------------------ Checkout page ------------------
router.get('/checkout', (req, res) => {
  if (!req.session.cart || req.session.cart.length === 0) {
    req.flash('error_msg', 'Your cart is empty.');
    return res.redirect('/cart');
  }

  const cart = req.session.cart;
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  res.render('checkout', {
    cart,
    totalAmount,
    razorpayKey: process.env.RAZORPAY_KEY_ID
  });
});

// ------------------ Create Razorpay order ------------------
router.post('/create-order', async (req, res) => {
  try {
    const cart = req.session.cart || [];
    if (!cart.length) return res.status(400).json({ error: 'Cart is empty' });

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    const options = {
      amount: totalAmount * 100, // in paise
      currency: 'INR',
      receipt: `order_rcptid_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});

// ------------------ Verify payment ------------------
router.post('/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generated_signature === razorpay_signature) {
    // Payment successful → create order in DB
    const order = new Order({
      user: req.session.user ? req.session.user._id : null,
      items: req.session.cart.map(c => ({ product: c._id, qty: c.qty })),
      totalAmount: req.session.cart.reduce((sum, item) => sum + item.price * item.qty, 0),
      status: 'Paid',
      paymentStatus: 'Paid'
    });

    await order.save();
    req.session.cart = []; // clear cart

    // Render payment verification page
    return res.render('payment-verification', {
      payment: { success: true, orderId: order._id, amount: order.totalAmount }
    });
  } else {
    return res.render('payment-verification', {
      payment: { success: false, message: 'Payment verification failed' }
    });
  }
});

module.exports = router;
