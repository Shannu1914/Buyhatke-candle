const Product = require('../models/Product');

function initCart(req) {
  if (!req.session.cart) {
    req.session.cart = { items: [], total: 0 };
  }
}

// Add to cart
exports.addToCart = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error_msg', 'Product not found');
      return res.redirect('/shop');
    }
    const qty = parseInt(req.body.quantity || '1', 10);
    initCart(req);

    const existing = req.session.cart.items.find(i => i.product._id.toString() === product._id.toString());
    if (existing) {
      existing.quantity += qty;
    } else {
      req.session.cart.items.push({
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.image
        },
        quantity: qty
      });
    }
    // recompute total
    req.session.cart.total = req.session.cart.items.reduce((sum, it) => sum + it.product.price * it.quantity, 0);

    req.flash('success_msg', 'Added to cart');
    res.redirect('back');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error adding to cart');
    res.redirect('/shop');
  }
};

exports.viewCart = (req, res) => {
  const cart = req.session.cart || { items: [], total: 0 };
  res.render('cart', { cart, user: req.session.user });
};

exports.removeFromCart = (req, res) => {
  initCart(req);
  req.session.cart.items = req.session.cart.items.filter(i => i.product._id.toString() !== req.params.id);
  req.session.cart.total = req.session.cart.items.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
  req.flash('success_msg', 'Removed from cart');
  res.redirect('/cart');
};

exports.clearCart = (req) => {
  req.session.cart = { items: [], total: 0 };
};
