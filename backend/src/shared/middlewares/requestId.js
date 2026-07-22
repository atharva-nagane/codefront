// E:\online-judge\backend\src\shared\middlewares\requestId.js
const crypto = require('crypto');
const { requestContext } = require('../utils/requestContext');

const requestId = (req, res, next) => {
  const id = crypto.randomUUID().slice(0, 8);
  req.id = id;
  res.setHeader('X-Request-Id', id);
  requestContext.run({ requestId: id }, next);
};

module.exports = requestId;
