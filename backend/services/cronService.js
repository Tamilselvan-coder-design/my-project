const cron = require('node-cron');
const Loan = require('../models/Loan');
const User = require('../models/User');
const { Notification } = require('../models/BankAccount');
const { sendEMIReminderEmail, sendOverdueAlert } = require('./emailService');
const logger = require('../utils/logger');

/**
 * Check for upcoming EMIs and overdue loans daily at 9 AM
 */
const scheduleEMIReminders = () => {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    logger.info('🕘 Running EMI reminder cron job...');
    try {
      const today = new Date();
      const todayDay = today.getDate();

      // Find all active loans
      const loans = await Loan.find({ status: 'active' }).populate('user', 'name email preferences financialProfile');

      for (const loan of loans) {
        const user = loan.user;
        if (!user || !user.preferences?.emailNotifications) continue;

        const reminderDays = user.preferences?.reminderDays || 3;
        const targetDay = loan.dueDate;

        // Calculate if reminder should fire
        const dueThisMonth = new Date(today.getFullYear(), today.getMonth(), targetDay);
        const daysUntilDue = Math.ceil((dueThisMonth - today) / (1000 * 60 * 60 * 24));

        if (daysUntilDue === reminderDays || daysUntilDue === 1) {
          // Send reminder
          await sendEMIReminderEmail(user.email, user.name, {
            loanName: loan.name,
            emi: loan.emi,
            dueDate: dueThisMonth.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            loanId: loan._id,
          });

          await Notification.create({
            user: user._id,
            type: 'emi_reminder',
            title: `EMI Due in ${daysUntilDue} day(s)`,
            message: `Your EMI of ₹${loan.emi} for ${loan.name} is due on ${dueThisMonth.toLocaleDateString('en-IN')}`,
            loanId: loan._id,
          });

          logger.info(`EMI reminder sent to ${user.email} for loan ${loan.name}`);
        }

        // Check overdue: if today is past due date and no payment this month
        if (todayDay > targetDay) {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const lastPayment = loan.lastPaymentDate;
          const isPaidThisMonth = lastPayment && lastPayment >= startOfMonth;

          if (!isPaidThisMonth) {
            const daysOverdue = todayDay - targetDay;
            loan.status = 'overdue';
            await loan.save();

            await sendOverdueAlert(user.email, user.name, {
              loanName: loan.name,
              emi: loan.emi,
              daysOverdue,
            });

            await Notification.create({
              user: user._id,
              type: 'overdue',
              title: '🚨 Overdue EMI',
              message: `Your EMI for ${loan.name} is ${daysOverdue} days overdue!`,
              loanId: loan._id,
            });
          }
        }
      }

      logger.info('✅ EMI reminder cron job completed');
    } catch (err) {
      logger.error('Cron job error:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  // Sync mock bank accounts every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    logger.info('🏦 Running bank sync cron job...');
    try {
      const { BankAccount } = require('../models/BankAccount');
      await BankAccount.updateMany({}, { lastSynced: new Date() });
      logger.info('✅ Bank sync completed');
    } catch (err) {
      logger.error('Bank sync cron error:', err.message);
    }
  });

  logger.info('✅ Cron jobs scheduled');
};

module.exports = { scheduleEMIReminders };
