const Product = require('../models/Product');

exports.listProducts = async (req, res) => {
  try {
    const q = req.query.search || '';
    const filter = q ? { name: { $regex: q, $options: 'i' } } : {};
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.render('product-list', { products, search: q, user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { error: err });
  }
};

exports.viewProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).render('error', { error: { message: 'Product not found' } });
    res.render('product-view', { product, user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { error: err });
  }
};
