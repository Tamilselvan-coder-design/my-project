const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // Financial profile (encrypted at app level)
    financialProfile: {
      salary: { type: Number, default: 0 },           // encrypted
      monthlyExpenses: { type: Number, default: 0 },  // encrypted
      financialGoals: { type: String, default: '' },
      currency: { type: String, default: 'INR' },
    },
    // Security & session tracking
    refreshTokens: [
      {
        token: String,
        deviceInfo: String,
        ipAddress: String,
        createdAt: { type: Date, default: Date.now },
        expiresAt: Date,
      },
    ],
    activityLog: [
      {
        action: String,
        ipAddress: String,
        deviceInfo: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    lastLogin: Date,
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    avatar: String,
    preferences: {
      darkMode: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: true },
      reminderDays: { type: Number, default: 3 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ─── Pre-save: Hash password ──────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Methods ──────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.incLoginAttempts = async function () {
  // Lock for 30 minutes after 5 failed attempts
  if (this.failedLoginAttempts + 1 >= 5) {
    this.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
  }
  this.failedLoginAttempts += 1;
  return this.save();
};

userSchema.methods.resetLoginAttempts = async function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = new Date();
  return this.save();
};

userSchema.methods.logActivity = function (action, ipAddress, deviceInfo) {
  // Keep last 50 activity logs
  if (this.activityLog.length >= 50) this.activityLog.shift();
  this.activityLog.push({ action, ipAddress, deviceInfo });
};

// Remove sensitive fields from JSON output
userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.failedLoginAttempts;
  delete obj.lockUntil;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
