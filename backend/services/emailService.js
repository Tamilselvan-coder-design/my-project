const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || 'Smart Debt Manager <noreply@smartdebt.app>';

const sendMail = async (to, subject, html) => {
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    logger.error(`Email failed to ${to}:`, err.message);
    throw err;
  }
};

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; color: #fff; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px; }
    .body { padding: 32px; }
    .card { background: #0f172a; border-radius: 8px; padding: 20px; margin: 16px 0; }
    .label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
    .value { font-size: 22px; font-weight: 700; color: #6366f1; margin-top: 4px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { padding: 20px 32px; border-top: 1px solid #334155; font-size: 12px; color: #64748b; text-align: center; }
    .success { color: #22c55e; } .warning { color: #f59e0b; } .danger { color: #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Smart Debt Manager</h1>
      <p>Your financial intelligence partner</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Smart Debt Manager. This is an automated message.</p>
      <p>If you did not request this, please ignore or contact support.</p>
    </div>
  </div>
</body>
</html>`;

// ─── Email Templates ──────────────────────────────────────────────────────────

exports.sendWelcomeEmail = (email, name) =>
  sendMail(email, '🎉 Welcome to Smart Debt Manager!', baseTemplate(`
    <h2>Hi ${name}! 👋</h2>
    <p>Welcome aboard! Smart Debt Manager helps you take control of your finances with AI-powered insights.</p>
    <div class="card">
      <p><strong>🏦 Track Loans</strong> — Add all your loans and EMIs in one place</p>
      <p><strong>🤖 AI Advisor</strong> — Get personalized debt repayment strategies</p>
      <p><strong>💳 Make Payments</strong> — Pay EMIs securely via Razorpay</p>
      <p><strong>📊 Visualize</strong> — Beautiful charts to track your progress</p>
    </div>
    <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">Go to Dashboard →</a>
  `));

exports.sendEMIReminderEmail = (email, name, { loanName, emi, dueDate, loanId }) =>
  sendMail(email, `⏰ EMI Due Reminder: ${loanName}`, baseTemplate(`
    <h2>Hi ${name},</h2>
    <p>Your EMI payment is due soon. Don't miss it to maintain your credit score!</p>
    <div class="card">
      <div class="label">Loan</div><div class="value">${loanName}</div>
    </div>
    <div class="card">
      <div class="label">EMI Amount</div><div class="value">₹${emi?.toLocaleString('en-IN')}</div>
    </div>
    <div class="card">
      <div class="label">Due Date</div><div class="value warning">${dueDate}</div>
    </div>
    <a href="${process.env.FRONTEND_URL}/payments?loanId=${loanId}" class="btn">Pay Now →</a>
    <p style="color:#94a3b8;font-size:13px;">Setting up auto-pay can help you never miss a payment.</p>
  `));

exports.sendPaymentSuccessEmail = (email, name, { loanName, amount, paymentId }) =>
  sendMail(email, `✅ Payment Successful: ₹${amount?.toLocaleString('en-IN')}`, baseTemplate(`
    <h2>Payment Confirmed! 🎉</h2>
    <p>Hi ${name}, your EMI payment has been successfully processed.</p>
    <div class="card">
      <div class="label">Loan</div><div class="value">${loanName}</div>
    </div>
    <div class="card">
      <div class="label">Amount Paid</div><div class="value success">₹${amount?.toLocaleString('en-IN')}</div>
    </div>
    <div class="card">
      <div class="label">Transaction ID</div>
      <div style="font-size:14px;color:#94a3b8;margin-top:4px;font-family:monospace;">${paymentId}</div>
    </div>
    <p>Great job staying on track with your payments! 💪</p>
    <a href="${process.env.FRONTEND_URL}/payments" class="btn">View Transactions →</a>
  `));

exports.sendOverdueAlert = (email, name, { loanName, emi, daysOverdue }) =>
  sendMail(email, `🚨 Overdue EMI Alert: ${loanName}`, baseTemplate(`
    <h2>⚠️ Action Required</h2>
    <p>Hi ${name}, your EMI payment is <strong class="danger">${daysOverdue} days overdue</strong>.</p>
    <div class="card">
      <div class="label">Loan</div><div class="value">${loanName}</div>
    </div>
    <div class="card">
      <div class="label">Overdue Amount</div><div class="value danger">₹${emi?.toLocaleString('en-IN')}</div>
    </div>
    <p>Missing payments can negatively impact your credit score. Please pay as soon as possible.</p>
    <a href="${process.env.FRONTEND_URL}/payments" class="btn">Pay Now →</a>
  `));
