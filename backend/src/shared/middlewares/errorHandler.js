// E:\online-judge\backend\src\shared\middlewares\errorHandler.js
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  logger.error(`Unexpected error: ${err.message}\n${err.stack}`);
  res.status(500).json({
    success: false,
    message: 'Something went wrong',
  });
};

module.exports = errorHandler;