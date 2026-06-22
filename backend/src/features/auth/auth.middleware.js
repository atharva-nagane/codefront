const jwt = require('jsonwebtoken');
const User = require('./auth.model');
const AppError = require('../../shared/utils/AppError');
const asyncWrapper = require('../../shared/utils/asyncWrapper');

const authMiddleware = asyncWrapper(async (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) throw new AppError('Not authenticated', 401);

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('-password');
  if (!user) throw new AppError('User not found', 401);

  req.user = user;
  next();
});

module.exports = authMiddleware;