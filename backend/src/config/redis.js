// E:\online-judge\backend\src\config\redis.js
const Redis = require('ioredis');
const logger = require('../shared/utils/logger');

const redis = new Redis(process.env.REDIS_URL, {
  lazyConnect: false,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return 1000;
  },
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', () => {});

module.exports = redis;