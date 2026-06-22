const { runCode } = require('./dockerRunner');
const Submission = require('../submissions/submission.model');
const TestCase = require('../testcases/testcase.model');
const User = require('../auth/auth.model');
const VERDICTS = require('../../shared/constants/verdicts');
const { updateLeaderboard } = require('../leaderboard/leaderboard.service');
const logger = require('../../shared/utils/logger');

const runSubmission = async (submissionId) => {
  const submission = await Submission.findById(submissionId);
  if (!submission) throw new Error('Submission not found');

  const testCases = await TestCase.find({ problem: submission.problem });
  if (testCases.length === 0) {
    await Submission.findByIdAndUpdate(submissionId, { verdict: VERDICTS.ACCEPTED });
    return;
  }

  try {
    const results = await Promise.all(
      testCases.map(tc => runCode(
        submissionId.toString() + '_' + tc._id,
        submission.code,
        submission.language,
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

    await Submission.findByIdAndUpdate(submissionId, {
      verdict: finalVerdict,
      executionTime: Math.round(totalTime / testCases.length),
    });

    // update leaderboard if accepted
    if (finalVerdict === VERDICTS.ACCEPTED) {
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

module.exports = { runSubmission };