const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/advice', aiController.getAdvice);
router.post('/chat', aiController.chat);
router.get('/credit-score', aiController.getCreditScore);

module.exports = router;
