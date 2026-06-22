const redis = require('../../config/redis');
const Submission = require('../submissions/submission.model');
const VERDICTS = require('../../shared/constants/verdicts');

const updateLeaderboard = async (userId, username) => {
  try {
    console.log(`Updating leaderboard for ${username}`);
    const result = await redis.zincrby('leaderboard', 1, `${userId}:${username}`);
    console.log(`Leaderboard updated: ${result}`);
  } catch (err) {
    console.warn('Redis unavailable — leaderboard not updated:', err.message);
  }
};

const getLeaderboard = async () => {
  try {
    const results = await redis.zrevrange('leaderboard', 0, 49, 'WITHSCORES');
    console.log('Leaderboard results from Redis:', results);
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
    console.warn('Redis unavailable — falling back to MongoDB');
    return await getLeaderboardFromDB();
  }
};

const getLeaderboardFromDB = async () => {
  console.log('Fetching leaderboard from MongoDB');
  const results = await Submission.aggregate([
    { $match: { verdict: VERDICTS.ACCEPTED } },
    { $group: { _id: '$user', solvedCount: { $sum: 1 } } },
    { $sort: { solvedCount: -1 } },
    { $limit: 50 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { userId: '$_id', username: '$user.username', solvedCount: 1, _id: 0 } },
  ]);
  console.log('MongoDB leaderboard results:', results);
  return results;
};

module.exports = { updateLeaderboard, getLeaderboard };