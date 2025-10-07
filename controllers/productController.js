const Product = require('../models/Product');
const Category = require('../models/Category');

// 🏠 HOME PAGE — Group products by category
exports.home = async (req, res) => {
  try {
    const categories = await Category.find().lean();
    const products = await Product.find().lean();

    // Group products by category
    const productsByCategory = {};
    categories.forEach(cat => {
      productsByCategory[cat.name] = products.filter(p => p.category === cat.name);
    });

    res.render('index', {
      categories,
      productsByCategory,
      user: req.session.user
    });
  } catch (err) {
    console.error('Home page error:', err);
    res.render('index', {
      categories: [],
      productsByCategory: {},
      user: req.session.user
    });
  }
};

// 🛍️ SHOP PAGE — With search + category filter
exports.listProducts = async (req, res) => {
  try {
    const q = req.query.search?.trim() || '';
    const selectedCategory = req.query.category?.trim() || '';

    // Fetch categories for the dropdown
    const categories = await Category.find().lean();

    // Build filter object
    const filter = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (selectedCategory) filter.category = selectedCategory;

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.render('product-list', {
      products,
      search: q,
      categories,
      selectedCategory,
      user: req.session.user
    });
  } catch (err) {
    console.error('List products error:', err);
    res.status(500).render('error', { error: err });
  }
};

// 👁️ VIEW SINGLE PRODUCT
exports.viewProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).render('error', {
        error: { message: 'Product not found' }
      });
    }

    res.render('product-view', {
      product,
      user: req.session.user
    });
  } catch (err) {
    console.error('View product error:', err);
    res.status(500).render('error', { error: err });
  }
};
