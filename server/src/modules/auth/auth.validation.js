'use strict';
const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).max(128).required(),
  display_name: Joi.string().min(2).max(100).trim().required(),
  home_location: Joi.string().max(255).trim().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  display_name: Joi.string().min(2).max(100).trim().optional(),
  bio: Joi.string().max(1000).trim().allow('').optional(),
  home_location: Joi.string().max(255).trim().allow('').optional(),
  preferences: Joi.object().optional(),
});

const deleteAccountSchema = Joi.object({
  password: Joi.string().required(),
});

module.exports = { registerSchema, loginSchema, updateProfileSchema, deleteAccountSchema };
