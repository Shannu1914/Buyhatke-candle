const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: Number,
  price: Number
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [orderItemSchema],
  totalAmount: Number,
  billing: {
    name: String,
    email: String,
    address: String,
    city: String,
    pincode: String
  },
  status: { type: String, default: 'Pending' }, // Pending, Shipped, Delivered, Cancelled, Returned, Refunded
  paymentStatus: { type: String, default: 'Pending' }, // Pending, Paid, Failed, Refunded
  stripePaymentIntentId: String
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
