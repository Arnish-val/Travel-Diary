'use strict';
const { query, withTransaction } = require('../../config/db');

const findByDestination = async (destinationId) => {
  const result = await query(
    `SELECT r.*,
       u.display_name, u.avatar_url,
       json_agg(t.name) FILTER (WHERE t.id IS NOT NULL) AS tags
     FROM ratings r
     JOIN users u ON u.id = r.user_id
     LEFT JOIN rating_tags rt ON rt.rating_id = r.id
     LEFT JOIN tags t ON t.id = rt.tag_id
     WHERE r.destination_id = $1
     GROUP BY r.id, u.display_name, u.avatar_url
     ORDER BY r.created_at DESC`,
    [destinationId]
  );
  return result.rows;
};

const findAggregate = async (destinationId) => {
  const result = await query(
    `SELECT
       AVG(score)::numeric(3,2) AS avg_score,
       COUNT(*) AS total_ratings,
       json_object_agg(score, cnt) AS score_distribution
     FROM (
       SELECT score, COUNT(*) AS cnt FROM ratings
       WHERE destination_id = $1 GROUP BY score
     ) dist`,
    [destinationId]
  );
  return result.rows[0];
};

const create = async (userId, destinationId, { score, review, tagIds }) => {
  return withTransaction(async (client) => {
    const ratingResult = await client.query(
      `INSERT INTO ratings (user_id, destination_id, score, review)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, destinationId, score, review || null]
    );
    const rating = ratingResult.rows[0];

    if (tagIds?.length) {
      const tagValues = tagIds.map((tid, i) => `($1, $${i + 2})`).join(', ');
      await client.query(
        `INSERT INTO rating_tags (rating_id, tag_id) VALUES ${tagValues}
         ON CONFLICT DO NOTHING`,
        [rating.id, ...tagIds]
      );
    }

    return rating;
  });
};

const update = async (ratingId, userId, { score, review, tagIds }) => {
  return withTransaction(async (client) => {
    const updates = [];
    const vals = [];
    let i = 1;
    if (score !== undefined) { updates.push(`score = $${i}`); vals.push(score); i++; }
    if (review !== undefined) { updates.push(`review = $${i}`); vals.push(review); i++; }

    let updated = null;
    if (updates.length) {
      vals.push(ratingId, userId);
      const result = await client.query(
        `UPDATE ratings SET ${updates.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING *`,
        vals
      );
      updated = result.rows[0];
    }

    if (tagIds !== undefined) {
      await client.query('DELETE FROM rating_tags WHERE rating_id = $1', [ratingId]);
      if (tagIds.length) {
        const tagValues = tagIds.map((tid, idx) => `($1, $${idx + 2})`).join(', ');
        await client.query(
          `INSERT INTO rating_tags (rating_id, tag_id) VALUES ${tagValues}`,
          [ratingId, ...tagIds]
        );
      }
    }

    return updated;
  });
};

const deleteById = async (ratingId, userId) => {
  const result = await query(
    'DELETE FROM ratings WHERE id = $1 AND user_id = $2 RETURNING id',
    [ratingId, userId]
  );
  return result.rows[0] || null;
};

module.exports = { findByDestination, findAggregate, create, update, deleteById };
