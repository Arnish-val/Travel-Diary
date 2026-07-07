'use strict';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse cursor-based pagination parameters from query string.
 * @param {Object} query - Express req.query
 * @returns {{ limit: number, cursor: string|null }}
 */
const parseCursorPagination = (query) => {
  const limit = Math.min(parseInt(query.limit, 10) || DEFAULT_LIMIT, MAX_LIMIT);
  const cursor = query.cursor || null;
  return { limit, cursor };
};

/**
 * Parse offset-based pagination parameters.
 * @param {Object} query - Express req.query
 * @returns {{ limit: number, offset: number, page: number }}
 */
const parseOffsetPagination = (query) => {
  const limit = Math.min(parseInt(query.limit, 10) || DEFAULT_LIMIT, MAX_LIMIT);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const offset = (page - 1) * limit;
  return { limit, offset, page };
};

/**
 * Build pagination metadata for a response.
 * @param {Object} params
 * @param {number} params.total - Total count of items
 * @param {number} params.page
 * @param {number} params.limit
 * @returns {Object} pagination meta
 */
const buildPaginationMeta = ({ total, page, limit }) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

/**
 * Build cursor-based pagination meta.
 * @param {Array} items - Current page items
 * @param {number} limit
 * @param {string} cursorField - Field name to use as the next cursor (default 'id')
 * @returns {Object}
 */
const buildCursorMeta = (items, limit, cursorField = 'id') => ({
  count: items.length,
  hasNext: items.length === limit,
  nextCursor: items.length === limit ? items[items.length - 1][cursorField] : null,
});

module.exports = {
  parseCursorPagination,
  parseOffsetPagination,
  buildPaginationMeta,
  buildCursorMeta,
};
