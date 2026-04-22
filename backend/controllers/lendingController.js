const Lending = require('../models/Lending');

// ─── Get All Lendings (as lender or borrower) ─────────────────────────────────
exports.getLendings = async (req, res, next) => {
  try {
    const { status, role } = req.query;
    const userId = req.user._id;

    let filter = {
      $or: [{ lender: userId }, { borrower: userId }],
    };

    if (role === 'lender') {
      filter = { lender: userId };
    } else if (role === 'borrower') {
      filter = { borrower: userId };
    }

    if (status) filter.status = status;

    const lendings = await Lending.find(filter)
      .populate('lender', 'name email')
      .populate('borrower', 'name email')
      .sort({ createdAt: -1 });

    // Calculate summary
    const asLender = lendings.filter(l => l.lender._id.toString() === userId.toString() && l.status === 'active');
    const asBorrower = lendings.filter(l => l.borrower._id.toString() === userId.toString() && l.status === 'active');

    const totalLent = asLender.reduce((s, l) => s + l.remainingBalance, 0);
    const totalBorrowed = asBorrower.reduce((s, l) => s + l.remainingBalance, 0);
    const expectedReturns = asLender.reduce((s, l) => s + l.emi, 0);
    const monthlyRepayment = asBorrower.reduce((s, l) => s + l.emi, 0);

    res.json({
      success: true,
      data: {
        lendings,
        summary: {
          totalLent,
          totalBorrowed,
          expectedReturns,
          monthlyRepayment,
          lentCount: asLender.length,
          borrowedCount: asBorrower.length,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Lending ───────────────────────────────────────────────────────
exports.getLending = async (req, res, next) => {
  try {
    const lending = await Lending.findOne({
      _id: req.params.id,
      $or: [{ lender: req.user._id }, { borrower: req.user._id }],
    })
      .populate('lender', 'name email')
      .populate('borrower', 'name email');

    if (!lending) {
      return res.status(404).json({ success: false, message: 'Lending not found' });
    }

    res.json({ success: true, data: { lending } });
  } catch (err) {
    next(err);
  }
};

// ─── Create Lending (Lender creates for Borrower) ─────────────────────────────
exports.createLending = async (req, res, next) => {
  try {
    const { borrowerEmail, amount, interestRate, tenureMonths, purpose, notes, startDate, dueDate } = req.body;

    // Find borrower by email
    const User = require('../models/User');
    const borrower = await User.findOne({ email: borrowerEmail });

    if (!borrower) {
      return res.status(404).json({ success: false, message: 'Borrower not found with this email' });
    }

    if (borrower._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot lend to yourself' });
    }

    // Calculate EMI
    const r = (interestRate || 0) / 12 / 100;
    let emi = 0;
    if (r === 0) {
      emi = amount / tenureMonths;
    } else {
      emi = amount * r * Math.pow(1 + r, tenureMonths) / (Math.pow(1 + r, tenureMonths) - 1);
    }
    emi = Math.round(emi * 100) / 100;

    const lending = await Lending.create({
      lender: req.user._id,
      borrower: borrower._id,
      amount,
      interestRate: interestRate || 0,
      tenureMonths,
      emi,
      remainingBalance: amount,
      startDate: startDate || Date.now(),
      dueDate,
      purpose: purpose || '',
      notes: notes || '',
    });

    await lending.populate('lender', 'name email');
    await lending.populate('borrower', 'name email');

    res.status(201).json({
      success: true,
      data: { lending },
      message: 'Lending created successfully',
    });
  } catch (err) {
    next(err);
  }
};

// ─── Record Payment ───────────────────────────────────────────────────────────
exports.recordPayment = async (req, res, next) => {
  try {
    const { amount, note } = req.body;

    const lending = await Lending.findOne({
      _id: req.params.id,
      $or: [{ lender: req.user._id }, { borrower: req.user._id }],
    });

    if (!lending) {
      return res.status(404).json({ success: false, message: 'Lending not found' });
    }

    // Only borrower can make payments
    if (lending.borrower.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only borrower can record payments' });
    }

    if (lending.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Lending is not active' });
    }

    // Add payment
    lending.payments.push({ amount, note: note || '' });
    lending.totalPaid += amount;
    lending.remainingBalance = Math.max(0, lending.remainingBalance - amount);
    lending.paidMonths += 1;

    // Update status
    if (lending.remainingBalance <= 0) {
      lending.status = 'paid';
    }

    await lending.save();

    res.json({
      success: true,
      data: { lending },
      message: 'Payment recorded successfully',
    });
  } catch (err) {
    next(err);
  }
};

// ─── Update Lending ───────────────────────────────────────────────────────────
exports.updateLending = async (req, res, next) => {
  try {
    const lending = await Lending.findOne({
      _id: req.params.id,
      lender: req.user._id,
    });

    if (!lending) {
      return res.status(404).json({ success: false, message: 'Lending not found or unauthorized' });
    }

    const allowedUpdates = ['interestRate', 'tenureMonths', 'purpose', 'notes', 'status'];
    const updates = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Recalculate EMI if tenure changed
    if (req.body.tenureMonths || req.body.interestRate) {
      const r = (updates.interestRate ?? lending.interestRate) / 12 / 100;
      const t = updates.tenureMonths ?? lending.tenureMonths;
      if (r === 0) {
        updates.emi = lending.amount / t;
      } else {
        updates.emi = lending.amount * r * Math.pow(1 + r, t) / (Math.pow(1 + r, t) - 1);
      }
      updates.emi = Math.round(updates.emi * 100) / 100;
    }

    const updated = await Lending.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('lender', 'name email')
      .populate('borrower', 'name email');

    res.json({
      success: true,
      data: { lending: updated },
      message: 'Lending updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

// ─── Delete/Cancel Lending ───────────────────────────────────────────────────
exports.deleteLending = async (req, res, next) => {
  try {
    const lending = await Lending.findOne({
      _id: req.params.id,
      lender: req.user._id,
    });

    if (!lending) {
      return res.status(404).json({ success: false, message: 'Lending not found or unauthorized' });
    }

    // Only allow delete if no payments made
    if (lending.totalPaid > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete lending with existing payments. Cancel instead.',
      });
    }

    await Lending.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Lending deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── Get Dashboard Stats ─────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const lendings = await Lending.find({
      $or: [{ lender: userId }, { borrower: userId }],
    }).populate('lender', 'name').populate('borrower', 'name');

    const asLender = lendings.filter(l => l.lender._id.toString() === userId.toString());
    const asBorrower = lendings.filter(l => l.borrower._id.toString() === userId.toString());

    const activeLent = asLender.filter(l => l.status === 'active');
    const activeBorrowed = asBorrower.filter(l => l.status === 'active');

    const stats = {
      totalLent: asLender.reduce((s, l) => s + l.amount, 0),
      totalBorrowed: asBorrower.reduce((s, l) => s + l.amount, 0),
      activeLent: activeLent.reduce((s, l) => s + l.remainingBalance, 0),
      activeBorrowed: activeBorrowed.reduce((s, l) => s + l.remainingBalance, 0),
      expectedReturns: activeLent.reduce((s, l) => s + l.emi, 0),
      monthlyRepayment: activeBorrowed.reduce((s, l) => s + l.emi, 0),
      lentCount: asLender.length,
      borrowedCount: asBorrower.length,
      paidLendings: asLender.filter(l => l.status === 'paid').length,
      paidBorrowings: asBorrower.filter(l => l.status === 'paid').length,
    };

    res.json({ success: true, data: { stats, lendings } });
  } catch (err) {
    next(err);
  }
};