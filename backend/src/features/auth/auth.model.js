const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const personalBestSchema = new mongoose.Schema({
  mode: String,
  score: { type: Number, default: 0 },
  wrongCount: { type: Number, default: 0 },
  achievedAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  allTimeBest: [personalBestSchema],
  weeklyBest: [personalBestSchema],
  weeklyBestResetAt: { type: Date, default: Date.now },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;