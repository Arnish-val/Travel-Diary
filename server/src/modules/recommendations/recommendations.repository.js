'use strict';
const { query } = require('../../config/db');

/**
 * Get recommendations stored in DB for a user.
 */
const findStoredRecommendations = async (userId, limit = 10) => {
  const result = await query(
    `SELECT r.*,
       d.name, d.country, d.latitude, d.longitude, d.description,
       COALESCE(avg_r.avg_score, 0) AS avg_rating
     FROM recommendations r
     JOIN destinations d ON d.id = r.destination_id
     LEFT JOIN (
       SELECT destination_id, AVG(score)::numeric(3,2) AS avg_score
       FROM ratings GROUP BY destination_id
     ) avg_r ON avg_r.destination_id = d.id
     WHERE r.user_id = $1 AND r.dismissed = false
     ORDER BY r.score DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
};

/**
 * Compute recommendations dynamically via content-based filtering in SQL.
 */
const computeContentRecommendations = async (userId, limit = 10) => {
  const result = await query(
    `WITH user_tag_preferences AS (
       -- Get average score user gives to destinations associated with each tag
       SELECT
         rt.tag_id,
         AVG(r.score) AS pref_score
       FROM ratings r
       JOIN rating_tags rt ON rt.rating_id = r.id
       WHERE r.user_id = $1
       GROUP BY rt.tag_id
     ),
     dest_tag_counts AS (
       -- Total ratings for each destination
       SELECT
         destination_id,
         COUNT(*)::float AS total_ratings
       FROM ratings
       GROUP BY destination_id
     ),
     dest_tag_weights AS (
       -- Frequency of each tag per destination
       SELECT
         r.destination_id,
         rt.tag_id,
         COUNT(*)::float / dtc.total_ratings AS tag_weight
       FROM ratings r
       JOIN rating_tags rt ON rt.rating_id = r.id
       JOIN dest_tag_counts dtc ON dtc.destination_id = r.destination_id
       GROUP BY r.destination_id, rt.tag_id, dtc.total_ratings
     )
     SELECT
       d.id AS destination_id,
       SUM(utp.pref_score * dtw.tag_weight)::numeric(5,4) AS score,
       'Based on your preference for ' || string_agg(t.name, ', ' ORDER BY utp.pref_score DESC) AS reason
     FROM destinations d
     JOIN dest_tag_weights dtw ON dtw.destination_id = d.id
     JOIN user_tag_preferences utp ON utp.tag_id = dtw.tag_id
     JOIN tags t ON t.id = utp.tag_id
     WHERE d.id NOT IN (
       -- Exclude already rated
       SELECT destination_id FROM ratings WHERE user_id = $1
       UNION
       -- Exclude already visited in trips
       SELECT destination_id FROM trip_destinations td
       JOIN trips t2 ON t2.id = td.trip_id
       WHERE t2.user_id = $1
     )
     GROUP BY d.id
     ORDER BY score DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
};

/**
 * Save computed recommendations to database (upsert).
 */
const saveRecommendations = async (userId, recommendations) => {
  if (!recommendations || !recommendations.length) return;

  const values = [];
  const valueClauses = [];
  let idx = 1;

  for (const rec of recommendations) {
    valueClauses.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3})`);
    values.push(userId, rec.destination_id, rec.score, rec.reason);
    idx += 4;
  }

  await query(
    `INSERT INTO recommendations (user_id, destination_id, score, reason)
     VALUES ${valueClauses.join(', ')}
     ON CONFLICT (user_id, destination_id)
     DO UPDATE SET
       score = EXCLUDED.score,
       reason = EXCLUDED.reason,
       created_at = NOW()`,
    values
  );
};

/**
 * Mark recommendation as seen or dismissed.
 */
const updateStatus = async (id, userId, { seen, dismissed }) => {
  const updates = [];
  const params = [];
  let idx = 1;

  if (seen !== undefined) {
    updates.push(`seen = $${idx}`);
    params.push(seen);
    idx++;
  }
  if (dismissed !== undefined) {
    updates.push(`dismissed = $${idx}`);
    params.push(dismissed);
    idx++;
  }

  if (!updates.length) return null;

  params.push(id, userId);
  const result = await query(
    `UPDATE recommendations
     SET ${updates.join(', ')}
     WHERE id = $${idx} AND user_id = $${idx + 1}
     RETURNING *`,
    params
  );
  return result.rows[0] || null;
};

module.exports = {
  findStoredRecommendations,
  computeContentRecommendations,
  saveRecommendations,
  updateStatus,
};
