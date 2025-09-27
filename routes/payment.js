const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');

const Order = require('../models/Order');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ------------------ Checkout page ------------------
router.get('/checkout', (req, res) => {
  if (!req.session.cart || req.session.cart.length === 0) {
    req.flash('error_msg', 'Your cart is empty.');
    return res.redirect('/cart');
  }

  const cart = req.session.cart;
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  res.render('checkout', {
    cart,
    totalAmount,
    razorpayKey: process.env.RAZORPAY_KEY_ID
  });
});

// ------------------ Create Razorpay order ------------------
router.post('/create-order', async (req, res) => {
  try {
    const cart = req.session.cart || [];
    if (!cart.length) return res.status(400).json({ error: 'Cart is empty' });

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    // Create preliminary Order in DB
    const order = await Order.create({
      user: req.session.user._id,
      items: cart.map(c => ({
        product: c._id,
        quantity: c.qty,
        price: c.price
      })),
      totalAmount,
      shippingAddress: req.body, // capture customer address here
      billing: req.body,
      status: 'Pending',
      paymentStatus: 'Pending'
    });

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: 'INR',
      receipt: `order_rcptid_${order._id}`
    });

    // Save Razorpay order ID in DB
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.json(razorpayOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});


// ------------------ Verify payment ------------------
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, addressData } = req.body;

    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.render('payment-verification', {
        payment: { success: false, message: 'Payment verification failed' }
      });
    }

    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id }).populate('user');
    if (!order) throw new Error('Order not found');

    order.paymentStatus = 'Paid';
    order.status = 'Processing';
    await order.save();

    // Shiprocket integration
    const token = await authenticate(); // from your shiprocket service
    const shipmentPayload = {
      order_id: order._id.toString(),
      order_date: new Date(),
      pickup_location: 'Primary',
      billing_customer_name: addressData.name,
      billing_address: addressData.address,
      billing_city: addressData.city,
      billing_state: addressData.state,
      billing_pincode: addressData.pincode,
      billing_phone: addressData.phone,
      shipping_is_billing: true,
      order_items: order.items.map(i => ({
        name: i.product.name,
        sku: i.product._id,
        units: i.quantity,
        selling_price: i.price
      })),
      payment_method: 'Prepaid',
      sub_total: order.totalAmount,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5
    };

    const resShip = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
      shipmentPayload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { awb_code, courier_company_id } = resShip.data;
    order.awbNumber = awb_code;
    order.courierPartner = courier_company_id;
    order.trackingUrl = `https://shiprocket.co/tracking/${awb_code}`;
    await order.save();

    await mailService.sendOrderConfirmation(req.session.user, order);

    req.session.cart = []; // clear cart

    res.render('payment-verification', { payment: { success: true, orderId: order._id, amount: order.totalAmount } });

  } catch (err) {
    console.error(err);
    res.render('payment-verification', { payment: { success: false, message: err.message } });
  }
});

module.exports = router;
