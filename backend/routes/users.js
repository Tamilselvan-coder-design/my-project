const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

router.use(protect);

router.get('/profile', (req, res) => res.json({ success: true, data: { user: req.user.toSafeJSON() } }));

router.put('/profile', validate(schemas.profileSchema), async (req, res, next) => {
  try {
    const updated = await User.findByIdAndUpdate(req.user._id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: { user: updated.toSafeJSON() }, message: 'Profile updated' });
  } catch (err) { next(err); }
});

router.get('/activity-log', (req, res) => {
  res.json({ success: true, data: { logs: req.user.activityLog.slice(-20).reverse() } });
});

router.get('/sessions', (req, res) => {
  const sessions = req.user.refreshTokens.map(t => ({
    deviceInfo: t.deviceInfo, ipAddress: t.ipAddress,
    createdAt: t.createdAt, expiresAt: t.expiresAt,
  }));
  res.json({ success: true, data: { sessions } });
});

router.get('/export-report', async (req, res, next) => {
  try {
    const [loans, transactions] = await Promise.all([
      Loan.find({ user: req.user._id }),
      Transaction.find({ user: req.user._id, status: 'success' }).sort({ createdAt: -1 }).limit(20),
    ]);
    const report = {
      generatedAt: new Date().toISOString(),
      user: { name: req.user.name, email: req.user.email },
      summary: {
        totalLoans: loans.length,
        totalDebt: loans.filter(l => l.status === 'active').reduce((s, l) => s + (l.remainingBalance || 0), 0),
        totalPaid: loans.reduce((s, l) => s + l.totalPaid, 0),
        monthlyEMI: loans.filter(l => l.status === 'active').reduce((s, l) => s + l.emi, 0),
      },
      loans: loans.map(l => ({ name: l.name, type: l.type, principal: l.principal, emi: l.emi, status: l.status, progress: l.progressPercent })),
      recentTransactions: transactions.map(t => ({ amount: t.amount, description: t.description, date: t.createdAt })),
    };
    res.setHeader('Content-Disposition', `attachment; filename="report-${Date.now()}.json"`);
    res.json(report);
  } catch (err) { next(err); }
});

module.exports = router;
