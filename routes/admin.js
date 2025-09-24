const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../Middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Multer storage for product images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'uploads', 'products'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});
const upload = multer({ storage });

// Debug session route
router.get('/check-session', (req, res) => {
  console.log('Session User:', req.session.user);
  res.send(req.session.user ? `Logged in as ${req.session.user.role}` : 'Not logged in');
});

// Admin Dashboard
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const search = req.query.search || ''; // ✅ define search here

    const stats = {
      users: await User.countDocuments(),
      products: await Product.countDocuments(),
      orders: await Order.countDocuments(),
      pendingOrders: await Order.countDocuments({ status: 'Pending' }),
    };

    const users = await User.find().lean();
    const products = await Product.find().lean();
    const orders = await Order.find().populate('user').lean();

    res.render('admin/dashboard', {
      stats,
      users,
      products,
      orders,
      user: req.session.user,
      active: 'admin',
      search // ✅ now search is defined
    });
  } catch (err) {
    console.error('Error loading admin dashboard:', err);
    req.flash('error_msg', 'Failed to load dashboard');
    res.redirect('/');
  }
});

// Product routes
router.get('/products', isAuthenticated, isAdmin, adminController.listProducts); // list products
router.post('/products/add', isAuthenticated, isAdmin, upload.single('image'), adminController.addProduct);
router.post('/products/delete/:id', isAuthenticated, isAdmin, adminController.deleteProduct);

// User management routes
router.get('/users', isAuthenticated, isAdmin, adminController.listUsers); // list users
router.post('/users/promote/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.redirect('/admin/users');
    user.isAdmin = true;
    await user.save();
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/users');
  }
});
router.post('/users/delete/:id', isAuthenticated, isAdmin, adminController.deleteUser);
// Toggle admin status
router.post('/users/toggle-admin/:id', isAuthenticated, isAdmin, async (req, res) => {
  const User = require('../models/User'); // make sure User model is imported
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.redirect('/admin/users');

    user.isAdmin = !user.isAdmin; // toggle admin
    await user.save();

    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/users');
  }
});

// Order management routes
router.get('/orders', isAuthenticated, isAdmin, adminController.listOrders); // list orders
router.post('/orders/:id/update', isAuthenticated, isAdmin, adminController.updateOrderStatus || ((req,res)=>res.redirect('/admin')));

module.exports = router;
