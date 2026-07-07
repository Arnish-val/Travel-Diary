'use strict';
const { Router } = require('express');
const controller = require('./planning.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = Router();

router.use(authenticate); // All planning routes require auth

router.get('/', controller.getAll);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

router.post('/:id/checklist', controller.addItem);
router.patch('/:id/checklist/:itemId', controller.updateItem);
router.delete('/:id/checklist/:itemId', controller.removeItem);

module.exports = router;
