const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Loan name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['personal', 'education', 'home', 'vehicle', 'credit_card', 'business', 'other'],
      required: true,
    },
    lender: { type: String, trim: true },
    principal: {
      type: Number,
      required: [true, 'Principal amount is required'],
      min: [1, 'Principal must be positive'],
    },
    interestRate: {
      type: Number,
      required: [true, 'Interest rate is required'],
      min: 0,
      max: 100,
    },
    tenureMonths: {
      type: Number,
      required: [true, 'Tenure is required'],
      min: 1,
    },
    emi: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    dueDate: {
      type: Number, // day of month (1-31)
      required: [true, 'Due date is required'],
      min: 1,
      max: 31,
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'overdue', 'paused'],
      default: 'active',
      index: true,
    },
    paidMonths: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    remainingBalance: { type: Number },
    lastPaymentDate: Date,
    notes: { type: String, maxlength: 500 },
    // Gamification
    streakDays: { type: Number, default: 0 },
    badges: [{ type: String }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
loanSchema.virtual('progressPercent').get(function () {
  if (!this.tenureMonths) return 0;
  return Math.min(100, Math.round((this.paidMonths / this.tenureMonths) * 100));
});

loanSchema.virtual('isOverdue').get(function () {
  if (this.status !== 'active') return false;
  const today = new Date();
  const dueThisMonth = new Date(today.getFullYear(), today.getMonth(), this.dueDate);
  return today > dueThisMonth && this.lastPaymentDate < dueThisMonth;
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
loanSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Loan', loanSchema);
