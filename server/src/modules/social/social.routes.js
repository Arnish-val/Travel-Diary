'use strict';
const { Router } = require('express');
const controller = require('./social.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = Router();

router.use(authenticate); // Authenticated users only

router.post('/follow/:id', controller.follow);
router.post('/unfollow/:id', controller.unfollow);
router.get('/notifications', controller.getNotifications);
router.patch('/notifications/:id/seen', controller.markNotificationSeen);
router.get('/feed', controller.getFeed);

module.exports = router;
