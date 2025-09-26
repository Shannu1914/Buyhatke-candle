const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

router.post("/shiprocket", orderController.handleShiprocketWebhook);

module.exports = router;
