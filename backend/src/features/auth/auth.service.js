const jwt = require('jsonwebtoken');
const redis = require('../../config/redis');
const logger = require('../../shared/utils/logger');

const signAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY,
  });
};

const signRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY,
  });
};

const saveRefreshToken = async (userId, token) => {
  try {
    const sevenDays = 7 * 24 * 60 * 60;
    await redis.set(`refresh:${userId}`, token, 'EX', sevenDays);
  } catch (err) {
    logger.warn(`Redis unavailable — refresh token not saved: ${err.message}`);
  }
};

// fails OPEN — logout must succeed even if Redis is momentarily unreachable,
// otherwise a Redis blip locks users out of their own logout button.
const deleteRefreshToken = async (userId) => {
  try {
    await redis.del(`refresh:${userId}`);
  } catch (err) {
    logger.warn(`Redis unavailable — refresh token not deleted: ${err.message}`);
  }
};

// fails CLOSED — if Redis can't be reached to check the stored token, deny
// the refresh rather than silently trusting an unverifiable token.
const verifyRefreshToken = async (userId, token) => {
  try {
    const stored = await redis.get(`refresh:${userId}`);
    return stored === token;
  } catch (err) {
    logger.warn(`Redis unavailable — refresh token verification denied: ${err.message}`);
    return false;
  }
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  saveRefreshToken,
  deleteRefreshToken,
  verifyRefreshToken,
};