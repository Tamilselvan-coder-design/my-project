const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Webhook must come before protect (uses raw body)
router.post('/webhook', paymentController.webhook);

router.use(protect);
router.post('/order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);
router.get('/transactions', paymentController.getTransactions);

module.exports = router;
