'use strict';
const socialRepo = require('./social.repository');
const authRepo = require('../auth/auth.repository');
const AppError = require('../../utils/AppError');
const { buildCursorMeta } = require('../../utils/pagination');

const followUser = async (followerId, followingId) => {
  if (followerId === followingId) {
    throw AppError.badRequest('You cannot follow yourself');
  }

  const targetUser = await authRepo.findById(followingId);
  if (!targetUser) throw AppError.notFound('Target user not found');

  const alreadyFollowing = await socialRepo.isFollowing(followerId, followingId);
  if (alreadyFollowing) return;

  await socialRepo.followUser(followerId, followingId);

  // Send notification to followed user
  const follower = await authRepo.findById(followerId);
  await socialRepo.createNotification({
    userId: followingId,
    type: 'follow',
    senderId: followerId,
    entityId: followerId,
    message: `${follower.display_name} started following you`,
  });
};

const unfollowUser = async (followerId, followingId) => {
  await socialRepo.unfollowUser(followerId, followingId);
};

const getNotifications = async (userId) => {
  return socialRepo.findNotificationsByUserId(userId);
};

const markNotificationSeen = async (id, userId) => {
  await socialRepo.markSeen(id, userId);
};

const getSocialFeed = async (userId, { limit = 20, cursor = null }) => {
  const rows = await socialRepo.getFollowerFeed(userId, limit, cursor);
  const hasNext = rows.length > limit;
  const items = hasNext ? rows.slice(0, limit) : rows;
  return { items, meta: buildCursorMeta(items, limit) };
};

module.exports = {
  followUser,
  unfollowUser,
  getNotifications,
  markNotificationSeen,
  getSocialFeed,
};
