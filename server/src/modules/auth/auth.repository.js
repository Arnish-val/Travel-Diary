'use strict';
const { query } = require('../../config/db');

const findByEmail = async (email) => {
  const result = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await query(
    `SELECT id, email, display_name, avatar_url, bio, home_location, preferences, created_at
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const create = async ({ email, password_hash, display_name, home_location }) => {
  const result = await query(
    `INSERT INTO users (email, password_hash, display_name, home_location)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, display_name, home_location, created_at`,
    [email, password_hash, display_name, home_location || null]
  );
  return result.rows[0];
};

const update = async (id, fields) => {
  const allowedFields = ['display_name', 'bio', 'home_location', 'avatar_url', 'preferences'];
  const updates = [];
  const values = [];
  let idx = 1;

  for (const field of allowedFields) {
    if (fields[field] !== undefined) {
      updates.push(`${field} = $${idx}`);
      values.push(typeof fields[field] === 'object' ? JSON.stringify(fields[field]) : fields[field]);
      idx++;
    }
  }

  if (!updates.length) return null;

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}
     RETURNING id, email, display_name, avatar_url, bio, home_location, preferences, updated_at`,
    values
  );
  return result.rows[0] || null;
};

const deleteById = async (id) => {
  await query('DELETE FROM users WHERE id = $1', [id]);
};

const storeRefreshToken = async (userId, tokenHash, expiresAt) => {
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, token_hash) DO NOTHING`,
    [userId, tokenHash, expiresAt]
  );
};

const findRefreshToken = async (userId, tokenHash) => {
  const result = await query(
    `SELECT * FROM refresh_tokens
     WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW() AND revoked = false`,
    [userId, tokenHash]
  );
  return result.rows[0] || null;
};

const revokeRefreshToken = async (userId, tokenHash) => {
  await query(
    `UPDATE refresh_tokens SET revoked = true
     WHERE user_id = $1 AND token_hash = $2`,
    [userId, tokenHash]
  );
};

const revokeAllRefreshTokens = async (userId) => {
  await query(
    `UPDATE refresh_tokens SET revoked = true WHERE user_id = $1`,
    [userId]
  );
};

module.exports = {
  findByEmail,
  findById,
  create,
  update,
  deleteById,
  storeRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
};
