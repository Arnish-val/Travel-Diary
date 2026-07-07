'use strict';
const rateLimit = require('express-rate-limit');
const env = require('../config/env');

/**
 * General API rate limiter: 100 req/min per IP.
 */
const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS || 60000,
  max: env.RATE_LIMIT_MAX || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
  },
});

/**
 * Strict limiter for auth endpoints: 5 req/min per IP.
 * Prevents brute-force attacks.
 */
const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS || 60000,
  max: env.AUTH_RATE_LIMIT_MAX || 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later.',
  },
  skipSuccessfulRequests: true,
});

/**
 * Upload rate limiter: 20 uploads/min per user.
 */
const uploadLimiter = rateLimit({
  windowMs: 60000,
  max: 20,
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Upload rate limit exceeded.',
  },
});

module.exports = { generalLimiter, authLimiter, uploadLimiter };
