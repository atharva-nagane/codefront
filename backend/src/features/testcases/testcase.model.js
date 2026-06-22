
const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
  },
  input: {
    type: String,
    required: true,
  },
  output: {
    type: String,
    required: true,
  },
  isSample: {
    type: Boolean,
    default: false,
  },
});

testCaseSchema.index({ problem: 1 });

const TestCase = mongoose.model('TestCase', testCaseSchema);
module.exports = TestCase;