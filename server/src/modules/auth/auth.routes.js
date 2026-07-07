'use strict';
const { Router } = require('express');
const controller = require('./auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validateBody } = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rateLimiter');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} = require('./auth.validation');

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), controller.register);
router.post('/login', authLimiter, validateBody(loginSchema), controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.getMe);
router.patch('/me', authenticate, validateBody(updateProfileSchema), controller.updateMe);

module.exports = router;
