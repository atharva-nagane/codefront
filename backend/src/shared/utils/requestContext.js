// E:\online-judge\backend\src\shared\utils\requestContext.js
const { AsyncLocalStorage } = require('async_hooks');

const requestContext = new AsyncLocalStorage();

const getRequestId = () => requestContext.getStore()?.requestId;

module.exports = { requestContext, getRequestId };
