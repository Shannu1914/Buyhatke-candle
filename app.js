const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const dotenv = require('dotenv');
const flash = require('connect-flash');
const fileUpload = require('express-fileupload');
const { SitemapStream, streamToPromise } = require('sitemap');
const webhookRoutes = require("./routes/webhook");

const Product = require('./models/Product');

dotenv.config();

const app = express();

// ------------------ DB CONNECTION ------------------
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ DB Error:', err));

// ------------------ MIDDLEWARE ------------------
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(fileUpload());

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions',
    }),
  })
);

// Flash messages and user for templates
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.session.user || null; 
  res.locals.active = '';
  next();
});

// ------------------ ROUTES ------------------
app.use('/', require('./routes/auth'));        // login/register/logout
app.use('/products', require('./routes/products')); // product list & details
app.use('/cart', require('./routes/cart'));    // shopping cart
app.use('/user', require('./routes/user'));    // user dashboard/orders
app.use('/admin', require('./routes/admin'));  // admin dashboard/products
app.use('/payment', require('./routes/payment')); // checkout & stripe
app.use("/webhook", webhookRoutes);


// Static pages
app.get('/about', (req, res) => res.render('about', { active: 'about', user: req.session.user }));
app.get('/contact', (req, res) => res.render('contact', { user: req.session.user, active: 'contact' }));
app.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.render('index', { products, user: req.session.user, active: 'home' });
  } catch (err) {
    console.error(err);
    res.render('index', { products: [], user: req.session.user, active: 'home' });
  }
});

// ------------------ SITEMAP ------------------
app.get('/sitemap.xml', async (req, res) => {
  try {
    res.header('Content-Type', 'application/xml');
    const sitemap = new SitemapStream({
      hostname: 'https://buyhatke-candles.onrender.com',
    });

    sitemap.write({ url: '/', changefreq: 'daily', priority: 1.0 });
    sitemap.write({ url: '/shop', changefreq: 'weekly', priority: 0.8 });
    sitemap.write({ url: '/about', changefreq: 'monthly', priority: 0.6 });
    sitemap.write({ url: '/contact', changefreq: 'yearly', priority: 0.3 });
    sitemap.end();

    const xml = await streamToPromise(sitemap);
    res.send(xml.toString());
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

// Robots.txt
app.use('/robots.txt', express.static(path.join(__dirname, 'robots.txt')));

// ------------------ START SERVER ------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
