'use strict';
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../../config/env');
const AppError = require('../../utils/AppError');
const authRepo = require('./auth.repository');

const BCRYPT_ROUNDS = 12;

/**
 * Hash a password using bcrypt.
 */
const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);

/**
 * Compare plain password against hash.
 */
const comparePassword = (password, hash) => bcrypt.compare(password, hash);

/**
 * Issue a short-lived JWT access token.
 */
const issueAccessToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY || '15m' }
  );

/**
 * Issue an opaque refresh token (UUID) and store its hash in DB.
 */
const issueRefreshToken = async (userId) => {
  const token = crypto.randomUUID();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await authRepo.storeRefreshToken(userId, tokenHash, expiresAt);
  return token;
};

/**
 * Register a new user.
 */
const register = async ({ email, password, display_name, home_location }) => {
  const existing = await authRepo.findByEmail(email);
  if (existing) {
    throw AppError.conflict('An account with this email already exists');
  }

  const password_hash = await hashPassword(password);
  const user = await authRepo.create({ email, password_hash, display_name, home_location });

  const accessToken = issueAccessToken(user);
  const refreshToken = await issueRefreshToken(user.id);

  return { user, accessToken, refreshToken };
};

/**
 * Login with email and password.
 */
const login = async ({ email, password }) => {
  const user = await authRepo.findByEmail(email);
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const passwordMatch = await comparePassword(password, user.password_hash);
  if (!passwordMatch) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const { password_hash: _, ...safeUser } = user;

  const accessToken = issueAccessToken(safeUser);
  const refreshToken = await issueRefreshToken(safeUser.id);

  return { user: safeUser, accessToken, refreshToken };
};

/**
 * Rotate refresh token — validate old token, issue new access + refresh token pair.
 */
const refreshTokens = async (oldRefreshToken) => {
  if (!oldRefreshToken) {
    throw AppError.unauthorized('No refresh token provided');
  }

  const tokenHash = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');

  // We need to find which user this token belongs to — search across all users
  const { query } = require('../../config/db');
  const result = await query(
    `SELECT rt.*, u.id as uid, u.email FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1 AND rt.expires_at > NOW() AND rt.revoked = false`,
    [tokenHash]
  );

  const tokenRecord = result.rows[0];
  if (!tokenRecord) {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }

  // Revoke the used token (rotation)
  await authRepo.revokeRefreshToken(tokenRecord.user_id, tokenHash);

  const user = { id: tokenRecord.uid, email: tokenRecord.email };
  const accessToken = issueAccessToken(user);
  const newRefreshToken = await issueRefreshToken(user.id);

  return { accessToken, refreshToken: newRefreshToken };
};

/**
 * Logout — revoke refresh token.
 */
const logout = async (userId, refreshToken) => {
  if (refreshToken) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await authRepo.revokeRefreshToken(userId, tokenHash);
  }
};

/**
 * Get current user profile.
 */
const getMe = async (userId) => {
  const user = await authRepo.findById(userId);
  if (!user) throw AppError.notFound('User not found');
  return user;
};

/**
 * Update user profile.
 */
const updateProfile = async (userId, fields) => {
  const updated = await authRepo.update(userId, fields);
  if (!updated) throw AppError.notFound('User not found');
  return updated;
};

module.exports = { register, login, refreshTokens, logout, getMe, updateProfile };
