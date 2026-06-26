require('dotenv').config();
require('./src/config/env');

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./src/config/db');
const logger = require('./src/shared/utils/logger');
const { setupBattleSocket } = require('./src/features/battle/battle.socket');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const asyncWrapper = require('./src/shared/utils/asyncWrapper');
const redis = require('./src/config/redis');

app.get('/api/v1/health', asyncWrapper(async (req, res) => {
  const mongoose = require('mongoose');
  const { submissionQueue } = require('./src/features/execution/execution.queue');

  // check MongoDB
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  // check Redis
  let redisStatus = 'disconnected';
  try {
    await redis.ping();
    redisStatus = 'connected';
  } catch {}

  // queue stats
  let queueStats = {};
  try {
    queueStats = {
      waiting: await submissionQueue.getWaitingCount(),
      active: await submissionQueue.getActiveCount(),
      completed: await submissionQueue.getCompletedCount(),
      failed: await submissionQueue.getFailedCount(),
    };
  } catch {}

  // active battles in Redis
  let activeBattles = 0;
  try {
    const keys = await redis.keys('battle:session:*');
    activeBattles = keys.length;
  } catch {}

  const uptime = Math.floor(process.uptime());
  const uptimeStr = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`;

  res.json({
    status: dbStatus === 'connected' && redisStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: uptimeStr,
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
    queue: queueStats,
    activeBattles,
    version: '1.0.0',
  });
}));
app.use('/api/v1/auth',        require('./src/features/auth/auth.routes'));
app.use('/api/v1/problems',    require('./src/features/problems/problem.routes'));
app.use('/api/v1/submissions', require('./src/features/submissions/submission.routes'));
app.use('/api/v1/leaderboard', require('./src/features/leaderboard/leaderboard.routes'));
app.use('/api/v1/execution',   require('./src/features/execution/execution.routes'));
app.use('/api/v1/battles',     require('./src/features/battle/battle.routes'));

app.use(require('./src/shared/middlewares/errorHandler'));

app.use('/api/v1/solo',    require('./src/features/battle/solo.routes'));
app.use('/api/v1/contests', require('./src/features/contests/contest.routes'));

// setup socket.io battle namespace
const battleIO = io.of('/battle');
setupBattleSocket(battleIO);

server.listen(process.env.PORT, () => {
  logger.info(`Server running on port ${process.env.PORT}`);
});