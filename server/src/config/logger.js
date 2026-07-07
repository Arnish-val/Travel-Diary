'use strict';
const pino = require('pino');
const env = require('./env');

const logger = pino({
  level: env.LOG_LEVEL || 'info',
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
  redact: ['req.headers.authorization', 'body.password', 'body.password_hash'],
});

module.exports = logger;
