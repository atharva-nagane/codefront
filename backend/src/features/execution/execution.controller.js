const asyncWrapper = require('../../shared/utils/asyncWrapper');
const AppError = require('../../shared/utils/AppError');
const { runCode } = require('./dockerRunner');
const Joi = require('joi');

const runSchema = Joi.object({
  code: Joi.string().min(1).max(50000).required(),
  language: Joi.string().valid('cpp', 'python', 'java').required(),
  input: Joi.string().allow('').default(''),
});

const run = asyncWrapper(async (req, res) => {
  const { error, value } = runSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const { code, language, input } = value;
  const tempId = `run_${Date.now()}`;

  const result = await runCode(tempId, code, language, input);

  res.json({
    success: true,
    output: result.output,
    verdict: result.verdict,
    executionTime: result.executionTime,
  });
});

module.exports = { run };