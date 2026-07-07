'use strict';
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const pinoHttp = require('pino-http');
const env = require('./config/env');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Route modules
const authRoutes = require('./modules/auth/auth.routes');
const tripsRoutes = require('./modules/trips/trips.routes');
const { tripMediaRouter, mediaRouter } = require('./modules/media/media.routes');
const destinationsRoutes = require('./modules/destinations/destinations.routes');
const ratingsRoutes = require('./modules/ratings/ratings.routes');
const planningRoutes = require('./modules/planning/planning.routes');
const recommendationsRoutes = require('./modules/recommendations/recommendations.routes');
const socialRoutes = require('./modules/social/social.routes');
const mediaController = require('./modules/media/media.controller');
const { authenticate } = require('./middleware/auth.middleware');

const app = express();

// ─── Security & parsing ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(compression());
app.use(pinoHttp({ logger }));

// ─── Rate limiting ───────────────────────────────────────────────────────────
app.use('/api', generalLimiter);

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripsRoutes);

// Nested: media under trips
app.use('/api/trips/:tripId/media', (req, res, next) => {
  req.params.tripId = req.params.tripId; // preserve for nested router
  next();
}, tripMediaRouter);

app.use('/api/media', mediaRouter);
app.use('/api/users/me/storage', authenticate, mediaController.getStorageUsage);

app.use('/api/destinations', destinationsRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/planned-trips', planningRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/social', socialRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.url} not found` });
});

// ─── Central error handler ───────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
