const Product = require('../models/Product');
const Category = require('../models/Category');

exports.home = async (req, res) => {
  try {
    const categories = await Category.find().lean();
    const products = await Product.find().lean();

    // Group products by category
    const productsByCategory = {};
    categories.forEach(cat => {
      productsByCategory[cat.name] = products.filter(p => p.category === cat.name);
    });

    res.render('index', { categories, productsByCategory, user: req.session.user });
  } catch (err) {
    console.error(err);
    res.render('index', { categories: [], productsByCategory: {}, user: req.session.user });
  }
};

exports.listProducts = async (req, res) => {
  try {
    const q = req.query.search || '';
    const selectedCategory = req.query.category || '';

    // Fetch categories for the dropdown
    const categories = await Category.find().lean();

    // Build filter
    let filter = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (selectedCategory) filter.category = selectedCategory;

    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();

    res.render('product-list', {
      products,
      search: q,
      categories,
      selectedCategory,
      user: req.session.user
    });
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
