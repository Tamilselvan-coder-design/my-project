# Smart Debt Manager - Project Report

## 1. Project Overview

### Project Name
**Smart Debt Manager**

### Project Type
Full-stack MERN (MongoDB, Express, React, Node.js) Web Application

### Project Summary
A production-ready fintech application for intelligent loan management, EMI tracking, AI-powered financial advice, and secure payment processing. The application helps users manage multiple loans, track payments, calculate EMIs, and receive personalized debt reduction strategies from an AI advisor.

### Target Users
- Salaried professionals with multiple loans (home, car, personal, education)
- Small business owners with business loans
- Young adults learning financial management
- Anyone looking to track and manage their debt effectively

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI Framework |
| Vite | 5.x | Build Tool |
| Redux Toolkit | 2.x | State Management |
| Tailwind CSS | 3.x | Styling |
| Lucide React | - | Icons |
| React Hot Toast | - | Notifications |
| Recharts | - | Charts/Visualization |
| Axios | - | HTTP Client |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 4.x | Web Framework |
| MongoDB | - | Database |
| Mongoose | 8.x | ODM |
| JWT | 9.x | Authentication |
| Bcryptjs | 2.x | Password Hashing |
| OpenAI | 4.x | AI Integration |
| Node-cron | 3.x | Scheduled Tasks |
| Nodemailer | 6.x | Email Service |
| Razorpay | 2.x | Payment Gateway |
| PDFKit | - | PDF Generation |
| Winston | 3.x | Logging |

---

## 3. Features List

### 3.1 Authentication & Authorization
- User registration with email/password
- Login with JWT tokens (access + refresh)
- Password encryption with bcrypt
- Protected routes with middleware
- Session management

### 3.2 Loan Management
- Add new loans (personal, education, home, vehicle, credit card, business)
- Edit existing loans
- Delete loans
- Track loan status (active, closed, overdue, paused)
- View loan details and history

### 3.3 EMI Calculator
- Automatic EMI calculation using standard formula
- Support for different interest rates and tenures
- Remaining balance calculation
- Paid months tracking

### 3.4 Payment Tracking
- Record payments for each loan
- Payment history
- Payment reminders
- Auto-update remaining balance

### 3.5 Bank Account Management
- Add multiple bank accounts
- Track account balances
- Transaction history

### 3.6 Dashboard
- Total debt overview
- Monthly EMI summary
- Active loans count
- Visual charts and graphs
- Recent transactions

### 3.7 AI Advisor
- Personalized debt reduction strategies
- Loan optimization suggestions
- Financial advice based on user data
- Integration with OpenAI API

### 3.8 Chatbot
- Interactive financial assistant
- Quick answers to common questions
- Guidance through app features

### 3.9 Notifications
- Email notifications for payment reminders
- EMI due date alerts
- Loan status updates

### 3.10 Reports
- PDF statement generation
- Export loan details
- Payment history reports

### 3.11 Admin Features
- User management
- System monitoring
- Analytics

---

## 4. Project Architecture

### Directory Structure

```
smart-debt-manager/
├── backend/
│   ├── config/          # Configuration files
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth, validation, error handling
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── services/        # External services
│   ├── utils/           # Helper functions
│   ├── logs/            # Application logs
│   ├── server.js        # Entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/         # API configuration
    │   ├── components/  # Reusable components
    │   ├── pages/       # Page components
    │   ├── store/       # Redux store & slices
    │   ├── hooks/       # Custom hooks
    │   ├── utils/       # Helper functions
    │   ├── App.jsx      # Main app component
    │   └── main.jsx     # Entry point
    ├── index.html
    ├── package.json
    └── vite.config.js
```

### Database Schema

#### User Model
- `_id`: ObjectId
- `name`: String
- `email`: String (unique)
- `password`: String (hashed)
- `role`: String (user/admin)
- `createdAt`: Date
- `updatedAt`: Date

#### Loan Model
- `_id`: ObjectId
- `user`: ObjectId (ref: User)
- `name`: String
- `type`: String (personal/education/home/vehicle/credit_card/business/other)
- `lender`: String
- `principal`: Number
- `interestRate`: Number
- `tenureMonths`: Number
- `emi`: Number
- `remainingBalance`: Number
- `status`: String (active/closed/overdue/paused)
- `startDate`: Date
- `dueDate`: Date
- `paidMonths`: Number
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

