'use strict';
const { query, withTransaction } = require('../../config/db');

const SORT_MAP = {
  newest: 'created_at DESC',
  oldest: 'created_at ASC',
  start_date: 'start_date DESC',
};

const findByUserIdCursor = async (userId, { limit, cursor, sort }) => {
  const orderBy = SORT_MAP[sort] || SORT_MAP.newest;
  const params = [userId, limit + 1];
  let cursorClause = '';
  if (cursor) {
    params.push(cursor);
    cursorClause = `AND id < $${params.length}`;
  }

  const result = await query(
    `SELECT t.*,
       (SELECT COUNT(*) FROM media m WHERE m.trip_id = t.id) AS media_count,
       (SELECT COUNT(*) FROM trip_destinations td WHERE td.trip_id = t.id) AS destination_count
     FROM trips t
     WHERE t.user_id = $1 ${cursorClause}
     ORDER BY ${orderBy}
     LIMIT $2`,
    params
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await query(
    `SELECT t.*,
       json_agg(DISTINCT jsonb_build_object(
         'id', d.id, 'name', d.name, 'country', d.country,
         'latitude', d.latitude, 'longitude', d.longitude,
         'visit_order', td.visit_order
       )) FILTER (WHERE d.id IS NOT NULL) AS destinations,
       (SELECT COUNT(*) FROM media m WHERE m.trip_id = t.id) AS media_count
     FROM trips t
     LEFT JOIN trip_destinations td ON td.trip_id = t.id
     LEFT JOIN destinations d ON d.id = td.destination_id
     WHERE t.id = $1
     GROUP BY t.id`,
    [id]
  );
  return result.rows[0] || null;
};

const create = async (userId, { title, description, start_date, end_date, privacy }) => {
  const result = await query(
    `INSERT INTO trips (user_id, title, description, start_date, end_date, privacy)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, title, description || null, start_date, end_date, privacy]
  );
  return result.rows[0];
};

const update = async (id, userId, fields) => {
  const allowed = ['title', 'description', 'start_date', 'end_date', 'privacy', 'cover_photo_url'];
  const updates = [];
  const values = [];
  let idx = 1;

  for (const field of allowed) {
    if (fields[field] !== undefined) {
      updates.push(`${field} = $${idx}`);
      values.push(fields[field]);
      idx++;
    }
  }

  if (!updates.length) return null;
  updates.push(`updated_at = NOW()`);
  values.push(id, userId);

  const result = await query(
    `UPDATE trips SET ${updates.join(', ')}
     WHERE id = $${idx} AND user_id = $${idx + 1}
     RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

const deleteById = async (id, userId) => {
  const result = await query(
    'DELETE FROM trips WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  return result.rows[0] || null;
};

const addDestination = async (tripId, destinationId, visitOrder = 1) => {
  await query(
    `INSERT INTO trip_destinations (trip_id, destination_id, visit_order)
     VALUES ($1, $2, $3)
     ON CONFLICT (trip_id, destination_id) DO UPDATE SET visit_order = $3`,
    [tripId, destinationId, visitOrder]
  );
};

const removeDestination = async (tripId, destinationId) => {
  await query(
    'DELETE FROM trip_destinations WHERE trip_id = $1 AND destination_id = $2',
    [tripId, destinationId]
  );
};

const findDestinations = async (tripId) => {
  const result = await query(
    `SELECT d.*, td.visit_order
     FROM destinations d
     JOIN trip_destinations td ON td.destination_id = d.id
     WHERE td.trip_id = $1
     ORDER BY td.visit_order`,
    [tripId]
  );
  return result.rows;
};

module.exports = {
  findByUserIdCursor,
  findById,
  create,
  update,
  deleteById,
  addDestination,
  removeDestination,
  findDestinations,
};
