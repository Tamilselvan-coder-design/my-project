// ─── routes/notifications.js ─────────────────────────────────────────────────
const express = require('express');
const notifRouter = express.Router();
const { protect } = require('../middleware/auth');
const { Notification } = require('../models/BankAccount');

notifRouter.use(protect);

notifRouter.get('/', async (req, res, next) => {
  try {
    const { unread } = req.query;
    const filter = { user: req.user._id };
    if (unread === 'true') filter.isRead = false;
    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (err) { next(err); }
});

notifRouter.put('/:id/read', async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true });
    res.json({ success: true });
  } catch (err) { next(err); }
});

notifRouter.put('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
});

notifRouter.delete('/:id', async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = notifRouter;


// ─── routes/users.js ─────────────────────────────────────────────────────────
const userRouter = express.Router();
const User = require('../models/User');
const { validate, schemas } = require('../middleware/validation');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const PDFDocument = require('pdfkit');

userRouter.use(protect);

userRouter.get('/profile', async (req, res) => {
  res.json({ success: true, data: { user: req.user.toSafeJSON() } });
});

userRouter.put('/profile', validate(schemas.profileSchema), async (req, res, next) => {
  try {
    const updated = await User.findByIdAndUpdate(req.user._id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: { user: updated.toSafeJSON() }, message: 'Profile updated' });
  } catch (err) { next(err); }
});

userRouter.get('/activity-log', async (req, res) => {
  res.json({ success: true, data: { logs: req.user.activityLog.slice(-20).reverse() } });
});

userRouter.get('/sessions', async (req, res) => {
  const sessions = req.user.refreshTokens.map(t => ({
    deviceInfo: t.deviceInfo,
    ipAddress: t.ipAddress,
    createdAt: t.createdAt,
    expiresAt: t.expiresAt,
  }));
  res.json({ success: true, data: { sessions } });
});

// Export PDF report
userRouter.get('/export-report', async (req, res, next) => {
  try {
    const [loans, transactions] = await Promise.all([
      Loan.find({ user: req.user._id }),
      Transaction.find({ user: req.user._id, status: 'success' }).sort({ createdAt: -1 }).limit(20),
    ]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="debt-report-${Date.now()}.pdf"`);

    // Simple PDF without pdfkit dependency for now - return JSON report
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
      recentTransactions: transactions.map(t => ({ amount: t.amount, description: t.description, date: t.createdAt, status: t.status })),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="debt-report-${Date.now()}.json"`);
    res.json(report);
  } catch (err) { next(err); }
});

module.exports = { notifRouter, userRouter };


// ─── routes/admin.js ─────────────────────────────────────────────────────────
const adminRouter = express.Router();
const { restrictTo } = require('../middleware/auth');

adminRouter.use(protect, restrictTo('admin'));

adminRouter.get('/users', async (req, res, next) => {
  try {
    const users = await User.find().select('-password -refreshTokens').sort({ createdAt: -1 });
    res.json({ success: true, data: { users, total: users.length } });
  } catch (err) { next(err); }
});

adminRouter.put('/users/:id/deactivate', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.json({ success: true, message: `User ${user.email} deactivated` });
  } catch (err) { next(err); }
});

adminRouter.get('/stats', async (req, res, next) => {
  try {
    const [userCount, loanCount, txCount] = await Promise.all([
      User.countDocuments(),
      Loan.countDocuments(),
      Transaction.countDocuments({ status: 'success' }),
    ]);
    res.json({ success: true, data: { users: userCount, loans: loanCount, transactions: txCount } });
  } catch (err) { next(err); }
});

module.exports = adminRouter;
