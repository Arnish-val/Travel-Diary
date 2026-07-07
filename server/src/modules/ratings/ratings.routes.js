'use strict';
const { Router } = require('express');
const controller = require('./ratings.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = Router();

router.patch('/:id', authenticate, controller.updateRating);
router.delete('/:id', authenticate, controller.deleteRating);

module.exports = router;
