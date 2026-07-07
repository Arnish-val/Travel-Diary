'use strict';
const logger = require('../config/logger');
const AppError = require('../utils/AppError');

/**
 * Central error handling middleware.
 * Must be registered as the last middleware in Express.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Handle specific library errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }

  if (err.code === '23505') {
    // PostgreSQL unique constraint violation
    statusCode = 409;
    message = 'A record with this value already exists';
  }

  if (err.code === '23503') {
    // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Referenced resource does not exist';
  }

  if (err.name === 'SyntaxError' && err.status === 400) {
    statusCode = 400;
    message = 'Invalid JSON body';
  }

  // Log unexpected errors with full details
  if (statusCode >= 500) {
    logger.error({
      err,
      req: {
        method: req.method,
        url: req.url,
        body: req.body,
        user: req.user?.id,
      },
    }, 'Unhandled server error');
  }

  // Only expose stack trace in development
  const response = {
    status: 'error',
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
