const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../Middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'uploads', 'products'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});
const upload = multer({ storage });

router.get('/', isAuthenticated, isAdmin, adminController.dashboard);
router.post('/products/add', isAuthenticated, isAdmin, upload.single('image'), adminController.addProduct);
router.post('/products/delete/:id', isAuthenticated, isAdmin, adminController.deleteProduct);

// order status update route
router.post('/orders/:id/update', isAuthenticated, isAdmin, adminController.updateOrderStatus || ((req,res)=>res.redirect('/admin')));

module.exports = router;
