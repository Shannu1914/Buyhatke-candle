const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const orderController = require('../controllers/orderController');

router.get('/orders', isAuthenticated, orderController.userOrders);

// Request return (very simple flow)
router.post('/orders/:id/return', isAuthenticated, async (req, res) => {
  const Order = require('../models/Order');
  const o = await Order.findById(req.params.id);
  if (!o) {
    req.flash('error_msg', 'Order not found');
    return res.redirect('/user/orders');
  }
  o.status = 'Return Requested';
  await o.save();
  req.flash('success_msg', 'Return requested');
  res.redirect('/user/orders');
});

module.exports = router;
