const transporter = require("../config/mail");
const templates = require("../utils/mailTemplates");

exports.sendMail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Buy Hatke Candles" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("✅ Email sent to", to);
  } catch (err) {
    console.error("❌ Email error:", err);
  }
};

exports.sendOrderConfirmation = (user, order) =>
  this.sendMail(user.email, "Order Confirmation - Buy Hatke Candles", templates.orderConfirmation(user, order));

exports.sendOrderShipped = (user, order) =>
  this.sendMail(user.email, "Your Order is Shipped!", templates.orderShipped(user, order));

exports.sendOrderDelivered = (user, order) =>
  this.sendMail(user.email, "Your Order is Delivered!", templates.orderDelivered(user, order));

exports.sendReturnRequest = (user, order) =>
  this.sendMail(user.email, "Return/Refund Request", templates.returnRequest(user, order));
