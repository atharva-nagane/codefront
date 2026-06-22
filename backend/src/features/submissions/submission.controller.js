const asyncWrapper = require('../../shared/utils/asyncWrapper');
const AppError = require('../../shared/utils/AppError');
const Submission = require('./submission.model');
const Problem = require('../problems/problem.model');
const VERDICTS = require('../../shared/constants/verdicts');
const { submitCodeSchema } = require('./submission.validation');
const { addJob } = require('../execution/execution.queue');

const submit = asyncWrapper(async (req, res) => {
  const { error } = submitCodeSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const { problemId, code, language } = req.body;

  const problem = await Problem.findById(problemId);
  if (!problem) throw new AppError('Problem not found', 404);

  const submission = await Submission.create({
    user: req.user._id,
    problem: problemId,
    code,
    language,
    verdict: VERDICTS.PENDING,
  });

  await addJob(submission._id.toString());

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
  const query = { user: req.user._id };
  if (problemId) query.problem = problemId;

  const submissions = await Submission.find(query)
    .populate('problem', 'name slug')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, submissions });
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