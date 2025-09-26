exports.orderConfirmation = (user, order) => `
  <h2>Hi ${user.name},</h2>
  <p>Thank you for your order at <b>Buy Hatke Candles</b>!</p>
  <p><strong>Order ID:</strong> ${order._id}</p>
  <p><strong>Total:</strong> ₹${order.total}</p>
  <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
  <p>We’ll notify you when your order is shipped.</p>
  <br>
  <p>❤️ Team Buy Hatke</p>
`;

exports.orderShipped = (user, order) => `
  <h2>Your Order is on the way! 🚚</h2>
  <p>Hi ${user.name}, your order <b>${order._id}</b> has been shipped.</p>
  <p><strong>Status:</strong> ${order.status}</p>
  <p>Track it from your dashboard.</p>
  <br>
  <p>❤️ Team Buy Hatke</p>
`;

exports.orderDelivered = (user, order) => `
  <h2>Order Delivered ✅</h2>
  <p>Hi ${user.name}, your order <b>${order._id}</b> has been delivered.</p>
  <p>We hope you enjoy your candles 🕯️</p>
  <br>
  <p>❤️ Team Buy Hatke</p>
`;

exports.returnRequest = (user, order) => `
  <h2>Return/Refund Request Received</h2>
  <p>Hi ${user.name}, we have received your request for order <b>${order._id}</b>.</p>
  <p>Our team will review and get back to you soon.</p>
  <br>
  <p>❤️ Team Buy Hatke</p>
`;
