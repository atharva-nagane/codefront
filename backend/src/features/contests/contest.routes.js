const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/auth.middleware');
const adminMiddleware = require('../admin/admin.middleware');
const asyncWrapper = require('../../shared/utils/asyncWrapper');
const AppError = require('../../shared/utils/AppError');
const Contest = require('./contest.model');
const ContestSubmission = require('./contestSubmission.model');
const Problem = require('../problems/problem.model');
const TestCase = require('../testcases/testcase.model');
const { runCode } = require('../execution/dockerRunner');
const VERDICTS = require('../../shared/constants/verdicts');
const logger = require('../../shared/utils/logger');

// helper to compute contest status
const getStatus = (contest) => {
  const now = new Date();
  if (now < contest.startTime) return 'upcoming';
  if (now > contest.endTime) return 'ended';
  return 'active';
};

// ── GET all contests ────────────────────────────────────────────────────────
router.get('/', asyncWrapper(async (req, res) => {
  const contests = await Contest.find()
    .sort({ startTime: -1 })
    .select('name description startTime endTime problems registeredUsers status freezeLeaderboard')
    .populate('problems', 'name slug difficulty');

  const enriched = contests.map(c => ({
    ...c.toObject(),
    status: getStatus(c),
    problemCount: c.problems.length,
    registeredCount: c.registeredUsers.length,
  }));

  res.json({ success: true, contests: enriched });
}));

// ── GET single contest ──────────────────────────────────────────────────────
router.get('/:id', authMiddleware, asyncWrapper(async (req, res) => {
  const contest = await Contest.findById(req.params.id)
    .populate('problems', 'name slug difficulty statement timeLimit memoryLimit')
    .populate('createdBy', 'username');

  if (!contest) throw new AppError('Contest not found', 404);

  const status = getStatus(contest);
  const isRegistered = contest.registeredUsers.includes(req.user._id);

  res.json({
    success: true,
    contest: {
      ...contest.toObject(),
      status,
      isRegistered,
      registeredCount: contest.registeredUsers.length,
    },
  });
}));

// ── REGISTER for contest ────────────────────────────────────────────────────
router.post('/:id/register', authMiddleware, asyncWrapper(async (req, res) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new AppError('Contest not found', 404);

  const status = getStatus(contest);
  if (status === 'active') throw new AppError('Contest has already started', 400);
  if (status === 'ended') throw new AppError('Contest has ended', 400);

  if (contest.registeredUsers.includes(req.user._id)) {
    throw new AppError('Already registered', 400);
  }

  contest.registeredUsers.push(req.user._id);
  await contest.save();

  res.json({ success: true, message: 'Registered successfully' });
}));

// ── UNREGISTER from contest ─────────────────────────────────────────────────
router.post('/:id/unregister', authMiddleware, asyncWrapper(async (req, res) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new AppError('Contest not found', 404);

  const status = getStatus(contest);
  if (status !== 'upcoming') throw new AppError('Cannot unregister after contest starts', 400);

  contest.registeredUsers = contest.registeredUsers.filter(
    u => u.toString() !== req.user._id.toString()
  );
  await contest.save();

  res.json({ success: true, message: 'Unregistered successfully' });
}));

// ── SUBMIT in contest ───────────────────────────────────────────────────────
router.post('/:id/submit', authMiddleware, asyncWrapper(async (req, res) => {
  const { problemId, code, language } = req.body;
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new AppError('Contest not found', 404);

  const status = getStatus(contest);
  if (status !== 'active') throw new AppError('Contest is not active', 400);

  if (!contest.registeredUsers.includes(req.user._id)) {
    throw new AppError('You are not registered for this contest', 403);
  }

  if (!contest.problems.includes(problemId)) {
    throw new AppError('Problem not in this contest', 400);
  }

  const submission = await ContestSubmission.create({
    contest: contest._id,
    user: req.user._id,
    problem: problemId,
    code,
    language,
    verdict: VERDICTS.PENDING,
  });

  // run execution in background
  (async () => {
    try {
      const testCases = await TestCase.find({ problem: problemId });
      const results = await Promise.all(
        testCases.map(tc =>
          runCode(`contest_${submission._id}_${Date.now()}`, code, language, tc.input)
        )
      );

      let verdict = VERDICTS.ACCEPTED;
      let totalTime = 0;

      for (let i = 0; i < results.length; i++) {
        totalTime += results[i].executionTime;
        if (results[i].verdict) { verdict = results[i].verdict; break; }
        if (results[i].output.trim() !== testCases[i].output.trim()) {
          verdict = VERDICTS.WRONG_ANSWER; break;
        }
      }

      await ContestSubmission.findByIdAndUpdate(submission._id, {
        verdict,
        executionTime: Math.round(totalTime / (testCases.length || 1)),
      });
    } catch (err) {
      logger.error(`Contest submission execution error: ${err.message}`);
      await ContestSubmission.findByIdAndUpdate(submission._id, {
        verdict: VERDICTS.RUNTIME_ERROR,
      });
    }
  })();

  res.status(201).json({ success: true, submissionId: submission._id });
}));

