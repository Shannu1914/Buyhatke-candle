const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Product list with optional search
router.get('/', async (req, res) => {
  try {
    const search = req.query.search || '';
    let query = {};

    if (search) {
      query = { name: { $regex: search, $options: 'i' } }; // case-insensitive search
    }

    const products = await Product.find(query);

    res.render('product-list', {
      products,
      search,
      user: req.session.user || null,
      active: 'products'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ✅ Product detail page
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error_msg', 'Product not found');
      return res.redirect('/products');
    }

    res.render('product-view', {
      product,
      user: req.session.user || null,
      active: 'products'
    });

  } catch (err) {
    console.error('Error loading product detail:', err);
    req.flash('error_msg', 'Error loading product');
    res.redirect('/products');
  }
});

module.exports = router;
