const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Protect routes - verify JWT access token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Fetch user
    const user = await User.findById(decoded.id).select('-password -refreshTokens');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated' });
    }

    // Attach user and IP info to request
    req.user = user;
    req.ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    req.deviceInfo = req.headers['user-agent'] || 'Unknown';

    next();
  } catch (err) {
    logger.error('Auth middleware error:', err);
    res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
};

/**
 * Restrict routes to specific roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access forbidden: insufficient permissions' });
    }
    next();
  };
};

module.exports = { protect, restrictTo };
