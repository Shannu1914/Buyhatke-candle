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
      search, // ✅ pass search to EJS
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
