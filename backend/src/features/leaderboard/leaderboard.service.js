const redis = require('../../config/redis');
const Submission = require('../submissions/submission.model');
const VERDICTS = require('../../shared/constants/verdicts');
const logger = require('../../shared/utils/logger');

const LEADERBOARD_KEY = 'leaderboard';

const updateLeaderboard = async (userId, username) => {
  try {
    await redis.zincrby(LEADERBOARD_KEY, 1, `${userId}:${username}`);
  } catch (err) {
    logger.warn(`Redis unavailable — leaderboard not updated: ${err.message}`);
  }
};

const getLeaderboard = async () => {
  try {
    const results = await redis.zrevrange('leaderboard', 0, 49, 'WITHSCORES');
    if (!results || results.length === 0) {
      return await getLeaderboardFromDB();
    }
    const leaderboard = [];
    for (let i = 0; i < results.length; i += 2) {
      const [userId, username] = results[i].split(':');
      leaderboard.push({
        userId,
        username,
        solvedCount: parseInt(results[i + 1]),
      });
    }
    return leaderboard;
  } catch (err) {
    return await getLeaderboardFromDB();
  }
};

const getLeaderboardFromDB = async () => {
  const results = await Submission.aggregate([
    { $match: { verdict: VERDICTS.ACCEPTED } },
    { $group: { _id: '$user', solvedCount: { $sum: 1 } } },
    { $sort: { solvedCount: -1 } },
    { $limit: 50 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { userId: '$_id', username: '$user.username', solvedCount: 1, _id: 0 } },
  ]);
  return results;
};

// P4.2 — rebuild the Redis sorted set from MongoDB truth. Used to recover
// from drift (Redis restart losing scores, a misjudged submission, etc.)
// without manual intervention.
const rebuildLeaderboard = async () => {
  const results = await Submission.aggregate([
    { $match: { verdict: VERDICTS.ACCEPTED } },
    { $group: { _id: '$user', solvedCount: { $sum: 1 } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { userId: '$_id', username: '$user.username', solvedCount: 1, _id: 0 } },
  ]);

  await redis.del(LEADERBOARD_KEY);

  if (results.length > 0) {
    const args = results.flatMap(r => [r.solvedCount, `${r.userId}:${r.username}`]);
    await redis.zadd(LEADERBOARD_KEY, ...args);
  }

  logger.info(`Leaderboard rebuilt: ${results.length} users repopulated into Redis`);
  return results.length;
};

module.exports = { updateLeaderboard, getLeaderboard, rebuildLeaderboard };