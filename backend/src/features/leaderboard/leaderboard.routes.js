
const express = require('express');
const router = express.Router();
const { fetchLeaderboard, rebuild } = require('./leaderboard.controller');
const authMiddleware = require('../auth/auth.middleware');
const adminMiddleware = require('../admin/admin.middleware');

router.get('/', fetchLeaderboard);
router.post('/rebuild', authMiddleware, adminMiddleware, rebuild);

module.exports = router;