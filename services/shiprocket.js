const axios = require("axios");

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;
let token = null;

async function authenticate() {
  if (token) return token; // reuse token

  const res = await axios.post("https://apiv2.shiprocket.in/v1/external/auth/login", {
    email: SHIPROCKET_EMAIL,
    password: SHIPROCKET_PASSWORD,
  });
  token = res.data.token;
  return token;
}

module.exports = { authenticate };
