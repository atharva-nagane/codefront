const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/auth.middleware');
const asyncWrapper = require('../../shared/utils/asyncWrapper');
const AppError = require('../../shared/utils/AppError');
const MCQ = require('./mcq.model');
const SoloBattle = require('./solo.model');
const User = require('../auth/auth.model');
const { selectQuestionsForBattle, QUESTIONS_PER_BATTLE } = require('./battle.service');
const logger = require('../../shared/utils/logger');

const MAX_WRONGS = 3;

// start a solo battle — get questions (same MCQ pool + progression as 1v1 battles)
router.post('/start', authMiddleware, asyncWrapper(async (req, res) => {
  const { mode } = req.body;
  const validModes = ['5min', '10min', '30min', 'survival'];
  if (!validModes.includes(mode)) throw new AppError('Invalid mode', 400);

  const questions = await selectQuestionsForBattle(QUESTIONS_PER_BATTLE);

  const soloBattle = await SoloBattle.create({
    user: req.user._id,
    mode,
    questions: questions.map(q => q._id),
    startTime: new Date(),
  });

  res.status(201).json({
    success: true,
    battleId: soloBattle._id,
    questions: questions.map(q => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      difficulty: q.difficulty,
      topic: q.topic,
    })),
    mode,
  });
}));

// submit an answer in solo mode — synchronous, no Docker
router.post('/:battleId/submit', authMiddleware, asyncWrapper(async (req, res) => {
  const { questionId, selectedIndex } = req.body;
  const battle = await SoloBattle.findById(req.params.battleId);

  if (!battle) throw new AppError('Battle not found', 404);
  if (battle.user.toString() !== req.user._id.toString()) throw new AppError('Not authorized', 403);
  if (battle.endTime) throw new AppError('Battle already ended', 400);

  const mcq = await MCQ.findById(questionId);
  if (!mcq) throw new AppError('Question not found', 404);

  const correct = selectedIndex === mcq.correctIndex;

  if (correct) {
    battle.score += 1;
    battle.solvedQuestions.push(questionId);
  } else {
    battle.wrongCount += 1;
    battle.reviewQuestions.push({ question: questionId, selectedIndex });
  }
  battle.currentIndex += 1;

  await battle.save();

  const locked = battle.wrongCount >= MAX_WRONGS;

  res.json({
    success: true,
    correct,
    correctIndex: mcq.correctIndex,
    explanation: mcq.explanation,
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

  // build review (question + correct answer + explanation) for wrong answers
  let review = [];
  if (battle.reviewQuestions.length) {
    const ids = battle.reviewQuestions.map(r => r.question);
    const mcqs = await MCQ.find({ _id: { $in: ids } });
    const mcqMap = new Map(mcqs.map(m => [m._id.toString(), m]));
    review = battle.reviewQuestions.map(r => {
      const mcq = mcqMap.get(r.question.toString());
      if (!mcq) return null;
      return {
        question: mcq.question,
        options: mcq.options,
        correctIndex: mcq.correctIndex,
        explanation: mcq.explanation,
        selectedIndex: r.selectedIndex,
      };
    }).filter(Boolean);
  }

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
      review,
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
