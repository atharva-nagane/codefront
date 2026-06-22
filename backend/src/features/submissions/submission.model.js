
const mongoose = require('mongoose');
const VERDICTS = require('../../shared/constants/verdicts');

const submissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    enum: ['cpp', 'python', 'java'],
    required: true,
  },
  verdict: {
    type: String,
    enum: Object.values(VERDICTS),
    default: VERDICTS.PENDING,
  },
  executionTime: {
    type: Number,
    default: 0,
  },
  memoryUsed: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

submissionSchema.index({ user: 1 });
submissionSchema.index({ problem: 1 });

const Submission = mongoose.model('Submission', submissionSchema);
module.exports = Submission;