'use strict';
const AppError = require('../utils/AppError');

/**
 * Validate req.body against a Joi schema.
 * Throws 400 with field-level errors if validation fails.
 * @param {import('joi').Schema} schema
 * @returns {Function} Express middleware
 */
const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/"/g, ''),
    }));
    return next(AppError.badRequest('Validation failed', errors));
  }

  req.body = value; // Replace with sanitised values
  next();
};

/**
 * Validate req.query against a Joi schema.
 */
const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/"/g, ''),
    }));
    return next(AppError.badRequest('Invalid query parameters', errors));
  }

  req.query = value;
  next();
};

module.exports = { validateBody, validateQuery };
