'use strict';
const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { pool } = require('./config/db');
const redis = require('./config/redis');

const PORT = env.PORT || 5000;

const start = async () => {
  try {
    // Verify DB connection
    await pool.query('SELECT 1');
    logger.info('PostgreSQL connection verified');

    // Connect Redis (lazy connect mode)
    try {
      await redis.connect();
      logger.info('Redis connection verified');
    } catch (redisErr) {
      logger.warn({ err: redisErr.message }, 'Redis connection failed, continuing without Redis');
    }

    const http = require('http');
    const socketConfig = require('./config/socket');

    const httpServer = http.createServer(app);
    socketConfig.init(httpServer, {
      origin: env.CLIENT_URL,
      credentials: true,
    });

    const server = httpServer.listen(PORT, () => {
      logger.info({ port: PORT, env: env.NODE_ENV }, 'Server started');
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info({ signal }, 'Shutting down gracefully...');
      server.close(async () => {
        await pool.end();
        try {
          await redis.quit();
        } catch (e) {
          logger.warn({ err: e.message }, 'Error closing Redis connection');
        }
        logger.info('Server shut down cleanly');
        process.exit(0);
      });

      // Force exit after 10s
      setTimeout(() => process.exit(1), 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (err) => {
      logger.error({ err }, 'Unhandled promise rejection');
      shutdown('unhandledRejection');
    });

  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
};

start();
