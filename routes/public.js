const express = require('express');
const router = express.Router();
const Article = require('../models/article');

// Route to show articles
router.get('/articles', async (req, res) => {
  try {
    const articles = await Article.find({ status: 'approved' }).sort({ createdAt: -1 });
    res.render('articles', { articles, user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Route to show public documents
router.get('/documents', async (req, res) => {
  try {
    const articles = await Article.find({ status: 'approved' });
    res.render('public-documents', { articles });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
