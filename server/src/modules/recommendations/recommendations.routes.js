'use strict';
const { Router } = require('express');
const controller = require('./recommendations.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validateBody } = require('../../middleware/validate');
const Joi = require('joi');

const updateStatusSchema = Joi.object({
  seen: Joi.boolean().optional(),
  dismissed: Joi.boolean().optional(),
}).min(1);

const router = Router();

router.use(authenticate); // Authenticated users only

router.get('/', controller.getRecommendations);
router.post('/refresh', controller.refreshRecommendations);
router.patch('/:id', validateBody(updateStatusSchema), controller.updateStatus);

module.exports = router;
