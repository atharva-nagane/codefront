const Bull = require('bull');
const logger = require('../../shared/utils/logger');

// Without this, ioredis's default retry behavior makes a hung Redis
// connection retry with growing backoff for a very long time — so a
// request that calls addJob() during a Redis outage would hang instead of
// failing fast. maxRetriesPerRequest caps how many attempts a single
// command gets before rejecting; retryStrategy caps reconnect attempts,
// mirroring src/config/redis.js.
const redisConnectOpts = {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return 1000;
  },
};

const submissionQueue = new Bull('submissions', process.env.REDIS_URL, {
  redis: redisConnectOpts,
});

submissionQueue.on('ready', () => logger.info('Bull queue ready'));
submissionQueue.on('error', (err) => logger.error(`Bull queue error: ${err.message}`));

// type: 'submission' (default, writes to Submission) or 'contest' (writes to ContestSubmission)
const addJob = async (submissionId, type = 'submission') => {
  await submissionQueue.add(
    { submissionId, type },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
  logger.info(`Job added to queue: ${submissionId} (${type})`);
};

module.exports = { submissionQueue, addJob };