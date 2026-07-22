const express = require('express');
const router = express.Router();
const { run } = require('./execution.controller');
const { review } = require('./review.controller');
const authMiddleware = require('../auth/auth.middleware');
const aiReviewLimiter = require('../../shared/middlewares/aiReviewLimiter');

router.post('/run', authMiddleware, run);
router.post('/review', authMiddleware, aiReviewLimiter, review);

module.exports = router;