#### Payment Model
- `_id`: ObjectId
- `user`: ObjectId (ref: User)
- `loan`: ObjectId (ref: Loan)
- `amount`: Number
- `date`: Date
- `method`: String
- `notes`: String
- `createdAt`: Date

#### BankAccount Model
- `_id`: ObjectId
- `user`: ObjectId (ref: User)
- `bankName`: String
- `accountNumber`: String (encrypted)
- `accountType`: String
- `balance`: Number
- `createdAt`: Date
- `updatedAt`: Date

#### Transaction Model
- `_id`: ObjectId
- `user`: ObjectId (ref: User)
- `bankAccount`: ObjectId (ref: BankAccount)
- `type`: String (credit/debit)
- `amount`: Number
- `description`: String
- `date`: Date
- `createdAt`: Date

---

## 5. API Endpoints

### Authentication Routes (`/api/v1/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | User login |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | User logout |

### User Routes (`/api/v1/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get user profile |
| PUT | `/profile` | Update profile |
| DELETE | `/account` | Delete account |

### Loan Routes (`/api/v1/loans`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all loans |
| GET | `/dashboard` | Get dashboard data |
| GET | `/:id` | Get single loan |
| POST | `/` | Create loan |
| PUT | `/:id` | Update loan |
| DELETE | `/:id` | Delete loan |

### Payment Routes (`/api/v1/payments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all payments |
| GET | `/loan/:loanId` | Get payments for loan |
| POST | `/` | Record payment |
| DELETE | `/:id` | Delete payment |

### Bank Routes (`/api/v1/bank`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/accounts` | Get bank accounts |
| POST | `/accounts` | Add bank account |
| PUT | `/accounts/:id` | Update account |
| DELETE | `/accounts/:id` | Delete account |
| GET | `/transactions` | Get transactions |
| POST | `/transactions` | Add transaction |

### AI Routes (`/api/v1/ai`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/advisor` | Get AI financial advice |
| POST | `/chat` | Chat with AI assistant |

### Notification Routes (`/api/v1/notifications`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get notifications |
| POST | `/send` | Send notification |
| GET | `/reminders` | Get payment reminders |

---

## 6. Security Features

1. **JWT Authentication** - Access and refresh tokens
2. **Password Encryption** - Bcrypt hashing
3. **Data Encryption** - AES-256 for sensitive data
4. **Input Validation** - Joi validation
5. **Rate Limiting** - Prevent brute force attacks
6. **CORS** - Cross-origin resource sharing
7. **Helmet** - HTTP security headers
8. **Mongo Sanitize** - Prevent NoSQL injection
9. **XSS Protection** - Prevent cross-site scripting

---

## 7. UI/UX Features

1. **Responsive Design** - Works on mobile, tablet, desktop
2. **Dark Theme** - Modern dark interface
3. **Interactive Charts** - Visual data representation
4. **Toast Notifications** - User feedback
5. **Loading States** - Better UX
6. **Form Validation** - Input validation with feedback
7. **Modal Dialogs** - Clean interaction patterns

---

## 8. Deployment

### Development
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Production
- Backend: Render / Railway / Vercel
- Frontend: Vercel / Netlify
- Database: MongoDB Atlas

---

## 9. Future Enhancements

1. **Bank API Integration** - Connect to real banks via Plaid
2. **Credit Score API** - Fetch credit score
3. **Mobile App** - React Native / Flutter
4. **Multi-language Support** - Regional languages
5. **Investment Tracking** - Extend to investments
6. **Budget Planning** - Monthly budget features
7. **Tax Calculator** - Tax saving suggestions

---

## 10. Conclusion

Smart Debt Manager is a comprehensive, production-ready application for managing personal debt. It provides a clean interface for tracking multiple loans, calculating EMIs, recording payments, and receiving AI-powered financial advice. The application is built using modern technologies and follows best practices for security, scalability, and user experience.

---

*Report generated: April 2026*
*Technology: MERN Stack*
*License: Open Source*