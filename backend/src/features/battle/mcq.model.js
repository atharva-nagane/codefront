// E:\online-judge\backend\src\features\battle\mcq.model.js
const mongoose = require('mongoose');

const mcqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (arr) => arr.length === 4,
      message: 'options must have exactly 4 entries',
    },
  },
  correctIndex: { type: Number, required: true, min: 0, max: 3 },
  explanation: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true,
    index: true,
  },
  topic: { type: String },
}, { timestamps: true });

const MCQ = mongoose.model('MCQ', mcqSchema);
module.exports = MCQ;
