const { BankAccount } = require('../models/BankAccount');
const { encrypt, decrypt } = require('../utils/encryption');

const CATEGORIES = ['food', 'transport', 'utilities', 'entertainment', 'health', 'shopping', 'other'];

const MOCK_MERCHANTS = {
  food: ['Swiggy', 'Zomato', 'McDonald\'s', 'KFC', 'Dominos', 'BigBasket'],
  transport: ['Ola', 'Uber', 'IRCTC', 'MakeMyTrip', 'RedBus', 'Rapido'],
  utilities: ['BESCOM', 'Airtel', 'Jio', 'BWSSB', 'Tata Power', 'Indian Oil'],
  entertainment: ['Netflix', 'Hotstar', 'Amazon Prime', 'BookMyShow', 'Spotify'],
  health: ['Apollo Pharmacy', 'PharmEasy', 'Dr. Lal PathLabs', 'Practo'],
  shopping: ['Amazon', 'Flipkart', 'Myntra', 'Nykaa', 'Meesho'],
  other: ['ATM Withdrawal', 'Bank Transfer', 'UPI Payment', 'NEFT'],
};

/**
 * Generate mock bank transactions for a given month
 */
const generateMockTransactions = (balance, monthsBack = 3) => {
  const transactions = [];
  const now = new Date();

  for (let m = 0; m < monthsBack; m++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const txCount = Math.floor(Math.random() * 15) + 10; // 10–25 per month

    for (let i = 0; i < txCount; i++) {
      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const merchants = MOCK_MERCHANTS[category];
      const merchant = merchants[Math.floor(Math.random() * merchants.length)];
      const isCredit = Math.random() < 0.15; // 15% credits (salary, refunds)

      const baseAmounts = { food: 200, transport: 150, utilities: 500, entertainment: 300, health: 400, shopping: 800, other: 1000 };
      const amount = Math.round((baseAmounts[category] + Math.random() * baseAmounts[category]) * 10) / 10;

      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), Math.floor(Math.random() * 28) + 1);

      transactions.push({
        date,
        description: isCredit ? `Credit from ${merchant}` : merchant,
        amount,
        type: isCredit ? 'credit' : 'debit',
        category,
      });
    }

    // Add salary credit at start of month
    transactions.push({
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
      description: 'Salary Credit - EMPLOYER',
      amount: balance * 0.1 + Math.random() * 5000, // approximate
      type: 'credit',
      category: 'other',
    });
  }

  return transactions.sort((a, b) => b.date - a.date);
};

// ─── Controller Functions ─────────────────────────────────────────────────────

exports.getBankAccounts = async (req, res, next) => {
  try {
    const accounts = await BankAccount.find({ user: req.user._id });
    const sanitized = accounts.map((acc) => ({
      ...acc.toObject(),
      accountNumber: `****${decrypt(acc.accountNumber)?.slice(-4) || '****'}`,
      balance: Number(decrypt(String(acc.balance))) || 0,
    }));
    res.json({ success: true, data: { accounts: sanitized } });
  } catch (err) { next(err); }
};

exports.addBankAccount = async (req, res, next) => {
  try {
    const { bankName, accountNumber, accountType, ifscCode, balance = 50000 } = req.body;

    const existing = await BankAccount.findOne({ user: req.user._id, accountNumber: encrypt(accountNumber) });
    if (existing) return res.status(409).json({ success: false, message: 'Account already linked' });

    const mockTransactions = generateMockTransactions(balance, 3);

    const account = await BankAccount.create({
      user: req.user._id,
      bankName,
      accountNumber: encrypt(accountNumber),
      accountType,
      ifscCode,
      balance: encrypt(String(balance)),
      mockTransactions,
      lastSynced: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Bank account linked successfully',
      data: {
        account: {
          ...account.toObject(),
          accountNumber: `****${accountNumber.slice(-4)}`,
          balance,
        },
      },
    });
  } catch (err) { next(err); }
};

exports.syncBankAccount = async (req, res, next) => {
  try {
    const account = await BankAccount.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    // Simulate new transactions
    const newBalance = Number(decrypt(String(account.balance))) * (0.95 + Math.random() * 0.1);
    const newTransactions = generateMockTransactions(newBalance, 1);

    account.mockTransactions = [...newTransactions, ...account.mockTransactions].slice(0, 100);
    account.balance = encrypt(String(Math.round(newBalance)));
    account.lastSynced = new Date();
    await account.save();

    res.json({
      success: true,
      message: 'Account synced successfully',
      data: {
        balance: Math.round(newBalance),
        newTransactions: newTransactions.length,
        lastSynced: account.lastSynced,
      },
    });
  } catch (err) { next(err); }
};

exports.getTransactions = async (req, res, next) => {
  try {
    const accounts = await BankAccount.find({ user: req.user._id });
    const allTx = accounts.flatMap((acc) =>
      acc.mockTransactions.map((t) => ({ ...t.toObject?.() || t, bankName: acc.bankName }))
    );
    allTx.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ success: true, data: { transactions: allTx.slice(0, 50) } });
  } catch (err) { next(err); }
};

exports.deleteBankAccount = async (req, res, next) => {
  try {
    await BankAccount.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Bank account removed' });
  } catch (err) { next(err); }
};
