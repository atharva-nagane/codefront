// E:\online-judge\backend\server.js
require('dotenv').config();
require('./src/config/env');

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./src/config/db');
const logger = require('./src/shared/utils/logger');

const app = express();
connectDB();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/auth',        require('./src/features/auth/auth.routes'));
app.use('/api/v1/problems',    require('./src/features/problems/problem.routes'));
app.use('/api/v1/submissions', require('./src/features/submissions/submission.routes'));
app.use('/api/v1/execution', require('./src/features/execution/execution.routes'));
app.use('/api/v1/leaderboard', require('./src/features/leaderboard/leaderboard.routes'));

app.use(require('./src/shared/middlewares/errorHandler'));

app.listen(process.env.PORT, () => {
  logger.info(`Server running on port ${process.env.PORT}`);
});