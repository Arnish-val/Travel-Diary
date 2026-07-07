'use strict';
const authService = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const env = require('../../config/env');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
};

const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  res.status(201).json({ status: 'success', data: { user, accessToken } });
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  res.status(200).json({ status: 'success', data: { user, accessToken } });
});

const refresh = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies?.refreshToken;
  const { accessToken, refreshToken } = await authService.refreshTokens(oldRefreshToken);
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  res.status(200).json({ status: 'success', data: { accessToken } });
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  await authService.logout(req.user.id, refreshToken);
  res.clearCookie('refreshToken');
  res.status(200).json({ status: 'success', message: 'Logged out successfully' });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.status(200).json({ status: 'success', data: { user } });
});

const updateMe = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  res.status(200).json({ status: 'success', data: { user } });
});

module.exports = { register, login, refresh, logout, getMe, updateMe };
