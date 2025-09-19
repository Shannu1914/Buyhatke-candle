const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const Order = require('../models/Order');
const Product = require('../models/Product');

// Checkout page
router.get('/checkout', async (req, res) => {
  if (!req.session.cart || req.session.cart.length === 0) {
    req.flash('error_msg', 'Your cart is empty.');
    return res.redirect('/cart');
  }

  const cart = req.session.cart;
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  res.render('checkout', {
    cart,
    totalAmount,
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
  });
});

// Create Stripe PaymentIntent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const cart = req.session.cart || [];
    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount * 100, // in paise
      currency: 'inr',
      metadata: { userId: req.session.user?._id || 'guest' },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment initiation failed' });
  }
});

// Payment verification callback
router.post('/payment-verification', async (req, res) => {
  try {
    const { paymentId, status, amount } = req.body;

    let success = status === 'succeeded';

    if (success) {
      // Create Order
      const order = new Order({
        user: req.session.user ? req.session.user._id : null,
        items: req.session.cart.map((c) => ({ product: c._id, qty: c.qty })),
        totalAmount: amount,
        status: 'paid',
      });
      await order.save();

      // Clear cart
      req.session.cart = [];

      return res.render('payment-verification', {
        payment: {
          success: true,
          orderId: order._id,
          amount,
        },
      });
    } else {
      return res.render('payment-verification', {
        payment: {
          success: false,
          message: 'Payment failed or cancelled',
        },
      });
    }
  } catch (err) {
    console.error(err);
    return res.render('payment-verification', {
      payment: {
        success: false,
        message: 'Server error verifying payment',
      },
    });
  }
});

module.exports = router;
