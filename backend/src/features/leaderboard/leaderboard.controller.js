
const asyncWrapper = require('../../shared/utils/asyncWrapper');
const { getLeaderboard } = require('./leaderboard.service');

const fetchLeaderboard = asyncWrapper(async (req, res) => {
  const leaderboard = await getLeaderboard();
  res.json({ success: true, leaderboard });
});

module.exports = { fetchLeaderboard };