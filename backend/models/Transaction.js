const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    loan: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
    bankAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' },

    type: {
      type: String,
      enum: ['emi_payment', 'bank_sync', 'manual', 'refund'],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },

    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },

    // Razorpay fields
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,

    description: String,
    category: {
      type: String,
      enum: ['emi', 'food', 'transport', 'utilities', 'entertainment', 'health', 'shopping', 'other'],
      default: 'emi',
    },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ razorpayOrderId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
