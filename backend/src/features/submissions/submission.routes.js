
const express = require('express');
const router = express.Router();
const { submit, getSubmission, getSubmissions, getRecentSubmissions } = require('./submission.controller');
const authMiddleware = require('../auth/auth.middleware');
const { submissionLimiter } = require('../../shared/middlewares/rateLimiter');

router.post('/', authMiddleware, submissionLimiter, submit);
router.get('/recent', getRecentSubmissions);
router.get('/', authMiddleware, getSubmissions);
router.get('/:id', authMiddleware, getSubmission);

module.exports = router;