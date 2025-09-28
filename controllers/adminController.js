const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Admin Dashboard
exports.dashboard = async (req, res) => {
  try {
    const stats = {
      users: await User.countDocuments(),
      products: await Product.countDocuments(),
      orders: await Order.countDocuments(),
      pendingOrders: await Order.countDocuments({ status: 'pending' }),
    };

    res.render('admin/dashboard', { stats, user: req.session.user });
  } catch (err) {
    console.error('Error loading dashboard:', err);
    req.flash('error_msg', 'Failed to load dashboard');
    res.redirect('/');
  }
};

exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().lean();
    res.render('admin/users', {
      users,
      user: req.session.user,   
      active: 'manageUsers'     
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load users');
    res.redirect('/admin');
  }
};

// Products Page
exports.listProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.render('admin/products', { products, user: req.session.user,  active: 'manageProducts' });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load products');
    res.redirect('/admin');
  }
};

// Add new product
exports.addProduct = async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;
    const image = req.file ? req.file.filename : null;

    const product = new Product({
      name,
      description,
      price,
      stock,
      image,
    });

    await product.save();
    req.flash('success_msg', 'Product added successfully!');
    res.redirect('/admin/products');
  } catch (err) {
    console.error('Error adding product:', err);
    req.flash('error_msg', 'Error adding product.');
    res.redirect('/admin/products');
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Product deleted successfully!');
    res.redirect('/admin/products');
  } catch (err) {
    console.error('Error deleting product:', err);
    req.flash('error_msg', 'Error deleting product.');
    res.redirect('/admin/products');
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    // Prevent admin from deleting themselves
    if (req.session.user._id === userId) {
      req.flash('error_msg', 'You cannot delete yourself.');
      return res.redirect('/admin/users');
    }

    await User.findByIdAndDelete(userId);
    req.flash('success_msg', 'User deleted successfully!');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Error deleting user:', err);
    req.flash('error_msg', 'Error deleting user.');
    res.redirect('/admin/users');
  }
};

// Orders Page
exports.listOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user').populate('items.product');
    res.render('admin/orders', { orders, user: req.session.user });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load orders');
    res.redirect('/admin');
  }
};

// Update order status (pending → shipped → delivered → returned/refunded)
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      req.flash('error_msg', 'Order not found.');
      return res.redirect('/admin/orders');
    }

    order.status = req.body.status;
    await order.save();

    req.flash('success_msg', `Order marked as ${order.status}`);
    res.redirect('/admin/orders');
  } catch (err) {
    console.error('Error updating order status:', err);
    req.flash('error_msg', 'Error updating order.');
    res.redirect('/admin/orders');
  }
};
