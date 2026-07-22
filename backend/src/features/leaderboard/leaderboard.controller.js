
const asyncWrapper = require('../../shared/utils/asyncWrapper');
const { getLeaderboard, rebuildLeaderboard } = require('./leaderboard.service');

const fetchLeaderboard = asyncWrapper(async (req, res) => {
  const leaderboard = await getLeaderboard();
  res.json({ success: true, leaderboard });
});

const rebuild = asyncWrapper(async (req, res) => {
  const count = await rebuildLeaderboard();
  res.json({ success: true, message: `Leaderboard rebuilt from MongoDB (${count} users)` });
});

module.exports = { fetchLeaderboard, rebuild };