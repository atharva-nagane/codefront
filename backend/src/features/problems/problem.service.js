
const Problem = require('./problem.model');
const TestCase = require('../testcases/testcase.model');

const getAllProblems = async (filters = {}) => {
  const query = {};
  if (filters.difficulty) query.difficulty = filters.difficulty;
  if (filters.tag) query.tags = { $in: [filters.tag] };

  return await Problem.find(query)
    .select('name slug difficulty tags timeLimit memoryLimit')
    .sort({ createdAt: -1 });
};

const getProblemBySlug = async (slug) => {
  const problem = await Problem.findOne({ slug });
  if (!problem) return null;

  const sampleTestCases = await TestCase.find({
    problem: problem._id,
    isSample: true,
  });

  return { problem, sampleTestCases };
};

const createProblem = async (data, userId) => {
  return await Problem.create({ ...data, createdBy: userId });
};

const addTestCases = async (problemId, testCases) => {
  const docs = testCases.map(tc => ({ ...tc, problem: problemId }));
  return await TestCase.insertMany(docs);
};

module.exports = { getAllProblems, getProblemBySlug, createProblem, addTestCases };