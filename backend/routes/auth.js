// ============================================================
// routes/auth.js
// ============================================================
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

router.post('/register', validate(schemas.registerSchema), authController.register);
router.post('/login', validate(schemas.loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;
