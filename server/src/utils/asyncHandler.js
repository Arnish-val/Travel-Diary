'use strict';

/**
 * Wraps async route handlers to catch errors and pass to next().
 * Eliminates try/catch boilerplate in controllers.
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
