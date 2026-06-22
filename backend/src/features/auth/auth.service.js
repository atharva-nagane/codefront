const jwt = require('jsonwebtoken');
const redis = require('../../config/redis');

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
    const result = redis.set(`refresh:${userId}`, token, 'EX', sevenDays);
    await result;
  } catch (err) {
    console.warn('Redis unavailable — refresh token not saved');
  }
};

const deleteRefreshToken = async (userId) => {
  await redis.del(`refresh:${userId}`);
};

const verifyRefreshToken = async (userId, token) => {
  const stored = await redis.get(`refresh:${userId}`);
  return stored === token;
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  saveRefreshToken,
  deleteRefreshToken,
  verifyRefreshToken,
};