'use strict';
const { query, withTransaction } = require('../../config/db');

const findByUserId = async (userId) => {
  const result = await query(
    `SELECT pt.*,
       (SELECT COUNT(*) FROM checklist_items ci WHERE ci.planned_trip_id = pt.id) AS checklist_count,
       (SELECT COUNT(*) FROM planned_trip_destinations ptd WHERE ptd.planned_trip_id = pt.id) AS destination_count
     FROM planned_trips pt
     WHERE pt.user_id = $1
     ORDER BY pt.created_at DESC`,
    [userId]
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await query(
    `SELECT pt.*,
       json_agg(DISTINCT jsonb_build_object(
         'id', d.id, 'name', d.name, 'country', d.country,
         'visit_order', ptd.visit_order
       )) FILTER (WHERE d.id IS NOT NULL) AS destinations,
       json_agg(DISTINCT jsonb_build_object(
         'id', ci.id, 'text', ci.text, 'is_done', ci.is_done, 'sort_order', ci.sort_order
       )) FILTER (WHERE ci.id IS NOT NULL) AS checklist
     FROM planned_trips pt
     LEFT JOIN planned_trip_destinations ptd ON ptd.planned_trip_id = pt.id
     LEFT JOIN destinations d ON d.id = ptd.destination_id
     LEFT JOIN checklist_items ci ON ci.planned_trip_id = pt.id
     WHERE pt.id = $1
     GROUP BY pt.id`,
    [id]
  );
  return result.rows[0] || null;
};

const create = async (userId, { title, notes, budget_cents, currency, start_window, end_window }) => {
  const result = await query(
    `INSERT INTO planned_trips (user_id, title, notes, budget_cents, currency, start_window, end_window)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, title, notes || null, budget_cents || null, currency || 'USD', start_window || null, end_window || null]
  );
  return result.rows[0];
};

const update = async (id, userId, fields) => {
  const allowed = ['title', 'notes', 'budget_cents', 'currency', 'start_window', 'end_window', 'status'];
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
    `UPDATE planned_trips SET ${updates.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

const deleteById = async (id, userId) => {
  const result = await query(
    'DELETE FROM planned_trips WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  return result.rows[0] || null;
};

// Checklist operations
const addChecklistItem = async (plannedTripId, { text, sort_order }) => {
  const result = await query(
    `INSERT INTO checklist_items (planned_trip_id, text, sort_order) VALUES ($1, $2, $3) RETURNING *`,
    [plannedTripId, text, sort_order || 0]
  );
  return result.rows[0];
};

const updateChecklistItem = async (itemId, plannedTripId, { text, is_done, sort_order }) => {
  const result = await query(
    `UPDATE checklist_items SET
       text = COALESCE($1, text),
       is_done = COALESCE($2, is_done),
       sort_order = COALESCE($3, sort_order)
     WHERE id = $4 AND planned_trip_id = $5
     RETURNING *`,
    [text || null, is_done !== undefined ? is_done : null, sort_order || null, itemId, plannedTripId]
  );
  return result.rows[0] || null;
};

const deleteChecklistItem = async (itemId, plannedTripId) => {
  await query(
    'DELETE FROM checklist_items WHERE id = $1 AND planned_trip_id = $2',
    [itemId, plannedTripId]
  );
};

module.exports = {
  findByUserId, findById, create, update, deleteById,
  addChecklistItem, updateChecklistItem, deleteChecklistItem,
};
