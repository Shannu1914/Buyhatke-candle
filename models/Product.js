const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: false },
  description: String,
  category: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  image: String, // filename in /public/uploads/products
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });


module.exports = mongoose.model('Product', productSchema);
