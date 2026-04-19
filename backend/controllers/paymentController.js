const Razorpay = require('razorpay');
const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const { Notification } = require('../models/BankAccount');
const { sendPaymentSuccessEmail } = require('../services/emailService');
const { calculateRemainingBalance } = require('../utils/emiCalculator');
const logger = require('../utils/logger');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── Create Order ─────────────────────────────────────────────────────────────
exports.createOrder = async (req, res, next) => {
  try {
    const { loanId, amount } = req.body;

    const loan = await Loan.findOne({ _id: loanId, user: req.user._id });
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loan.status === 'closed') return res.status(400).json({ success: false, message: 'Loan is already closed' });

    const orderAmount = amount || loan.emi;

    const order = await razorpay.orders.create({
      amount: Math.round(orderAmount * 100), // paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        loanId: loanId,
        userId: req.user._id.toString(),
        loanName: loan.name,
      },
    });

    // Pre-create pending transaction
    const transaction = await Transaction.create({
      user: req.user._id,
      loan: loanId,
      type: 'emi_payment',
      amount: orderAmount,
      status: 'pending',
      razorpayOrderId: order.id,
      description: `EMI payment for ${loan.name}`,
    });

    res.json({
      success: true,
      data: {
        order,
        transaction: transaction._id,
        key: process.env.RAZORPAY_KEY_ID,
        loanName: loan.name,
        amount: orderAmount,
      },
    });
  } catch (err) { next(err); }
};

// ─── Verify Payment ───────────────────────────────────────────────────────────
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, loanId } = req.body;

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Update transaction
    const transaction = await Transaction.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, user: req.user._id },
      { status: 'success', razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature },
      { new: true }
    );

    // Update loan
    const loan = await Loan.findById(loanId);
    if (loan) {
      loan.paidMonths += 1;
      loan.totalPaid += transaction.amount;
      loan.lastPaymentDate = new Date();
      loan.remainingBalance = calculateRemainingBalance(
        loan.principal, loan.interestRate, loan.tenureMonths, loan.paidMonths
      );
      if (loan.paidMonths >= loan.tenureMonths) loan.status = 'closed';
      loan.streakDays += 1;
      // Award badges
      if (loan.paidMonths === 3 && !loan.badges.includes('3_month_streak')) loan.badges.push('3_month_streak');
      if (loan.paidMonths === 12 && !loan.badges.includes('yearly_star')) loan.badges.push('yearly_star');
      await loan.save();
    }

    // Notification
    await Notification.create({
      user: req.user._id,
      type: 'payment_success',
      title: 'Payment Successful',
      message: `EMI of ₹${transaction.amount} paid for ${loan?.name}`,
      loanId,
    });

    // Send email (non-blocking)
    sendPaymentSuccessEmail(req.user.email, req.user.name, {
      loanName: loan?.name,
      amount: transaction.amount,
      paymentId: razorpay_payment_id,
    }).catch((e) => logger.warn('Payment email failed:', e.message));

    res.json({ success: true, message: 'Payment verified successfully', data: { transaction } });
  } catch (err) { next(err); }
};

// ─── Razorpay Webhook ─────────────────────────────────────────────────────────
exports.webhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body; // raw buffer from express.raw()

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSig) {
      logger.warn('Invalid webhook signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = JSON.parse(body.toString());
    logger.info(`Razorpay webhook: ${event.event}`);

    if (event.event === 'payment.failed') {
      const orderId = event.payload.payment.entity.order_id;
      await Transaction.findOneAndUpdate({ razorpayOrderId: orderId }, { status: 'failed' });
    }

    res.json({ received: true });
  } catch (err) { next(err); }
};

// ─── Get Transactions ─────────────────────────────────────────────────────────
exports.getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, loanId } = req.query;
    const filter = { user: req.user._id };
    if (loanId) filter.loan = loanId;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('loan', 'name type')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: { transactions, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } },
    });
  } catch (err) { next(err); }
};
