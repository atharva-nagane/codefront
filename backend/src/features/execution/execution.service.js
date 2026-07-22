const { runCode } = require('./dockerRunner');
const Submission = require('../submissions/submission.model');
const ContestSubmission = require('../contests/contestSubmission.model');
const TestCase = require('../testcases/testcase.model');
const User = require('../auth/auth.model');
const VERDICTS = require('../../shared/constants/verdicts');
const { updateLeaderboard } = require('../leaderboard/leaderboard.service');
const logger = require('../../shared/utils/logger');

const judge = async (submissionId, code, language, problemId) => {
  const testCases = await TestCase.find({ problem: problemId });

  if (testCases.length === 0) {
    return { verdict: VERDICTS.ACCEPTED, executionTime: 0 };
  }

  const results = await Promise.all(
    testCases.map(tc => runCode(
      submissionId.toString() + '_' + tc._id,
      code,
      language,
      tc.input
    ))
  );

  let finalVerdict = VERDICTS.ACCEPTED;
  let totalTime = 0;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    totalTime += result.executionTime;

    if (result.verdict) {
      finalVerdict = result.verdict;
      break;
    }

    const expected = testCases[i].output.trim();
    const actual = result.output.trim();

    if (actual !== expected) {
      finalVerdict = VERDICTS.WRONG_ANSWER;
      break;
    }
  }

  return {
    verdict: finalVerdict,
    executionTime: Math.round(totalTime / testCases.length),
  };
};

const runSubmission = async (submissionId) => {
  const submission = await Submission.findById(submissionId);
  if (!submission) throw new Error('Submission not found');

  try {
    const { verdict, executionTime } = await judge(
      submissionId, submission.code, submission.language, submission.problem
    );

    await Submission.findByIdAndUpdate(submissionId, { verdict, executionTime });

    if (verdict === VERDICTS.ACCEPTED) {
      const user = await User.findById(submission.user);
      if (user) {
        await updateLeaderboard(user._id.toString(), user.username);
      }
    }
  } catch (err) {
    logger.error(`Execution error for submission ${submissionId}: ${err.message}`);
    await Submission.findByIdAndUpdate(submissionId, {
      verdict: VERDICTS.RUNTIME_ERROR,
    });
  }
};

// P1.7 — contest submissions go through the same Bull queue/worker as
// regular submissions instead of running synchronously inside the request
// handler, so a spike of contest submissions can't block the event loop.
const runContestSubmission = async (contestSubmissionId) => {
  const submission = await ContestSubmission.findById(contestSubmissionId);
  if (!submission) throw new Error('Contest submission not found');

  try {
    const { verdict, executionTime } = await judge(
      contestSubmissionId, submission.code, submission.language, submission.problem
    );

    await ContestSubmission.findByIdAndUpdate(contestSubmissionId, { verdict, executionTime });
  } catch (err) {
    logger.error(`Execution error for contest submission ${contestSubmissionId}: ${err.message}`);
    await ContestSubmission.findByIdAndUpdate(contestSubmissionId, {
      verdict: VERDICTS.RUNTIME_ERROR,
    });
  }
};

module.exports = { runSubmission, runContestSubmission };
