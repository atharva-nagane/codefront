
const Joi = require('joi');

const submitCodeSchema = Joi.object({
  problemId: Joi.string().required(),
  code: Joi.string().min(1).max(50000).required(),
  language: Joi.string().valid('cpp', 'python', 'java').required(),
});

module.exports = { submitCodeSchema };