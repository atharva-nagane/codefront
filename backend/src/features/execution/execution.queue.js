const Bull = require('bull');

const submissionQueue = new Bull('submissions', {
  redis: process.env.REDIS_URL,
});

submissionQueue.on('ready', () => console.log('Bull queue ready'));
submissionQueue.on('error', (err) => console.error('Bull queue error:', err.message));

const addJob = async (submissionId) => {
  await submissionQueue.add(
    { submissionId },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
  console.log(`Job added to queue: ${submissionId}`);
};

module.exports = { submissionQueue, addJob };