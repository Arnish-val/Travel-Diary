'use strict';
const Redis = require('ioredis');
const env = require('./env');
const logger = require('./logger');

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy: () => null,
  lazyConnect: true,
  enableOfflineQueue: false,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error({ err }, 'Redis error'));
redis.on('close', () => logger.warn('Redis connection closed'));

module.exports = redis;
