const mongoose = require('mongoose');

const soloBattleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mode: { type: String, enum: ['5min', '10min', '30min', 'survival'], required: true },
  score: { type: Number, default: 0 },
  wrongCount: { type: Number, default: 0 },
  problems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
  solvedProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
  reviewProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
  timeTaken: { type: Number, default: 0 },
  isNewAllTimeBest: { type: Boolean, default: false },
  isNewWeeklyBest: { type: Boolean, default: false },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
}, { timestamps: true });

soloBattleSchema.index({ user: 1 });

const SoloBattle = mongoose.model('SoloBattle', soloBattleSchema);
module.exports = SoloBattle;