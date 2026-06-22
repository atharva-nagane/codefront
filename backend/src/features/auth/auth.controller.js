const User = require('./auth.model');
const asyncWrapper = require('../../shared/utils/asyncWrapper');
const AppError = require('../../shared/utils/AppError');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  signAccessToken,
  signRefreshToken,
  saveRefreshToken,
  deleteRefreshToken,
  verifyRefreshToken,
} = require('./auth.service');
const { registerSchema, loginSchema } = require('./auth.validation');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

const register = asyncWrapper(async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const { fullName, email, username, password } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) throw new AppError('Email or username already in use', 400);

  const user = await User.create({ fullName, email, username, password });

  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  await saveRefreshToken(user._id, refreshToken);

  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

  res.status(201).json({
    success: true,
    user: { id: user._id, fullName: user.fullName, username: user.username, role: user.role },
  });
});

const login = asyncWrapper(async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new AppError('Invalid email or password', 401);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  await saveRefreshToken(user._id, refreshToken);

  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

  res.json({
    success: true,
    user: { id: user._id, fullName: user.fullName, username: user.username, role: user.role },
  });
});

const logout = asyncWrapper(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (refreshToken) {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    await deleteRefreshToken(decoded.id);
  }
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out' });
});

const refresh = asyncWrapper(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) throw new AppError('No refresh token', 401);

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const isValid = await verifyRefreshToken(decoded.id, refreshToken);
  if (!isValid) throw new AppError('Invalid refresh token', 401);

  const accessToken = signAccessToken(decoded.id);
  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.json({ success: true });
});

const getMe = asyncWrapper(async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = { register, login, logout, refresh, getMe };
