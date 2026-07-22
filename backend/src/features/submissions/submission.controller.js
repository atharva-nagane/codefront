const crypto = require('crypto');
const asyncWrapper = require('../../shared/utils/asyncWrapper');
const AppError = require('../../shared/utils/AppError');
const Submission = require('./submission.model');
const Problem = require('../problems/problem.model');
const VERDICTS = require('../../shared/constants/verdicts');
const { submitCodeSchema } = require('./submission.validation');
const { addJob } = require('../execution/execution.queue');

const IDEMPOTENCY_WINDOW_MS = 10000;

const submit = asyncWrapper(async (req, res) => {
  const { error } = submitCodeSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const { problemId, code, language } = req.body;

  const problem = await Problem.findById(problemId);
  if (!problem) throw new AppError('Problem not found', 404);

  // dedupe double-clicks / retries: same user+problem+code submitted again
  // within the window while the first one is still Pending reuses it
  // instead of creating a duplicate submission + Bull job.
  const hash = crypto
    .createHash('sha256')
    .update(`${req.user._id}:${problemId}:${code}`)
    .digest('hex');

  const recentDuplicate = await Submission.findOne({
    user: req.user._id,
    problem: problemId,
    verdict: VERDICTS.PENDING,
    idempotencyKey: hash,
    createdAt: { $gte: new Date(Date.now() - IDEMPOTENCY_WINDOW_MS) },
  });

  if (recentDuplicate) {
    return res.status(200).json({ success: true, submissionId: recentDuplicate._id });
  }

  const submission = await Submission.create({
    user: req.user._id,
    problem: problemId,
    code,
    language,
    verdict: VERDICTS.PENDING,
    idempotencyKey: hash,
  });

  try {
    await addJob(submission._id.toString());
  } catch (err) {
    // queue is unreachable (e.g. Redis outage) — the submission would sit
    // as Pending forever with no worker ever picking it up, so surface a
    // clear, retryable error instead of leaving the client polling forever
    await Submission.findByIdAndUpdate(submission._id, { verdict: VERDICTS.RUNTIME_ERROR });
    throw new AppError('Execution queue unavailable, please try again shortly', 503);
  }

  res.status(201).json({ success: true, submissionId: submission._id });
});

const getSubmission = asyncWrapper(async (req, res) => {
  const submission = await Submission.findById(req.params.id)
    .populate('problem', 'name slug')
    .populate('user', 'username');

  if (!submission) throw new AppError('Submission not found', 404);

  if (submission.user._id.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized', 403);
  }

  res.json({ success: true, submission });
});

const getSubmissions = asyncWrapper(async (req, res) => {
  const { problemId } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  const query = { user: req.user._id };
  if (problemId) query.problem = problemId;

  const [submissions, total] = await Promise.all([
    Submission.find(query)
      .populate('problem', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Submission.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: submissions,
    submissions,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

const getRecentSubmissions = asyncWrapper(async (req, res) => {
  const submissions = await Submission.find()
    .populate('problem', 'name slug')
    .populate('user', 'username')
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({ success: true, submissions });
});

module.exports = { submit, getSubmission, getSubmissions, getRecentSubmissions };
