
const AppError = require('../../shared/utils/AppError');

const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('Access denied — admins only', 403);
  }
  next();
};

module.exports = adminMiddleware;