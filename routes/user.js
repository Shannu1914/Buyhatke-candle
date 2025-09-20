const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../Middleware/authMiddleware');
const Order = require('../models/Order');
const orderController = require('../controllers/orderController');

// ------------------ User Dashboard ------------------
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.user._id }).populate('items.product');
    res.render('user-dashboard', { user: req.session.user, orders });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Unable to load dashboard');
    res.redirect('/');
  }
});

// ------------------ User Orders Page ------------------
router.get('/orders', isAuthenticated, orderController.userOrders);

// ------------------ Request Return ------------------
router.post('/orders/:id/return', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      req.flash('error_msg', 'Order not found');
      return res.redirect('/user/orders');
    }

    order.status = 'Return Requested';
    await order.save();

    req.flash('success_msg', 'Return requested successfully');
    res.redirect('/user/orders');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Unable to request return');
    res.redirect('/user/orders');
  }
});

module.exports = router;
