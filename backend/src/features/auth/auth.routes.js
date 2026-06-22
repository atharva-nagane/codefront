// E:\online-judge\backend\src\features\auth\auth.routes.js
const express = require('express');
const router = express.Router();
const { register, login, logout, refresh, getMe } = require('./auth.controller');
const authMiddleware = require('./auth.middleware');
const { authLimiter } = require('../../shared/middlewares/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', authMiddleware, getMe);

module.exports = router;