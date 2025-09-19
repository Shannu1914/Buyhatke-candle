const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { isAuthenticated, isAdmin } = require('../Middleware/authMiddleware');

router.get('/', isAuthenticated, orderController.checkoutPage);
router.post('/pay', isAuthenticated, orderController.createPayment);

// webhook: configure raw body parsing in app.js for this path
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), orderController.stripeWebhook);

module.exports = router;
