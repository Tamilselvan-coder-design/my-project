const OpenAI = require('openai');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const { estimateCreditScore } = require('../utils/emiCalculator');
const logger = require('../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Build Financial Context ──────────────────────────────────────────────────
const buildFinancialContext = async (user) => {
  const loans = await Loan.find({ user: user._id, status: 'active' });
  const { salary = 0, monthlyExpenses = 0 } = user.financialProfile || {};
  const monthlyEMI = loans.reduce((s, l) => s + l.emi, 0);
  const totalDebt = loans.reduce((s, l) => s + (l.remainingBalance || 0), 0);
  const dtiRatio = salary > 0 ? ((monthlyEMI / salary) * 100).toFixed(1) : 'N/A';

  return {
    salary,
    monthlyExpenses,
    monthlyEMI,
    totalDebt,
    dtiRatio,
    disposableIncome: salary - monthlyExpenses - monthlyEMI,
    loans: loans.map((l) => ({
      name: l.name,
      type: l.type,
      balance: l.remainingBalance,
      emi: l.emi,
      rate: l.interestRate,
      monthsLeft: l.tenureMonths - l.paidMonths,
    })),
  };
};

const SYSTEM_PROMPT = `You are FinBot, an expert AI financial advisor specializing in debt management for Indian users. 
You provide personalized, actionable advice based on the user's actual financial data.
Always be empathetic, clear, and practical. Format responses with emojis and bullet points for readability.
Currency is INR (₹). Focus on debt reduction, EMI management, and building financial health.`;

// ─── AI Advisor (Full Analysis) ───────────────────────────────────────────────
exports.getAdvice = async (req, res, next) => {
  try {
    const context = await buildFinancialContext(req.user);

    const prompt = `
Analyze this user's financial situation and provide comprehensive debt management advice:

FINANCIAL PROFILE:
- Monthly Salary: ₹${context.salary.toLocaleString('en-IN')}
- Monthly Expenses: ₹${context.monthlyExpenses.toLocaleString('en-IN')}
- Total Monthly EMI: ₹${context.monthlyEMI.toLocaleString('en-IN')}
- Total Outstanding Debt: ₹${context.totalDebt.toLocaleString('en-IN')}
- Debt-to-Income Ratio: ${context.dtiRatio}%
- Monthly Disposable Income: ₹${context.disposableIncome.toLocaleString('en-IN')}

ACTIVE LOANS:
${context.loans.map((l) => `- ${l.name} (${l.type}): ₹${l.balance?.toLocaleString('en-IN')} balance, ₹${l.emi}/month at ${l.rate}%, ${l.monthsLeft} months left`).join('\n')}

Please provide:
1. **Debt Repayment Strategy** - Should they use Avalanche (highest rate first) or Snowball (smallest balance first)? Why?
2. **Budget Optimization** - Specific suggestions to free up more money
3. **Risk Assessment** - Is their debt level safe? What are warning signs?
4. **3-Month Action Plan** - Specific steps to take this quarter
5. **Debt-Free Timeline** - Estimated when they'll be debt-free

Be specific, use actual numbers from their data.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1200,
      temperature: 0.7,
    });

    // Estimate credit score
    const transactions = await Transaction.find({ user: req.user._id, status: 'success' });
    const onTime = transactions.filter(t => t.status === 'success').length;
    const creditScore = estimateCreditScore({
      salary: context.salary,
      totalDebt: context.totalDebt,
      onTimePayments: onTime,
      totalPayments: transactions.length,
      loanTypes: new Set(context.loans.map(l => l.type)).size,
    });

    res.json({
      success: true,
      data: {
        advice: completion.choices[0].message.content,
        financialContext: context,
        creditScore,
        model: 'gpt-3.5-turbo',
      },
    });
  } catch (err) {
    if (err.code === 'insufficient_quota') {
      return res.status(503).json({ success: false, message: 'AI service quota exceeded. Please check your OpenAI billing.' });
    }
    next(err);
  }
};

// ─── AI Chatbot ───────────────────────────────────────────────────────────────
exports.chat = async (req, res, next) => {
  try {
    const { messages, includeContext = true } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'Messages are required' });
    }

    let systemContent = SYSTEM_PROMPT;

    if (includeContext) {
      const context = await buildFinancialContext(req.user);
      systemContent += `\n\nCURRENT USER DATA:\n${JSON.stringify(context, null, 2)}\n\nUse this data when answering questions about their specific situation.`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemContent },
        ...messages.slice(-10), // keep last 10 messages for context
      ],
      max_tokens: 600,
      temperature: 0.8,
    });

    res.json({
      success: true,
      data: {
        reply: completion.choices[0].message.content,
        usage: completion.usage,
      },
    });
  } catch (err) {
    if (err.code === 'insufficient_quota') {
      return res.status(503).json({ success: false, message: 'AI service quota exceeded.' });
    }
    next(err);
  }
};

// ─── Credit Score ─────────────────────────────────────────────────────────────
exports.getCreditScore = async (req, res, next) => {
  try {
    const loans = await Loan.find({ user: req.user._id });
    const transactions = await Transaction.find({ user: req.user._id });
    const totalDebt = loans.reduce((s, l) => s + (l.remainingBalance || 0), 0);

    const score = estimateCreditScore({
      salary: req.user.financialProfile?.salary || 0,
      totalDebt,
      onTimePayments: transactions.filter(t => t.status === 'success').length,
      totalPayments: transactions.length,
      loanTypes: new Set(loans.map(l => l.type)).size,
    });

    const rating = score >= 750 ? 'Excellent' : score >= 700 ? 'Good' : score >= 650 ? 'Fair' : score >= 600 ? 'Poor' : 'Very Poor';
    const color = score >= 750 ? '#22c55e' : score >= 700 ? '#84cc16' : score >= 650 ? '#eab308' : score >= 600 ? '#f97316' : '#ef4444';

    res.json({ success: true, data: { score, rating, color, factors: { totalDebt, loans: loans.length } } });
  } catch (err) { next(err); }
};
