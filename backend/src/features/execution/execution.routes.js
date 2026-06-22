const express = require('express');
const router = express.Router();
const { run } = require('./execution.controller');
const { review } = require('./review.controller');
const authMiddleware = require('../auth/auth.middleware');

router.post('/run', authMiddleware, run);
router.post('/review', authMiddleware, review);

module.exports = router;