// ─── routes/loans.js ─────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

router.use(protect);
router.get('/dashboard', loanController.getDashboardStats);
router.get('/', loanController.getLoans);
router.get('/:id', loanController.getLoan);
router.post('/', validate(schemas.loanSchema), loanController.createLoan);
router.put('/:id', loanController.updateLoan);
router.delete('/:id', loanController.deleteLoan);

module.exports = router;
