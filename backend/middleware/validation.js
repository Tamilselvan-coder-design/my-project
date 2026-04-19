const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors = error.details.map((d) => d.message.replace(/['"]/g, ''));
    return res.status(422).json({ success: false, message: 'Validation failed', errors });
  }
  next();
};

// ─── Auth Schemas ─────────────────────────────────────────────────────────────
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// ─── Loan Schemas ─────────────────────────────────────────────────────────────
const loanSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  type: Joi.string()
    .valid('personal', 'education', 'home', 'vehicle', 'credit_card', 'business', 'other')
    .required(),
  lender: Joi.string().max(100).optional().allow(''),
  principal: Joi.number().min(1).required(),
  interestRate: Joi.number().min(0).max(100).required(),
  tenureMonths: Joi.number().integer().min(1).required(),
  startDate: Joi.date().required(),
  dueDate: Joi.number().integer().min(1).max(31).required(),
  notes: Joi.string().max(500).optional().allow(''),
});

// ─── Profile Schema ───────────────────────────────────────────────────────────
const profileSchema = Joi.object({
  name: Joi.string().min(2).max(60).optional(),
  financialProfile: Joi.object({
    salary: Joi.number().min(0).optional(),
    monthlyExpenses: Joi.number().min(0).optional(),
    financialGoals: Joi.string().max(500).optional().allow(''),
    currency: Joi.string().valid('INR', 'USD', 'EUR').optional(),
  }).optional(),
  preferences: Joi.object({
    darkMode: Joi.boolean().optional(),
    emailNotifications: Joi.boolean().optional(),
    reminderDays: Joi.number().min(1).max(14).optional(),
  }).optional(),
});

// ─── Bank Account Schema ──────────────────────────────────────────────────────
const bankAccountSchema = Joi.object({
  bankName: Joi.string().min(2).max(100).required(),
  accountNumber: Joi.string().min(8).max(20).required(),
  accountType: Joi.string().valid('savings', 'current', 'salary').default('savings'),
  ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional().allow(''),
  balance: Joi.number().min(0).optional(),
});

module.exports = {
  validate,
  schemas: { registerSchema, loginSchema, loanSchema, profileSchema, bankAccountSchema },
};
