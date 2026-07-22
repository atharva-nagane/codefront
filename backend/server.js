require('dotenv').config();
require('./src/config/env');

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const connectDB = require('./src/config/db');
const logger = require('./src/shared/utils/logger');
const requestId = require('./src/shared/middlewares/requestId');
const { metricsMiddleware, getMetricsSnapshot } = require('./src/shared/middlewares/metrics');
const redis = require('./src/config/redis');
const authMiddleware = require('./src/features/auth/auth.middleware');
const adminMiddleware = require('./src/features/admin/admin.middleware');
const { setupBattleSocket } = require('./src/features/battle/battle.socket');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

// Socket.io state (rooms/connections) otherwise lives only in this process's
// memory — a second instance behind a load balancer couldn't see battle
// rooms on the first. The Redis adapter broadcasts events through Redis
// pub/sub so battle events reach the right players regardless of which
// instance they're connected to. Works transparently single-instance too.
const socketPubClient = redis.duplicate();
const socketSubClient = redis.duplicate();
io.adapter(createAdapter(socketPubClient, socketSubClient));

connectDB();

app.use(requestId);
app.use(metricsMiddleware);
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const asyncWrapper = require('./src/shared/utils/asyncWrapper');

app.get('/api/v1/health', asyncWrapper(async (req, res) => {
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

app.get('/api/v1/metrics', authMiddleware, adminMiddleware, asyncWrapper(async (req, res) => {
  const { submissionQueue } = require('./src/features/execution/execution.queue');

  let queueStats = {};
  try {
    queueStats = {
      waiting: await submissionQueue.getWaitingCount(),
      active: await submissionQueue.getActiveCount(),
      completed: await submissionQueue.getCompletedCount(),
      failed: await submissionQueue.getFailedCount(),
    };
  } catch {}

  let activeBattles = 0;
  try {
    const keys = await redis.keys('battle:session:*');
    activeBattles = keys.length;
  } catch {}

  // worker writes its heartbeat to Redis every ~15s — age tells us if it's alive
  let workerHeartbeat = { lastSeenAt: null, ageSeconds: null, alive: false };
  try {
    const lastSeen = await redis.get('worker:heartbeat');
    if (lastSeen) {
      const ageSeconds = Math.round((Date.now() - Number(lastSeen)) / 1000);
      workerHeartbeat = { lastSeenAt: new Date(Number(lastSeen)).toISOString(), ageSeconds, alive: ageSeconds < 45 };
    }
  } catch {}

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    http: getMetricsSnapshot(),
    queue: queueStats,
    activeBattles,
    worker: workerHeartbeat,
  });
}));

app.use('/api/v1/auth',        require('./src/features/auth/auth.routes'));
app.use('/api/v1/problems',    require('./src/features/problems/problem.routes'));
app.use('/api/v1/submissions', require('./src/features/submissions/submission.routes'));
app.use('/api/v1/leaderboard', require('./src/features/leaderboard/leaderboard.routes'));
app.use('/api/v1/execution',   require('./src/features/execution/execution.routes'));
app.use('/api/v1/battles',     require('./src/features/battle/battle.routes'));
app.use('/api/v1/solo',        require('./src/features/battle/solo.routes'));
app.use('/api/v1/contests',    require('./src/features/contests/contest.routes'));

// errorHandler must be registered after all routes, otherwise errors
// thrown by routes registered below it never reach it
app.use(require('./src/shared/middlewares/errorHandler'));

// setup socket.io battle namespace
const battleIO = io.of('/battle');
setupBattleSocket(battleIO);

const httpServer = server.listen(process.env.PORT, () => {
  logger.info(`Server running on port ${process.env.PORT}`);
});

// ── graceful shutdown ─────────────────────────────────────────────────────
let shuttingDown = false;

const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info(`${signal} received, starting graceful shutdown`);

  // stop accepting new connections
  httpServer.close(() => {
    logger.info('HTTP server closed — no longer accepting connections');
  });

  io.close(() => {
    logger.info('Socket.io server closed');
  });

  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  (async () => {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    } catch (err) {
      logger.error(`Error closing MongoDB connection: ${err.message}`);
    }

    try {
      await Promise.all([redis.quit(), socketPubClient.quit(), socketSubClient.quit()]);
      logger.info('Redis connections closed');
    } catch (err) {
      logger.error(`Error closing Redis connections: ${err.message}`);
    }

    clearTimeout(forceExitTimer);
    logger.info('Graceful shutdown complete');
    process.exit(0);
  })();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
