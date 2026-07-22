// E:\online-judge\backend\src\features\execution\execution.worker.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
require('../../../src/config/env');

const mongoose = require('mongoose');
const { submissionQueue } = require('./execution.queue');
const { runSubmission, runContestSubmission } = require('./execution.service');
const redis = require('../../config/redis');
const logger = require('../../shared/utils/logger');

const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY) || 5;
const HEARTBEAT_INTERVAL_MS = 15000;

// lets the /api/v1/metrics endpoint tell whether the worker process is alive
const sendHeartbeat = () => {
  redis.set('worker:heartbeat', Date.now()).catch(err => {
    logger.warn(`Worker heartbeat write failed: ${err.message}`);
  });
};
sendHeartbeat();
const heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

mongoose.connect(process.env.MONGO_URI)
  .then(() => logger.info('Worker: MongoDB connected'))
  .catch(err => {
    logger.error(`Worker: MongoDB connection failed: ${err.message}`);
    process.exit(1);
  });

submissionQueue.process(CONCURRENCY, async (job) => {
  const { submissionId, type } = job.data;
  logger.info(`Processing ${type || 'submission'}: ${submissionId}`);
  if (type === 'contest') {
    await runContestSubmission(submissionId);
  } else {
    await runSubmission(submissionId);
  }
  logger.info(`Finished ${type || 'submission'}: ${submissionId}`);
});

submissionQueue.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`);
});

submissionQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed: ${err.message}`);
});

logger.info(`Worker started with concurrency ${CONCURRENCY}`);

// ── graceful shutdown ─────────────────────────────────────────────────────
let shuttingDown = false;

const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info(`${signal} received, closing queue and letting active jobs finish`);

  clearInterval(heartbeatInterval);

  const forceExitTimer = setTimeout(() => {
    logger.error('Worker shutdown timed out, forcing exit');
    process.exit(1);
  }, 15000);
  forceExitTimer.unref();

  try {
    await submissionQueue.close();
    logger.info('Submission queue closed');
  } catch (err) {
    logger.error(`Error closing submission queue: ${err.message}`);
  }

  try {
    await mongoose.connection.close();
    logger.info('Worker MongoDB connection closed');
  } catch (err) {
    logger.error(`Error closing worker MongoDB connection: ${err.message}`);
  }

  clearTimeout(forceExitTimer);
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));