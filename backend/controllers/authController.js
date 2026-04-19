const User = require('../models/User');
const { Notification } = require('../models/BankAccount');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require('../utils/jwt');
const { sendWelcomeEmail } = require('../services/emailService');
const logger = require('../utils/logger');

// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch((err) =>
      logger.warn('Welcome email failed:', err.message)
    );

    // Welcome notification
    await Notification.create({
      user: user._id,
      type: 'system',
      title: 'Welcome to Smart Debt Manager!',
      message: 'Start by adding your loans and setting up your financial profile.',
    });

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.refreshTokens.push({
      token: refreshToken,
      ipAddress: req.ipAddress,
      deviceInfo: req.deviceInfo,
      expiresAt,
    });
    user.logActivity('register', req.ipAddress, req.deviceInfo);
    await user.save();

    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user: user.toSafeJSON(), accessToken },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const deviceInfo = req.headers['user-agent'] || 'Unknown';

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to too many failed attempts. Try again in 30 minutes.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await user.resetLoginAttempts();
    user.logActivity('login', ipAddress, deviceInfo);

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });

    // Keep max 5 active sessions
    if (user.refreshTokens.length >= 5) user.refreshTokens.shift();
    user.refreshTokens.push({
      token: refreshToken,
      ipAddress,
      deviceInfo,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await user.save();

    setRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: user.toSafeJSON(), accessToken },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    const storedToken = user.refreshTokens.find((t) => t.token === token);
    if (!storedToken) {
      // Possible token reuse attack - clear all tokens
      user.refreshTokens = [];
      await user.save();
      return res.status(401).json({ success: false, message: 'Refresh token reuse detected' });
    }

    // Rotate refresh token
    user.refreshTokens = user.refreshTokens.filter((t) => t.token !== token);
    const newRefreshToken = generateRefreshToken({ id: user._id });
    user.refreshTokens.push({
      token: newRefreshToken,
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      deviceInfo: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await user.save();

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    setRefreshCookie(res, newRefreshToken);

    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token && req.user) {
      req.user.refreshTokens = req.user.refreshTokens.filter((t) => t.token !== token);
      req.user.logActivity('logout', req.ipAddress, req.deviceInfo);
      await req.user.save();
    }
    clearRefreshCookie(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── Get Me ───────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, data: { user: req.user.toSafeJSON() } });
};
