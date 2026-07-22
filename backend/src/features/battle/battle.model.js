const mongoose = require('mongoose');

const reviewEntrySchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'MCQ' },
  selectedIndex: { type: Number },
}, { _id: false });

const playerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: String,
  score: { type: Number, default: 0 },
  wrongCount: { type: Number, default: 0 },
  currentIndex: { type: Number, default: 0 },
  locked: { type: Boolean, default: false },
  solvedQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MCQ' }],
  reviewQuestions: [reviewEntrySchema],
}, { _id: false });

const battleSchema = new mongoose.Schema({
  playerA: playerSchema,
  playerB: playerSchema,
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MCQ' }],
  mode: {
    type: String,
    enum: ['5min', '10min', '30min', 'survival'],
    required: true,
  },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isDraw: { type: Boolean, default: false },
  hadSuddenDeath: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['active', 'sudden_death', 'finished'],
    default: 'active',
  },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, default: null },
  lastCheckpointAt: { type: Date, default: null },
}, { timestamps: true });

battleSchema.index({ 'playerA.user': 1 });
battleSchema.index({ 'playerB.user': 1 });

const Battle = mongoose.model('Battle', battleSchema);
module.exports = Battle;
