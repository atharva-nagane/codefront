const Problem = require('../problems/problem.model');
const Battle = require('./battle.model');
const User = require('../auth/auth.model');

const PROBLEMS_PER_BATTLE = 20;

const getDifficultyForUser = async (userId) => {
  const battleCount = await Battle.countDocuments({
    $or: [{ 'playerA.user': userId }, { 'playerB.user': userId }],
    status: 'finished',
  });

  if (battleCount < 15) return 'Easy';
  if (battleCount < 30) return 'Medium';
  return 'Hard';
};

const selectProblemsForBattle = async (userAId, userBId) => {
  // use the more experienced player's difficulty
  const diffA = await getDifficultyForUser(userAId);
  const diffB = await getDifficultyForUser(userBId);

  const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 };
  const difficulty = difficultyOrder[diffA] >= difficultyOrder[diffB] ? diffA : diffB;

  const problems = await Problem.aggregate([
    { $match: { difficulty } },
    { $sample: { size: PROBLEMS_PER_BATTLE } },
  ]);

  if (problems.length < PROBLEMS_PER_BATTLE) {
    // fallback — get any problems if not enough of this difficulty
    const fallback = await Problem.aggregate([
      { $sample: { size: PROBLEMS_PER_BATTLE } },
    ]);
    return fallback;
  }

  return problems;
};

const createBattle = async (playerA, playerB, mode) => {
  const problems = await selectProblemsForBattle(playerA.userId, playerB.userId);

  const battle = await Battle.create({
    playerA: {
      user: playerA.userId,
      username: playerA.username,
    },
    playerB: {
      user: playerB.userId,
      username: playerB.username,
    },
    problems: problems.map(p => p._id),
    mode,
    status: 'active',
    startTime: new Date(),
  });

  return { battle, problems };
};

const getModeTimeLimit = (mode) => {
  const limits = {
    '5min': 5 * 60 * 1000,
    '10min': 10 * 60 * 1000,
    '30min': 30 * 60 * 1000,
    'survival': null,
  };
  return limits[mode];
};

module.exports = { createBattle, getDifficultyForUser, getModeTimeLimit };