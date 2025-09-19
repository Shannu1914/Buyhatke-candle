const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET all products → product-list.ejs
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.render('product-list', { products });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading products');
    res.redirect('/');
  }
});

// GET single product → product-view.ejs
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error_msg', 'Product not found');
      return res.redirect('/shop');
    }
    res.render('product-view', { product });
  } catch (err) {
    console.error(err);
    res.redirect('/shop');
  }
});

module.exports = router;
