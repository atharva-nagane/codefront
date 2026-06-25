const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/auth.middleware');
const asyncWrapper = require('../../shared/utils/asyncWrapper');
const AppError = require('../../shared/utils/AppError');
const Problem = require('../problems/problem.model');
const TestCase = require('../testcases/testcase.model');
const SoloBattle = require('./solo.model');
const User = require('../auth/auth.model');
const { runCode } = require('../execution/dockerRunner');
const { getDifficultyForUser } = require('./battle.service');
const logger = require('../../shared/utils/logger');

const PROBLEMS_PER_SOLO = 20;
const MAX_WRONGS = 3;

// start a solo battle — get problems
router.post('/start', authMiddleware, asyncWrapper(async (req, res) => {
  const { mode } = req.body;
  const validModes = ['5min', '10min', '30min', 'survival'];
  if (!validModes.includes(mode)) throw new AppError('Invalid mode', 400);

  const difficulty = await getDifficultyForUser(req.user._id);

  const problems = await Problem.aggregate([
    { $match: { difficulty } },
    { $sample: { size: PROBLEMS_PER_SOLO } },
  ]);

  const finalProblems = problems.length >= PROBLEMS_PER_SOLO
    ? problems
    : await Problem.aggregate([{ $sample: { size: PROBLEMS_PER_SOLO } }]);

  const soloBattle = await SoloBattle.create({
    user: req.user._id,
    mode,
    problems: finalProblems.map(p => p._id),
    startTime: new Date(),
  });

  res.status(201).json({
    success: true,
    battleId: soloBattle._id,
    problems: finalProblems.map(p => ({
      _id: p._id,
      name: p.name,
      slug: p.slug,
      difficulty: p.difficulty,
      statement: p.statement,
      timeLimit: p.timeLimit,
      memoryLimit: p.memoryLimit,
    })),
    mode,
  });
}));

// submit a solution in solo battle
router.post('/:battleId/submit', authMiddleware, asyncWrapper(async (req, res) => {
  const { problemId, code, language } = req.body;
  const battle = await SoloBattle.findById(req.params.battleId);

  if (!battle) throw new AppError('Battle not found', 404);
  if (battle.user.toString() !== req.user._id.toString()) throw new AppError('Not authorized', 403);
  if (battle.endTime) throw new AppError('Battle already ended', 400);

  const testCases = await TestCase.find({ problem: problemId });

  const results = await Promise.all(
    testCases.map(tc =>
      runCode(`solo_${battle._id}_${Date.now()}`, code, language, tc.input)
    )
  );

  let verdict = 'Accepted';
  for (let i = 0; i < results.length; i++) {
    if (results[i].verdict) { verdict = results[i].verdict; break; }
    if (results[i].output.trim() !== testCases[i].output.trim()) {
      verdict = 'Wrong Answer'; break;
    }
  }

  const correct = verdict === 'Accepted';

  if (correct) {
    battle.score += 1;
    battle.solvedProblems.push(problemId);
  } else {
    battle.wrongCount += 1;
    battle.reviewProblems.push(problemId);
  }

  await battle.save();

  const locked = battle.wrongCount >= MAX_WRONGS;

  res.json({
    success: true,
    verdict,
    correct,
    score: battle.score,
    wrongCount: battle.wrongCount,
    locked,
  });
}));

// end a solo battle
router.post('/:battleId/end', authMiddleware, asyncWrapper(async (req, res) => {
  const battle = await SoloBattle.findById(req.params.battleId);
  if (!battle) throw new AppError('Battle not found', 404);
  if (battle.user.toString() !== req.user._id.toString()) throw new AppError('Not authorized', 403);

  const endTime = new Date();
  const timeTaken = Math.round((endTime - battle.startTime) / 1000);

  battle.endTime = endTime;
  battle.timeTaken = timeTaken;
  await battle.save();

  // update personal bests
  const user = await User.findById(req.user._id);
  const now = new Date();

  // check weekly reset (reset every Monday)
  const dayOfWeek = now.getDay();
  const lastReset = user.weeklyBestResetAt || new Date(0);
  const daysSinceReset = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));
  if (daysSinceReset >= 7) {
    user.weeklyBest = [];
    user.weeklyBestResetAt = now;
  }

  // find existing bests for this mode
  const existingAllTime = user.allTimeBest.find(b => b.mode === battle.mode);
  const existingWeekly = user.weeklyBest.find(b => b.mode === battle.mode);

  let isNewAllTimeBest = false;
  let isNewWeeklyBest = false;

  if (!existingAllTime || battle.score > existingAllTime.score) {
    isNewAllTimeBest = true;
    if (existingAllTime) {
      existingAllTime.score = battle.score;
      existingAllTime.wrongCount = battle.wrongCount;
      existingAllTime.achievedAt = now;
    } else {
      user.allTimeBest.push({ mode: battle.mode, score: battle.score, wrongCount: battle.wrongCount, achievedAt: now });
    }
  }

  if (!existingWeekly || battle.score > existingWeekly.score) {
    isNewWeeklyBest = true;
    if (existingWeekly) {
      existingWeekly.score = battle.score;
      existingWeekly.wrongCount = battle.wrongCount;
      existingWeekly.achievedAt = now;
    } else {
      user.weeklyBest.push({ mode: battle.mode, score: battle.score, wrongCount: battle.wrongCount, achievedAt: now });
    }
  }

  await user.save();

  battle.isNewAllTimeBest = isNewAllTimeBest;
  battle.isNewWeeklyBest = isNewWeeklyBest;
  await battle.save();

  res.json({
    success: true,
    result: {
      score: battle.score,
      wrongCount: battle.wrongCount,
      timeTaken,
      isNewAllTimeBest,
      isNewWeeklyBest,
      allTimeBest: user.allTimeBest.find(b => b.mode === battle.mode),
      weeklyBest: user.weeklyBest.find(b => b.mode === battle.mode),
    },
  });
}));

// get solo battle history
router.get('/history', authMiddleware, asyncWrapper(async (req, res) => {
  const battles = await SoloBattle.find({ user: req.user._id, endTime: { $exists: true } })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('mode score wrongCount timeTaken isNewAllTimeBest isNewWeeklyBest createdAt');

  res.json({ success: true, battles });
}));

// get personal bests
router.get('/bests', authMiddleware, asyncWrapper(async (req, res) => {
  const user = await User.findById(req.user._id).select('allTimeBest weeklyBest weeklyBestResetAt');
  res.json({ success: true, allTimeBest: user.allTimeBest, weeklyBest: user.weeklyBest });
}));

module.exports = router;