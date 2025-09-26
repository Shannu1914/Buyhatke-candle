const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: Number,
  price: Number
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [orderItemSchema],
  totalAmount: Number, // ⚠️ Use totalAmount everywhere instead of total
  billing: {
    name: String,
    email: String,
    address: String,
    city: String,
    pincode: String,
    state: String
  },
  shippingAddress: {  // ⚠️ Required for Shiprocket
    name: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    phone: String
  },
  paymentMethod: { type: String, enum: ['COD', 'Prepaid'], default: 'COD' },
  status: { type: String, default: 'Pending' }, 
  paymentStatus: { type: String, default: 'Pending' }, 
  razorpayOrderId: String,
  stripePaymentIntentId: String,

  // Shiprocket integration fields
  awbNumber: String,
  courierPartner: String,
  trackingUrl: String
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
