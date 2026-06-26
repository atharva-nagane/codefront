const rateLimit = require('express-rate-limit');

const skipInTest = () => process.env.NODE_ENV === 'test';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: skipInTest,
  message: { success: false, message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const submissionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  skip: skipInTest,
  message: { success: false, message: 'Too many submissions, slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, submissionLimiter };