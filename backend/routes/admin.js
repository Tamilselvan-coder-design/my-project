const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('admin'));

router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find().select('-password -refreshTokens').sort({ createdAt: -1 });
    res.json({ success: true, data: { users, total: users.length } });
  } catch (err) { next(err); }
});

router.put('/users/:id/deactivate', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.json({ success: true, message: `User ${user.email} deactivated` });
  } catch (err) { next(err); }
});

router.get('/stats', async (req, res, next) => {
  try {
    const [userCount, loanCount, txCount] = await Promise.all([
      User.countDocuments(), Loan.countDocuments(),
      Transaction.countDocuments({ status: 'success' }),
    ]);
    res.json({ success: true, data: { users: userCount, loans: loanCount, transactions: txCount } });
  } catch (err) { next(err); }
});

module.exports = router;
