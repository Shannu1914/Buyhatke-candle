const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: false },
  description: String,
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  image: String, // filename in /public/uploads/products
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
