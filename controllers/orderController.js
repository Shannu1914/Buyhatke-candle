const Order = require('../models/Order');
const Product = require('../models/Product');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Render checkout page
exports.checkoutPage = (req, res) => {
  const cart = req.session.cart || { items: [], total: 0 };
  if (!req.session.user) {
    req.flash('error_msg', 'Please log in to checkout');
    return res.redirect('/login');
  }
  res.render('checkout', { cart, user: req.session.user });
};

// Create Razorpay payment order
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

    // Create Razorpay order
    const options = {
      amount: Math.round(cart.total * 100), // in paise
      currency: "INR",
      receipt: `order_rcptid_${order._id}`,
    };

    const paymentOrder = await razorpay.orders.create(options);
    order.razorpayOrderId = paymentOrder.id;
    await order.save();

    // Send order info to frontend for Razorpay checkout
    res.render('payment-verification', {
      payment: {
        orderId: order._id,
        razorpayOrderId: paymentOrder.id,
        amount: cart.total,
        currency: 'INR'
      },
      user: req.session.user
    });

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Payment creation failed');
    res.redirect('/checkout');
  }
};

// Verify Razorpay payment
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) throw new Error('Order not found');

    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      throw new Error('Payment verification failed');
    }

    // Payment successful
    order.paymentStatus = 'Paid';
    order.status = 'Pending'; // admin will update to shipped
    await order.save();

    // Clear cart
    req.session.cart = [];

    res.render('payment-success', { order, user: req.session.user });

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Payment verification failed');
    res.redirect('/checkout');
  }
};

// User order list
exports.userOrders = async (req, res) => {
  const orders = await Order.find({ user: req.session.user._id }).populate('items.product').sort({ createdAt: -1 });
  res.render('user-dashboard', { user: req.session.user, orders, returns: [] });
};

// Admin: update order status
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
