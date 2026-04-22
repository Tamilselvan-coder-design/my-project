// ─── routes/lending.js ─────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const lendingController = require('../controllers/lendingController');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

router.use(protect);

router.get('/dashboard', lendingController.getDashboardStats);
router.get('/', lendingController.getLendings);
router.get('/:id', lendingController.getLending);
router.post('/', validate(schemas.lendingSchema), lendingController.createLending);
router.put('/:id', lendingController.updateLending);
router.delete('/:id', lendingController.deleteLending);
router.post('/:id/payments', lendingController.recordPayment);

module.exports = router;