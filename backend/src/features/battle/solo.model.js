const mongoose = require('mongoose');

const reviewEntrySchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'MCQ' },
  selectedIndex: { type: Number },
}, { _id: false });

const soloBattleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mode: { type: String, enum: ['5min', '10min', '30min', 'survival'], required: true },
  score: { type: Number, default: 0 },
  wrongCount: { type: Number, default: 0 },
  currentIndex: { type: Number, default: 0 },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MCQ' }],
  solvedQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MCQ' }],
  reviewQuestions: [reviewEntrySchema],
  timeTaken: { type: Number, default: 0 },
  isNewAllTimeBest: { type: Boolean, default: false },
  isNewWeeklyBest: { type: Boolean, default: false },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
}, { timestamps: true });

soloBattleSchema.index({ user: 1 });

const SoloBattle = mongoose.model('SoloBattle', soloBattleSchema);
module.exports = SoloBattle;
