const Order = require('../models/Order');
const Product = require('../models/Product');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { authenticate } = require("../services/shiprocket");
const mailService = require('../services/mailService');
const User = require('../models/User');
const axios = require("axios");
const dotenv = require('dotenv');
dotenv.config(); // load .env


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

exports.placeOrder = async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress, paymentMethod } = req.body;

    // 1️⃣ Save order in MongoDB
    const order = await Order.create({
      user: req.session.user._id,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid"
    });

    // 2️⃣ Authenticate with Shiprocket
    const token = await authenticate();

    // 3️⃣ Create Shipment in Shiprocket
    const shipmentPayload = {
      order_id: order._id.toString(),
      order_date: new Date(),
      pickup_location: "Primary", // set in Shiprocket panel
      billing_customer_name: shippingAddress.name,
      billing_last_name: "",
      billing_address: shippingAddress.address,
      billing_city: shippingAddress.city,
      billing_pincode: shippingAddress.pincode,
      billing_state: shippingAddress.state,
      billing_country: "India",
      billing_email: req.session.user.email,
      billing_phone: shippingAddress.phone,
      shipping_is_billing: true,
      order_items: items.map(i => ({
        name: i.product.name,
        sku: i.product._id,
        units: i.quantity,
        selling_price: i.price,
      })),
      payment_method: paymentMethod === "COD" ? "COD" : "Prepaid",
      sub_total: totalAmount,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5
    };

    const resShip = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      shipmentPayload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { shipment_id, awb_code, courier_company_id } = resShip.data;

    // 4️⃣ Save AWB & tracking in DB
    order.awbNumber = awb_code;
    order.courierPartner = courier_company_id;
    order.trackingUrl = `https://shiprocket.co/tracking/${awb_code}`;
    await order.save();

    await mailService.sendOrderConfirmation(req.session.user, order);

    res.redirect(`/orders/${order._id}`);
  } catch (err) {
    console.error("Order Placement Error:", err.response?.data || err);
    res.status(500).send("Error placing order");
  }
};


// Render checkout page
exports.checkoutPage = (req, res) => {
  const cart = req.session.cart || { items: [], total: 0 };
  if (!req.session.user) {
    req.flash('error_msg', 'Please log in to checkout');
    return res.redirect('/login');
  }
  res.render('checkout', { cart, user: req.session.user });
};

// Create Razorpay payment order
exports.createPayment = async (req, res) => {
  try {
    const cart = req.session.cart;
    if (!cart || cart.items.length === 0) {
      req.flash('error_msg', 'Cart is empty');
      return res.redirect('/cart');
    }

    // Build order items
    const items = cart.items.map(it => ({
      product: it.product._id,
      quantity: it.quantity,
      price: it.product.price
    }));

    // Create Order in DB with pending payment
    const order = new Order({
      user: req.session.user._id,
      items,
      totalAmount: cart.total,
      billing: {
        name: req.body.name,
        email: req.body.email,
        address: req.body.address,
        city: req.body.city,
        pincode: req.body.pincode
      },
      status: 'Pending',
      paymentStatus: 'Pending'
    });
    await order.save();

    // Create Razorpay order
    const options = {
      amount: Math.round(cart.total * 100), // in paise
      currency: "INR",
      receipt: `order_rcptid_${order._id}`,
    };

    const paymentOrder = await razorpay.orders.create(options);
    order.razorpayOrderId = paymentOrder.id;
    await order.save();

    // Send order info to frontend for Razorpay checkout
    res.render('payment-verification', {
      payment: {
        orderId: order._id,
        razorpayOrderId: paymentOrder.id,
        amount: cart.total,
        currency: 'INR'
      },
      user: req.session.user
    });

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Payment creation failed');
    res.redirect('/checkout');
  }
};

// Verify Razorpay payment
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) throw new Error('Order not found');

    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      throw new Error('Payment verification failed');
    }

    // Payment successful
    order.paymentStatus = 'Paid';
    order.status = 'Pending'; // admin will update to shipped
    await order.save();

    // Clear cart
    req.session.cart = [];

    res.render('payment-success', { order, user: req.session.user });

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Payment verification failed');
    res.redirect('/checkout');
  }
};

// User order list
exports.userOrders = async (req, res) => {
  const orders = await Order.find({ user: req.session.user._id }).populate('items.product').sort({ createdAt: -1 });
  res.render('user-dashboard', { user: req.session.user, orders, returns: [] });
};

// Admin: update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user");
    if (!order) {
      req.flash("error_msg", "Order not found");
      return res.redirect("/admin/orders");
    }

    // update status
    order.status = req.body.status;
    await order.save();

    // ✅ Send emails based on status
    const user = order.user;
    if (order.status === "Shipped") {
      await mailService.sendOrderShipped(order.user, order);
    }
    if (order.status === "Delivered") {
      await mailService.sendOrderDelivered(order.user, order);
    }
    if (order.status === "Cancelled") {
      await mailService.sendMail(
       order.user.email,
        "Your Order has been Cancelled",
        `<h2>Hi ${order.user.name},</h2><p>Your order <b>${order._id}</b> has been cancelled.</p>`
      );
    }

    req.flash("success_msg", "Order status updated & customer notified");
    res.redirect("/admin/orders");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to update order status");
    res.redirect("/admin/orders");
  }
};

module.exports.handleShiprocketWebhook = async (req, res) => {
  try {
    const { awb, status } = req.body; // depends on Shiprocket payload
    const order = await Order.findOne({ awbNumber: awb }).populate("user");

    if (!order) return res.status(404).send("Order not found");

    order.status = status;
    await order.save();

    // Send emails automatically
    if (status === "Shipped") {
      await mailService.sendOrderShipped(order.user, order);
    }
    if (status === "Delivered") {
      await mailService.sendOrderDelivered(order.user, order);
    }
    if (status === "Cancelled") {
      await mailService.sendOrderCancelled(order.user, order);
    }

    res.status(200).send("Webhook processed");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Server error");
  }
};