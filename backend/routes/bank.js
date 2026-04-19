// ─── routes/bank.js ──────────────────────────────────────────────────────────
const express = require('express');
const bankRouter = express.Router();
const bankService = require('../services/bankService');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

bankRouter.use(protect);
bankRouter.get('/', bankService.getBankAccounts);
bankRouter.post('/', validate(schemas.bankAccountSchema), bankService.addBankAccount);
bankRouter.put('/:id/sync', bankService.syncBankAccount);
bankRouter.get('/transactions', bankService.getTransactions);
bankRouter.delete('/:id', bankService.deleteBankAccount);

module.exports = bankRouter;
