const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { isAuthenticated } = require('../Middleware/authMiddleware');
const Order = require('../models/Order');
const orderController = require('../controllers/orderController');
const userController = require('../controllers/userController');


// Configure storage for profile images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads', 'profiles'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});
const upload = multer({ storage });

// Upload profile image
router.post('/profile/upload', isAuthenticated, upload.single('profileImage'), async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) throw new Error('User not found');

    user.profileImage = `/uploads/profiles/${req.file.filename}`;
    await user.save();

    // Update session
    req.session.user.profileImage = user.profileImage;

    req.flash('success_msg', 'Profile image updated successfully!');
    res.redirect('/user/profile');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to upload profile image');
    res.redirect('/user/profile');
  }
});

// ------------------ User Dashboard ------------------//
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.user._id }).populate('items.product');
    const returns = orders.filter(o => o.status === 'Return Requested');

    res.render('user-dashboard', { 
      user: req.session.user, 
      active: 'user',
      orders, 
      returns 
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Unable to load dashboard');
    res.redirect('/');
  }
});


// Profile page
router.get('/profile', isAuthenticated, userController.profile);


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
