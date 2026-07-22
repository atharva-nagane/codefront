// E:\online-judge\backend\src\shared\middlewares\aiReviewLimiter.js
const redis = require('../../config/redis');
const AppError = require('../utils/AppError');
const asyncWrapper = require('../utils/asyncWrapper');
const logger = require('../utils/logger');

// 10 AI reviews per hour per user — keeps Gemini API spend bounded.
const LIMIT = 10;
const WINDOW_SECONDS = 60 * 60;

const aiReviewLimiter = asyncWrapper(async (req, res, next) => {
  const key = `ai_review:${req.user._id}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }

    if (count > LIMIT) {
      const ttl = await redis.ttl(key);
      throw new AppError(
        `Too many AI review requests, try again in ${Math.ceil(ttl / 60)} minute(s)`,
        429
      );
    }
  } catch (err) {
    if (err.isOperational) throw err;
    // Redis unavailable — fail open, AI review is non-critical.
    logger.warn(`AI review rate limiter degraded (Redis unavailable): ${err.message}`);
  }

  next();
});

module.exports = aiReviewLimiter;
