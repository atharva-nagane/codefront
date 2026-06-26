const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

process.env.NODE_ENV = 'test';

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

app.use('/api/v1/auth',        require('../features/auth/auth.routes'));
app.use('/api/v1/problems',    require('../features/problems/problem.routes'));
app.use('/api/v1/submissions', require('../features/submissions/submission.routes'));
app.use('/api/v1/leaderboard', require('../features/leaderboard/leaderboard.routes'));
app.use('/api/v1/execution',   require('../features/execution/execution.routes'));
app.use('/api/v1/battles',     require('../features/battle/battle.routes'));
app.use('/api/v1/solo',        require('../features/battle/solo.routes'));

app.use(require('../shared/middlewares/errorHandler'));

module.exports = app;