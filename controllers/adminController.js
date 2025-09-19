const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Admin Dashboard
exports.dashboard = async (req, res) => {
  const stats = {
    users: await User.countDocuments(),
    products: await Product.countDocuments(),
    orders: await Order.countDocuments(),
    pendingOrders: await Order.countDocuments({ status: 'pending' }),
  };

  res.render('admin/dashboard', { stats });
};

// List all users
exports.listUsers = async (req, res) => {
  const users = await User.find();
  res.render('admin/users', { users });
};

// List all products
exports.listProducts = async (req, res) => {
  const products = await Product.find();
  res.render('admin/products', { products });
};

// Add new product
exports.addProduct = async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;
    const image = req.file ? `/uploads/products/${req.file.filename}` : null;

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
    console.error(err);
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
    console.error(err);
    req.flash('error_msg', 'Error deleting product.');
    res.redirect('/admin/products');
  }
};

// List all orders
exports.listOrders = async (req, res) => {
  const orders = await Order.find().populate('user').populate('items.product');
  res.render('admin/orders', { orders });
};

// Update order status (pending → shipped → delivered → returned/refunded)
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      req.flash('error_msg', 'Order not found.');
      return res.redirect('/admin/orders');
    }

    order.status = req.body.status; // e.g., shipped/delivered/refunded
    await order.save();

    req.flash('success_msg', `Order marked as ${order.status}`);
    res.redirect('/admin/orders');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating order.');
    res.redirect('/admin/orders');
  }
};
