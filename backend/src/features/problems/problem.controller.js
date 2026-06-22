
const asyncWrapper = require('../../shared/utils/asyncWrapper');
const AppError = require('../../shared/utils/AppError');
const { getAllProblems, getProblemBySlug, createProblem, addTestCases } = require('./problem.service');
const { createProblemSchema, createTestCaseSchema } = require('./problem.validation');

const listProblems = asyncWrapper(async (req, res) => {
  const { difficulty, tag } = req.query;
  const problems = await getAllProblems({ difficulty, tag });
  res.json({ success: true, count: problems.length, problems });
});

const getSingleProblem = asyncWrapper(async (req, res) => {
  const { slug } = req.params;
  const result = await getProblemBySlug(slug);
  if (!result) throw new AppError('Problem not found', 404);
  res.json({ success: true, problem: result.problem, sampleTestCases: result.sampleTestCases });
});

const create = asyncWrapper(async (req, res) => {
  const { error } = createProblemSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const problem = await createProblem(req.body, req.user._id);
  res.status(201).json({ success: true, problem });
});

const addTestCasesToProblem = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const testCases = req.body.testCases;

  if (!Array.isArray(testCases) || testCases.length === 0) {
    throw new AppError('testCases must be a non-empty array', 400);
  }

  for (const tc of testCases) {
    const { error } = createTestCaseSchema.validate(tc);
    if (error) throw new AppError(error.details[0].message, 400);
  }

  const result = await addTestCases(id, testCases);
  res.status(201).json({ success: true, count: result.length, testCases: result });
});

module.exports = { listProblems, getSingleProblem, create, addTestCasesToProblem };