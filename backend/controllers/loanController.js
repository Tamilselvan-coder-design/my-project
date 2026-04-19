const Loan = require('../models/Loan');
const { calculateEMI, calculateRemainingBalance } = require('../utils/emiCalculator');

// ─── Get All Loans ────────────────────────────────────────────────────────────
exports.getLoans = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const loans = await Loan.find(filter).sort({ createdAt: -1 });

    // Compute summary
    const totalDebt = loans.filter(l => l.status === 'active').reduce((s, l) => s + (l.remainingBalance || l.principal), 0);
    const monthlyEMI = loans.filter(l => l.status === 'active').reduce((s, l) => s + l.emi, 0);

    res.json({
      success: true,
      data: { loans, summary: { totalDebt, monthlyEMI, totalLoans: loans.length } },
    });
  } catch (err) { next(err); }
};

// ─── Get Single Loan ──────────────────────────────────────────────────────────
exports.getLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, user: req.user._id });
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    res.json({ success: true, data: { loan } });
  } catch (err) { next(err); }
};

// ─── Create Loan ──────────────────────────────────────────────────────────────
exports.createLoan = async (req, res, next) => {
  try {
    const { principal, interestRate, tenureMonths, ...rest } = req.body;

    const emi = calculateEMI(principal, interestRate, tenureMonths);
    const remainingBalance = principal;

    const loan = await Loan.create({
      user: req.user._id,
      principal,
      interestRate,
      tenureMonths,
      emi,
      remainingBalance,
      ...rest,
    });

    res.status(201).json({ success: true, data: { loan }, message: 'Loan added successfully' });
  } catch (err) { next(err); }
};

// ─── Update Loan ──────────────────────────────────────────────────────────────
exports.updateLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, user: req.user._id });
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

    // Recalculate EMI if financial params changed
    const { principal, interestRate, tenureMonths } = req.body;
    if (principal || interestRate || tenureMonths) {
      const p = principal || loan.principal;
      const r = interestRate ?? loan.interestRate;
      const t = tenureMonths || loan.tenureMonths;
      req.body.emi = calculateEMI(p, r, t);
      req.body.remainingBalance = calculateRemainingBalance(p, r, t, loan.paidMonths);
    }

    const updated = await Loan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: { loan: updated }, message: 'Loan updated successfully' });
  } catch (err) { next(err); }
};

// ─── Delete Loan ──────────────────────────────────────────────────────────────
exports.deleteLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    res.json({ success: true, message: 'Loan deleted successfully' });
  } catch (err) { next(err); }
};

// ─── Get Dashboard Stats ──────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res, next) => {
  try {
    const loans = await Loan.find({ user: req.user._id });

    const active = loans.filter(l => l.status === 'active');
    const closed = loans.filter(l => l.status === 'closed');
    const overdue = loans.filter(l => l.status === 'overdue');

    const totalDebt = active.reduce((s, l) => s + (l.remainingBalance || 0), 0);
    const monthlyEMI = active.reduce((s, l) => s + l.emi, 0);
    const totalPaid = loans.reduce((s, l) => s + l.totalPaid, 0);

    // Loan distribution by type
    const byType = loans.reduce((acc, l) => {
      acc[l.type] = (acc[l.type] || 0) + (l.remainingBalance || l.principal);
      return acc;
    }, {});

    // Monthly EMI trend (last 6 months simulated)
    const emiTrend = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        amount: monthlyEMI,
      };
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalDebt,
          monthlyEMI,
          totalPaid,
          totalLoans: loans.length,
          activeLoans: active.length,
          closedLoans: closed.length,
          overdueLoans: overdue.length,
        },
        loanDistribution: byType,
        emiTrend,
        loans: active,
      },
    });
  } catch (err) { next(err); }
};
