'use strict';
const socialService = require('./social.service');
const asyncHandler = require('../../utils/asyncHandler');
const { parseCursorPagination } = require('../../utils/pagination');

const follow = asyncHandler(async (req, res) => {
  await socialService.followUser(req.user.id, req.params.id);
  res.status(200).json({ status: 'success', message: 'User followed successfully' });
});

const unfollow = asyncHandler(async (req, res) => {
  await socialService.unfollowUser(req.user.id, req.params.id);
  res.status(200).json({ status: 'success', message: 'User unfollowed successfully' });
});

const getNotifications = asyncHandler(async (req, res) => {
  const items = await socialService.getNotifications(req.user.id);
  res.json({ status: 'success', data: { items } });
});

const markNotificationSeen = asyncHandler(async (req, res) => {
  await socialService.markNotificationSeen(req.params.id, req.user.id);
  res.status(200).json({ status: 'success', message: 'Notification marked as seen' });
});

const getFeed = asyncHandler(async (req, res) => {
  const { limit, cursor } = parseCursorPagination(req.query);
  const result = await socialService.getSocialFeed(req.user.id, { limit, cursor });
  res.json({ status: 'success', ...result });
});

module.exports = {
  follow,
  unfollow,
  getNotifications,
  markNotificationSeen,
  getFeed,
};
