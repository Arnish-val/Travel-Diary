'use strict';
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Verifies JWT access token from Authorization header.
 * Attaches decoded payload to req.user.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('No access token provided');
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = payload; // { id, email, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw AppError.unauthorized('Access token expired');
    }
    throw AppError.unauthorized('Invalid access token');
  }
});

/**
 * Optional authentication — attaches user if token present, doesn't fail if absent.
 * Useful for endpoints that are public but return extra data for logged-in users.
 */
const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch {
    // Silently ignore invalid tokens for optional auth
  }
  next();
};

module.exports = { authenticate, optionalAuthenticate };
