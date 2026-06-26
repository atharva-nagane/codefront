const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  problems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
  registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freezeLeaderboard: { type: Boolean, default: true }, // freeze 1hr before end
  status: {
    type: String,
    enum: ['upcoming', 'active', 'ended'],
    default: 'upcoming',
  },
}, { timestamps: true });

contestSchema.index({ startTime: 1 });
contestSchema.index({ status: 1 });

const Contest = mongoose.model('Contest', contestSchema);
module.exports = Contest;