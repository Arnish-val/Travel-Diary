'use strict';
const { Router } = require('express');
const controller = require('./media.controller');
const { authenticate, optionalAuthenticate } = require('../../middleware/auth.middleware');
const { upload, validateMagicBytesMiddleware, handleUploadError } = require('../../middleware/upload.middleware');
const { uploadLimiter } = require('../../middleware/rateLimiter');

const router = Router({ mergeParams: true }); // Inherit tripId from parent router

// Trip-scoped media routes
router.post(
  '/',
  authenticate,
  uploadLimiter,
  upload.single('photo'),
  handleUploadError,
  validateMagicBytesMiddleware,
  controller.uploadMedia
);

router.get('/', optionalAuthenticate, controller.getTripMedia);

// Standalone media routes (mounted separately at /api/media)
const standaloneRouter = Router();
standaloneRouter.patch('/:id', authenticate, controller.updateMedia);
standaloneRouter.delete('/:id', authenticate, controller.deleteMedia);

module.exports = { tripMediaRouter: router, mediaRouter: standaloneRouter };
