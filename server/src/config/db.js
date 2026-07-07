'use strict';
const { Pool } = require('pg');
const env = require('./env');
const logger = require('./logger');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
});

pool.on('connect', () => {
  logger.debug('New PostgreSQL client connected');
});

/**
 * Execute a query using the pool.
 * @param {string} text - SQL query string
 * @param {Array} [params] - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

/**
 * Get a client from the pool for transactions.
 * Always call client.release() in a finally block.
 */
const getClient = () => pool.connect();

/**
 * Execute a function within a transaction.
 * Automatically commits or rolls back.
 * @param {Function} fn - async function receiving a pg client
 */
const withTransaction = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, getClient, withTransaction };
