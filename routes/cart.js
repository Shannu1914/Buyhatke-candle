const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { isAuthenticated } = require('../Middleware/authMiddleware');

router.get('/', cartController.viewCart);
router.post('/add/:id', isAuthenticated, cartController.addToCart);
router.post('/remove/:id', isAuthenticated, cartController.removeFromCart);

module.exports = router;
