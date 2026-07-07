'use strict';
const { Router } = require('express');
const controller = require('./destinations.controller');
const ratingsController = require('../ratings/ratings.controller');
const { authenticate, optionalAuthenticate } = require('../../middleware/auth.middleware');
const { validateBody } = require('../../middleware/validate');
const Joi = require('joi');

const createDestSchema = Joi.object({
  name: Joi.string().min(2).max(255).trim().required(),
  country: Joi.string().min(2).max(100).trim().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  description: Joi.string().max(2000).trim().optional(),
});

const router = Router();

router.get('/search', controller.search);
router.get('/autocomplete', controller.autocomplete);
router.get('/', controller.search);
router.post('/', authenticate, validateBody(createDestSchema), controller.create);
router.get('/:id', controller.getById);

// Nested ratings
router.get('/:destId/ratings', ratingsController.getForDestination);
router.post('/:destId/ratings', authenticate, ratingsController.createRating);

module.exports = router;
