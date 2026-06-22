
const Joi = require('joi');

const createProblemSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  slug: Joi.string().min(3).max(50).lowercase().required(),
  statement: Joi.string().min(10).required(),
  difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').required(),
  tags: Joi.array().items(Joi.string()).default([]),
  timeLimit: Joi.number().default(5000),
  memoryLimit: Joi.number().default(256),
});

const createTestCaseSchema = Joi.object({
  input: Joi.string().required(),
  output: Joi.string().required(),
  isSample: Joi.boolean().default(false),
});

module.exports = { createProblemSchema, createTestCaseSchema };