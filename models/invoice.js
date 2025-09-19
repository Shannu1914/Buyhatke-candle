const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  articleId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', invoiceSchema);