const Order = require('../models/Order');
const Product = require('../models/Product');
const stripe = require('stripe')(process.env.STRIPE_SECRET);

// Render checkout page (GET /checkout)
exports.checkoutPage = (req, res) => {
  const cart = req.session.cart || { items: [], total: 0 };
  if (!req.session.user) {
    req.flash('error_msg', 'Please log in to checkout');
    return res.redirect('/login');
  }
  res.render('checkout', { cart, user: req.session.user });
};

// Create payment intent and create an Order with pending payment (POST /checkout/pay)
exports.createPayment = async (req, res) => {
  try {
    const cart = req.session.cart;
    if (!cart || cart.items.length === 0) {
      req.flash('error_msg', 'Cart is empty');
      return res.redirect('/cart');
    }

    // Build order items
    const items = cart.items.map(it => ({
      product: it.product._id,
      quantity: it.quantity,
      price: it.product.price
    }));

    // Create Order in DB with pending payment
    const order = new Order({
      user: req.session.user._id,
      items,
      totalAmount: cart.total,
      billing: {
        name: req.body.name,
        email: req.body.email,
        address: req.body.address,
        city: req.body.city,
        pincode: req.body.pincode
      },
      status: 'Pending',
      paymentStatus: 'Pending'
    });
    await order.save();

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(cart.total * 100), // in paise
      currency: 'inr',
      metadata: { orderId: order._id.toString() }
    });

    // Save stripe intent id
    order.stripePaymentIntentId = paymentIntent.id;
    await order.save();

    res.render('payment-verification', { payment: { clientSecret: paymentIntent.client_secret, orderId: order._id }, user: req.session.user });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Payment creation failed');
    res.redirect('/checkout');
  }
};

// Stripe webhook endpoint (POST /webhook/stripe)
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;
    const order = await Order.findById(orderId);
    if (order) {
      order.paymentStatus = 'Paid';
      order.status = 'Pending'; // admin will update to shipped
      await order.save();
      // Clear user's session cart if you want to (cannot access session here easily)
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;
    const order = await Order.findById(orderId);
    if (order) {
      order.paymentStatus = 'Failed';
      await order.save();
    }
  }

  res.json({ received: true });
};

// User order list
exports.userOrders = async (req, res) => {
  const orders = await Order.find({ user: req.session.user._id }).populate('items.product').sort({ createdAt: -1 });
  // returns orders for rendering user dashboard
  res.render('user-dashboard', { user: req.session.user, orders, returns: [] });
};

// Admin: update order status (POST /admin/orders/:id/update)
exports.updateOrderStatus = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    req.flash('error_msg', 'Order not found');
    return res.redirect('/admin');
  }
  order.status = req.body.status;
  await order.save();
  req.flash('success_msg', 'Order status updated');
  res.redirect('/admin');
};
