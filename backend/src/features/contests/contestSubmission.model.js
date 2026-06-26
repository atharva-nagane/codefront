const mongoose = require('mongoose');

const contestSubmissionSchema = new mongoose.Schema({
  contest: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  code: { type: String, required: true },
  language: { type: String, enum: ['cpp', 'python', 'java'], required: true },
  verdict: {
    type: String,
    enum: ['Pending', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'Compile Error'],
    default: 'Pending',
  },
  executionTime: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

contestSubmissionSchema.index({ contest: 1, user: 1 });
contestSubmissionSchema.index({ contest: 1, problem: 1 });

const ContestSubmission = mongoose.model('ContestSubmission', contestSubmissionSchema);
module.exports = ContestSubmission;