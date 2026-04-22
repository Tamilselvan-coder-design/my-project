const mongoose = require('mongoose');

const lendingSchema = new mongoose.Schema({
  lender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  interestRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 50,
  },
  tenureMonths: {
    type: Number,
    required: true,
    min: 1,
  },
  emi: {
    type: Number,
    required: true,
  },
  remainingBalance: {
    type: Number,
    required: true,
  },
  totalPaid: {
    type: Number,
    default: 0,
  },
  paidMonths: {
    type: Number,
    default: 0,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'paid', 'overdue', 'cancelled'],
    default: 'active',
  },
  purpose: {
    type: String,
    max: 500,
    default: '',
  },
  notes: {
    type: String,
    max: 1000,
    default: '',
  },
  payments: [{
    amount: Number,
    date: { type: Date, default: Date.now },
    note: String,
  }],
}, { timestamps: true });

// Calculate EMI
lendingSchema.pre('save', function(next) {
  if (this.isNew && this.amount && this.tenureMonths) {
    const r = this.interestRate / 12 / 100;
    if (r === 0) {
      this.emi = this.amount / this.tenureMonths;
    } else {
      this.emi = this.amount * r * Math.pow(1 + r, this.tenureMonths) / (Math.pow(1 + r, this.tenureMonths) - 1);
    }
    this.emi = Math.round(this.emi * 100) / 100;
  }
  next();
});

module.exports = mongoose.model('Lending', lendingSchema);