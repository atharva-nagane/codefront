// E:\online-judge\backend\src\features\execution\execution.worker.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
require('../../../src/config/env');

const mongoose = require('mongoose');
const { submissionQueue } = require('./execution.queue');
const { runSubmission } = require('./execution.service');
const logger = require('../../shared/utils/logger');

const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY) || 5;

mongoose.connect(process.env.MONGO_URI)
  .then(() => logger.info('Worker: MongoDB connected'))
  .catch(err => {
    logger.error(`Worker: MongoDB connection failed: ${err.message}`);
    process.exit(1);
  });

submissionQueue.process(CONCURRENCY, async (job) => {
  const { submissionId } = job.data;
  logger.info(`Processing submission: ${submissionId}`);
  await runSubmission(submissionId);
  logger.info(`Finished submission: ${submissionId}`);
});

submissionQueue.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`);
});

submissionQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed: ${err.message}`);
});

logger.info(`Worker started with concurrency ${CONCURRENCY}`);