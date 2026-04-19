const mongoose = require('mongoose');

// ─── BankAccount Model ────────────────────────────────────────────────────────
const bankAccountSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true }, // stored encrypted
    accountType: { type: String, enum: ['savings', 'current', 'salary'], default: 'savings' },
    balance: { type: Number, default: 0 }, // stored encrypted
    ifscCode: String,
    isDefault: { type: Boolean, default: false },
    lastSynced: Date,
    mockTransactions: [
      {
        date: Date,
        description: String,
        amount: Number,
        type: { type: String, enum: ['credit', 'debit'] },
        category: String,
      },
    ],
  },
  { timestamps: true }
);

// ─── Notification Model ───────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['emi_reminder', 'payment_success', 'payment_failed', 'overdue', 'advice', 'system'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = {
  BankAccount: mongoose.model('BankAccount', bankAccountSchema),
  Notification: mongoose.model('Notification', notificationSchema),
};
