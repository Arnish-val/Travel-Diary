'use strict';
const { query } = require('../../config/db');

const search = async ({ q, tags, minRating, limit, offset }) => {
  const params = [];
  const conditions = [];
  let idx = 1;

  if (q && q.trim()) {
    params.push(q.trim());
    conditions.push(`d.search_vector @@ plainto_tsquery('english', $${idx})`);
    idx++;
  }

  if (minRating) {
    params.push(parseFloat(minRating));
    conditions.push(`COALESCE(avg_r.avg_score, 0) >= $${idx}`);
    idx++;
  }

  const tagJoin = tags?.length
    ? `JOIN (
        SELECT destination_id FROM ratings r2
        JOIN rating_tags rt ON rt.rating_id = r2.id
        WHERE rt.tag_id = ANY($${idx}::int[])
        GROUP BY destination_id
       ) tagged ON tagged.destination_id = d.id`
    : '';

  if (tags?.length) {
    params.push(tags.map(Number));
    idx++;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit, offset);

  const sql = `
    SELECT
      d.*,
      COALESCE(avg_r.avg_score, 0) AS avg_rating,
      COALESCE(avg_r.rating_count, 0) AS rating_count,
      ${q ? `ts_rank(d.search_vector, plainto_tsquery('english', $1))` : '0'} AS rank
    FROM destinations d
    LEFT JOIN (
      SELECT destination_id, AVG(score)::numeric(3,2) AS avg_score, COUNT(*) AS rating_count
      FROM ratings GROUP BY destination_id
    ) avg_r ON avg_r.destination_id = d.id
    ${tagJoin}
    ${whereClause}
    ORDER BY ${q ? 'rank DESC,' : ''} avg_rating DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  const countSql = `
    SELECT COUNT(*) FROM destinations d
    LEFT JOIN (
      SELECT destination_id, AVG(score) AS avg_score FROM ratings GROUP BY destination_id
    ) avg_r ON avg_r.destination_id = d.id
    ${tagJoin}
    ${whereClause}
  `;

  const [dataResult, countResult] = await Promise.all([
    query(sql, params),
    query(countSql, params.slice(0, idx - 1)),
  ]);

  return { items: dataResult.rows, total: parseInt(countResult.rows[0].count, 10) };
};

const findById = async (id) => {
  const result = await query(
    `SELECT d.*,
       COALESCE(avg_r.avg_score, 0) AS avg_rating,
       COALESCE(avg_r.rating_count, 0) AS rating_count
     FROM destinations d
     LEFT JOIN (
       SELECT destination_id, AVG(score)::numeric(3,2) AS avg_score, COUNT(*) AS rating_count
       FROM ratings GROUP BY destination_id
     ) avg_r ON avg_r.destination_id = d.id
     WHERE d.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const create = async ({ name, country, latitude, longitude, description }) => {
  const result = await query(
    `INSERT INTO destinations (name, country, latitude, longitude, description)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, country, latitude, longitude, description || null]
  );
  return result.rows[0];
};

const autocomplete = async (q, limit = 10) => {
  const result = await query(
    `SELECT id, name, country
     FROM destinations
     WHERE name ILIKE $1 OR country ILIKE $1
     ORDER BY name
     LIMIT $2`,
    [`${q}%`, limit]
  );
  return result.rows;
};

module.exports = { search, findById, create, autocomplete };