// ── GET submission status ───────────────────────────────────────────────────
router.get('/:id/submissions/:submissionId', authMiddleware, asyncWrapper(async (req, res) => {
  const submission = await ContestSubmission.findById(req.params.submissionId);
  if (!submission) throw new AppError('Submission not found', 404);
  if (submission.user.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized', 403);
  }
  res.json({ success: true, submission });
}));

// ── GET leaderboard ─────────────────────────────────────────────────────────
router.get('/:id/leaderboard', authMiddleware, asyncWrapper(async (req, res) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new AppError('Contest not found', 404);

  const status = getStatus(contest);

  // freeze leaderboard 1hr before end during active contest
  const now = new Date();
  const oneHourBeforeEnd = new Date(contest.endTime - 60 * 60 * 1000);
  const isFrozen = contest.freezeLeaderboard &&
    status === 'active' &&
    now >= oneHourBeforeEnd;

  // if frozen, only show submissions before freeze time
  const submissionFilter = {
    contest: contest._id,
    verdict: VERDICTS.ACCEPTED,
  };

  if (isFrozen) {
    submissionFilter.submittedAt = { $lt: oneHourBeforeEnd };
  }

  const acceptedSubmissions = await ContestSubmission.find(submissionFilter)
    .populate('user', 'username')
    .sort({ submittedAt: 1 });

  // build leaderboard — one entry per user
  const leaderboardMap = new Map();

  for (const sub of acceptedSubmissions) {
    const userId = sub.user._id.toString();
    const problemId = sub.problem.toString();

    if (!leaderboardMap.has(userId)) {
      leaderboardMap.set(userId, {
        userId,
        username: sub.user.username,
        solvedCount: 0,
        solvedProblems: new Set(),
        lastAcceptedAt: null,
      });
    }

    const entry = leaderboardMap.get(userId);
    if (!entry.solvedProblems.has(problemId)) {
      entry.solvedProblems.add(problemId);
      entry.solvedCount += 1;
      entry.lastAcceptedAt = sub.submittedAt;
    }
  }

  const leaderboard = Array.from(leaderboardMap.values())
    .map(e => ({
      userId: e.userId,
      username: e.username,
      solvedCount: e.solvedCount,
      lastAcceptedAt: e.lastAcceptedAt,
    }))
    .sort((a, b) => {
      if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
      return new Date(a.lastAcceptedAt) - new Date(b.lastAcceptedAt);
    });

  res.json({ success: true, leaderboard, isFrozen, status });
}));

// ── GET my submissions in contest ───────────────────────────────────────────
router.get('/:id/my-submissions', authMiddleware, asyncWrapper(async (req, res) => {
  const submissions = await ContestSubmission.find({
    contest: req.params.id,
    user: req.user._id,
  })
    .populate('problem', 'name slug')
    .sort({ submittedAt: -1 });

  res.json({ success: true, submissions });
}));

// ── ADMIN — create contest ──────────────────────────────────────────────────
router.post('/', authMiddleware, adminMiddleware, asyncWrapper(async (req, res) => {
  const { name, description, startTime, endTime, problemIds, freezeLeaderboard } = req.body;

  if (!name || !startTime || !endTime || !problemIds?.length) {
    throw new AppError('name, startTime, endTime and problemIds are required', 400);
  }

  if (new Date(startTime) >= new Date(endTime)) {
    throw new AppError('endTime must be after startTime', 400);
  }

  const contest = await Contest.create({
    name,
    description: description || '',
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    problems: problemIds,
    freezeLeaderboard: freezeLeaderboard !== false,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, contest });
}));

// ── ADMIN — update contest ──────────────────────────────────────────────────
router.put('/:id', authMiddleware, adminMiddleware, asyncWrapper(async (req, res) => {
  const contest = await Contest.findByIdAndUpdate(
    req.params.id,
    { ...req.body },
    { new: true }
  );
  if (!contest) throw new AppError('Contest not found', 404);
  res.json({ success: true, contest });
}));

module.exports = router;