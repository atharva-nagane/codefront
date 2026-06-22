const asyncWrapper = require('../../shared/utils/asyncWrapper');
const AppError = require('../../shared/utils/AppError');
const Joi = require('joi');
const logger = require('../../shared/utils/logger');

const reviewSchema = Joi.object({
  code: Joi.string().min(1).max(50000).required(),
  language: Joi.string().valid('cpp', 'python', 'java').required(),
  verdict: Joi.string().required(),
  problemName: Joi.string().required(),
});

const review = asyncWrapper(async (req, res) => {
  const { error, value } = reviewSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const { code, language, verdict, problemName } = value;

  const prompt = `You are a competitive programming mentor reviewing a student's code submission.

Problem: ${problemName}
Language: ${language}
Verdict: ${verdict}

Code:
\`\`\`${language}
${code}
\`\`\`

Give a concise code review (max 200 words) covering:
1. Why the verdict occurred (if not Accepted)
2. One specific improvement to the logic or approach
3. One tip about code quality or efficiency

Be direct and encouraging. No lengthy preamble.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      logger.error(`Gemini API error: ${JSON.stringify(err)}`);
      throw new AppError('AI review unavailable right now', 503);
    }

    const data = await response.json();
    const reviewText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reviewText) throw new AppError('No review generated', 503);

    res.json({ success: true, review: reviewText });
  } catch (err) {
    if (err.isOperational) throw err;
    logger.error(`Gemini fetch error: ${err.message}`);
    throw new AppError('AI review unavailable right now', 503);
  }
});

module.exports = { review };