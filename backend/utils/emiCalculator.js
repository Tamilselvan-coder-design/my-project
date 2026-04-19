/**
 * Calculate monthly EMI using standard formula:
 * EMI = P * r * (1+r)^n / ((1+r)^n - 1)
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate (%)
 * @param {number} tenureMonths - Loan tenure in months
 */
const calculateEMI = (principal, annualRate, tenureMonths) => {
  if (annualRate === 0) return principal / tenureMonths;
  const r = annualRate / 12 / 100;
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) /
    (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi * 100) / 100;
};

/**
 * Calculate total interest payable
 */
const calculateTotalInterest = (emi, tenureMonths, principal) => {
  return Math.round((emi * tenureMonths - principal) * 100) / 100;
};

/**
 * Calculate remaining balance after N payments
 */
const calculateRemainingBalance = (principal, annualRate, tenureMonths, paidMonths) => {
  if (annualRate === 0) {
    return principal - (principal / tenureMonths) * paidMonths;
  }
  const r = annualRate / 12 / 100;
  const balance =
    principal * Math.pow(1 + r, paidMonths) -
    calculateEMI(principal, annualRate, tenureMonths) *
      ((Math.pow(1 + r, paidMonths) - 1) / r);
  return Math.max(0, Math.round(balance * 100) / 100);
};

/**
 * Estimate credit score based on financial profile (simplified model)
 */
const estimateCreditScore = (userData) => {
  const { salary, totalDebt, onTimePayments, totalPayments, loanTypes } = userData;

  let score = 650; // base

  // Debt-to-income ratio (lower is better)
  const dtiRatio = totalDebt / (salary * 12);
  if (dtiRatio < 0.1) score += 80;
  else if (dtiRatio < 0.3) score += 40;
  else if (dtiRatio < 0.5) score += 0;
  else score -= 60;

  // Payment history (most impactful)
  if (totalPayments > 0) {
    const paymentRate = onTimePayments / totalPayments;
    if (paymentRate >= 0.99) score += 100;
    else if (paymentRate >= 0.95) score += 60;
    else if (paymentRate >= 0.90) score += 20;
    else score -= 80;
  }

  // Credit mix
  if (loanTypes >= 3) score += 30;
  else if (loanTypes >= 2) score += 15;

  return Math.min(900, Math.max(300, Math.round(score)));
};

module.exports = { calculateEMI, calculateTotalInterest, calculateRemainingBalance, estimateCreditScore };
