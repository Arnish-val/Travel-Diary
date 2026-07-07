'use strict';
const { query } = require('../../config/db');

const followUser = async (followerId, followingId) => {
  await query(
    `INSERT INTO follows (follower_id, following_id)
     VALUES ($1, $2)
     ON CONFLICT (follower_id, following_id) DO NOTHING`,
    [followerId, followingId]
  );
};

const unfollowUser = async (followerId, followingId) => {
  await query(
    `DELETE FROM follows
     WHERE follower_id = $1 AND following_id = $2`,
    [followerId, followingId]
  );
};

const isFollowing = async (followerId, followingId) => {
  const result = await query(
    `SELECT 1 FROM follows
     WHERE follower_id = $1 AND following_id = $2`,
    [followerId, followingId]
  );
  return result.rows.length > 0;
};

const createNotification = async ({ userId, type, senderId, entityId, message }) => {
  const result = await query(
    `INSERT INTO notifications (user_id, type, sender_id, entity_id, message)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, type, senderId, entityId || null, message]
  );
  return result.rows[0];
};

const findNotificationsByUserId = async (userId, limit = 20) => {
  const result = await query(
    `SELECT n.*, u.display_name AS sender_name, u.avatar_url AS sender_avatar
     FROM notifications n
     LEFT JOIN users u ON u.id = n.sender_id
     WHERE n.user_id = $1
     ORDER BY n.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
};

const markSeen = async (id, userId) => {
  await query(
    `UPDATE notifications SET seen = true
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
};

const getFollowerFeed = async (userId, limit = 20, cursor = null) => {
  const params = [userId, limit + 1];
  let cursorClause = '';
  if (cursor) {
    params.push(cursor);
    cursorClause = `AND t.id < $3`;
  }

  const result = await query(
    `SELECT t.*, u.display_name AS owner_name, u.avatar_url AS owner_avatar,
       (SELECT COUNT(*) FROM media m WHERE m.trip_id = t.id) AS media_count,
       (SELECT COUNT(*) FROM trip_destinations td WHERE td.trip_id = t.id) AS destination_count
     FROM trips t
     JOIN users u ON u.id = t.user_id
     JOIN follows f ON f.following_id = t.user_id
     WHERE f.follower_id = $1 AND t.privacy = 'public' ${cursorClause}
     ORDER BY t.created_at DESC
     LIMIT $2`,
    params
  );
  return result.rows;
};

module.exports = {
  followUser,
  unfollowUser,
  isFollowing,
  createNotification,
  findNotificationsByUserId,
  markSeen,
  getFollowerFeed,
};
