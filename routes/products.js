const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// 🏠 Home page — shows categories & featured products
router.get('/home', productController.home);

// 🛍️ Shop page — with search & category filter
router.get('/', productController.listProducts);

// 👁️ Single product view
router.get('/:id', productController.viewProduct);

module.exports = router;
