# 💰 Smart Debt Manager

A production-ready MERN stack fintech application for intelligent loan management, EMI tracking, AI-powered advice, and secure payments.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- OpenAI API key
- Razorpay test account (free)
- Gmail account (for email notifications)

---

## 🔧 Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values (see below)
npm run dev
```

### `.env` Configuration

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | Random 32+ char secret for access tokens |
| `JWT_REFRESH_SECRET` | Different random 32+ char secret for refresh tokens |
| `ENCRYPTION_KEY` | Exactly 32 chars for AES-256 encryption |
| `OPENAI_API_KEY` | Get from platform.openai.com |
| `RAZORPAY_KEY_ID` | From Razorpay test dashboard |
| `RAZORPAY_KEY_SECRET` | From Razorpay test dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | Set in Razorpay webhook settings |
| `EMAIL_USER` | Gmail address |
| `EMAIL_PASS` | Gmail App Password (not your login password) |
| `FRONTEND_URL` | `http://localhost:5173` for local dev |

### Gmail App Password Setup
1. Enable 2FA on your Google account
2. Go to Google Account → Security → App Passwords
3. Generate a password for "Mail" → use that as `EMAIL_PASS`

---

## 🎨 Frontend Setup

```bash
cd frontend
npm install

# Add Razorpay script to index.html (before </body>):
# <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

npm run dev
```

Open http://localhost:5173

---

## 📁 Project Structure

```
smart-debt-manager/
├── backend/
│   ├── controllers/       # Business logic
│   │   ├── authController.js
│   │   ├── loanController.js
│   │   ├── paymentController.js
│   │   └── aiController.js
│   ├── middleware/
│   │   ├── auth.js          # JWT protect + RBAC
│   │   ├── validation.js    # Joi schemas
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js          # bcrypt + session tracking
│   │   ├── Loan.js          # EMI + progress virtuals
│   │   ├── Transaction.js   # Razorpay payments
│   │   └── BankAccount.js   # Mock bank + notifications
│   ├── routes/              # RESTful API routes (/api/v1/*)
│   ├── services/
│   │   ├── emailService.js  # Nodemailer templates
│   │   ├── cronService.js   # EMI reminders (daily 9AM IST)
│   │   └── bankService.js   # Mock bank transactions
│   ├── utils/
│   │   ├── jwt.js           # Token generation & cookies
│   │   ├── encryption.js    # AES-256
│   │   ├── emiCalculator.js # EMI + credit score formulas
│   │   └── logger.js        # Winston
│   └── server.js
│
└── frontend/
    └── src/
        ├── api/axios.js     # Axios + auto token refresh
        ├── store/           # Redux Toolkit slices
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DashboardPage.jsx  # Charts + stats
        │   ├── LoansPage.jsx      # Full CRUD
        │   ├── PaymentsPage.jsx   # Razorpay integration
        │   ├── AIAdvisorPage.jsx  # GPT analysis + credit score
        │   ├── ChatbotPage.jsx    # Context-aware chatbot
        │   ├── BankPage.jsx       # Mock bank accounts
        │   └── ProfilePage.jsx    # Settings + security
        └── components/
            └── common/
                ├── Layout.jsx     # Sidebar navigation
                └── ProtectedRoute.jsx
```

---

## 🌐 API Reference

```
POST   /api/v1/auth/register        Register user
POST   /api/v1/auth/login           Login
POST   /api/v1/auth/refresh         Refresh access token
POST   /api/v1/auth/logout          Logout

GET    /api/v1/loans                Get all loans
POST   /api/v1/loans                Create loan (auto EMI calc)
PUT    /api/v1/loans/:id            Update loan
DELETE /api/v1/loans/:id            Delete loan
GET    /api/v1/loans/dashboard      Dashboard stats + charts

POST   /api/v1/payments/order       Create Razorpay order
POST   /api/v1/payments/verify      Verify payment signature
POST   /api/v1/payments/webhook     Razorpay webhook
GET    /api/v1/payments/transactions Transaction history

GET    /api/v1/bank                 List bank accounts
POST   /api/v1/bank                 Link bank account
PUT    /api/v1/bank/:id/sync        Sync account (mock)
GET    /api/v1/bank/transactions    Bank transactions

GET    /api/v1/ai/advice            AI repayment analysis
POST   /api/v1/ai/chat              AI chatbot (context-aware)
GET    /api/v1/ai/credit-score      Estimated credit score

GET    /api/v1/notifications        List notifications
PUT    /api/v1/notifications/read-all Mark all read
GET    /api/v1/users/profile        Get profile
PUT    /api/v1/users/profile        Update profile
GET    /api/v1/users/export-report  Download report
GET    /api/v1/users/sessions       Active sessions
GET    /api/v1/users/activity-log   Security audit log
```

---

## 🔒 Security Features

- **JWT** — 15-min access + 7-day refresh tokens with rotation
- **Refresh token reuse detection** — Clears all sessions on suspected theft
- **AES-256 encryption** — Bank account numbers and balances encrypted at rest
- **bcrypt** — Password hashing with 12 rounds
- **Account lockout** — 5 failed logins → 30 min lock
- **Rate limiting** — 100 req/15min global, 10 req/15min for auth
- **Helmet** — Secure HTTP headers
- **CORS** — Whitelist only frontend URL
- **Mongo sanitize** — Prevents NoSQL injection
- **Input validation** — Joi on all endpoints
- **Activity logging** — IP + device tracking per user
- **RBAC** — User/admin roles

---

## 🚀 Deployment

### Backend → Render.com
1. Push to GitHub
2. New Web Service → Connect repo → `backend/` root
3. Build: `npm install` | Start: `node server.js`
4. Add all `.env` variables in Render dashboard
5. Set `NODE_ENV=production`

### Frontend → Vercel
1. New Project → Connect repo → `frontend/` root
2. Build: `npm run build` | Output: `dist`
3. Add env: `VITE_API_URL=https://your-render-url.onrender.com`
4. Update `vite.config.js` proxy target to Render URL

### Database → MongoDB Atlas
1. Create free cluster at mongodb.com/atlas
2. Add IP `0.0.0.0/0` to Network Access (or Render's IP)
3. Create DB user → copy connection string to `MONGO_URI`

---

## 🎮 Gamification Features
- Payment streaks tracked per loan
- Badges: `3_month_streak`, `yearly_star`
- Debt-free progress bar on dashboard

## 📊 Credit Score
Estimated using: salary vs debt ratio, payment history, and credit mix. Range: 300–900 (CIBIL-style).

---

Built with ❤️ using Node.js, Express, MongoDB, React, Redux Toolkit, Tailwind CSS, OpenAI, and Razorpay.
