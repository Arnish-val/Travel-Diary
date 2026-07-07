'use strict';
const Joi = require('joi');

const createTripSchema = Joi.object({
  title: Joi.string().min(2).max(255).trim().required(),
  description: Joi.string().max(5000).trim().allow('').optional(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
  privacy: Joi.string().valid('public', 'private').default('private'),
  destination_ids: Joi.array().items(Joi.string().uuid()).optional(),
});

const updateTripSchema = Joi.object({
  title: Joi.string().min(2).max(255).trim().optional(),
  description: Joi.string().max(5000).trim().allow('').optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional(),
  privacy: Joi.string().valid('public', 'private').optional(),
}).min(1);

const addDestinationSchema = Joi.object({
  destination_id: Joi.string().uuid().required(),
  visit_order: Joi.number().integer().min(1).optional(),
});

const tripsQuerySchema = Joi.object({
  cursor: Joi.string().optional(),
  limit: Joi.number().integer().min(1).max(50).default(20),
  sort: Joi.string().valid('newest', 'oldest', 'start_date').default('newest'),
  privacy: Joi.string().valid('public', 'private').optional(),
});

module.exports = { createTripSchema, updateTripSchema, addDestinationSchema, tripsQuerySchema };
