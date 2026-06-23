const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/auth.middleware');
const asyncWrapper = require('../../shared/utils/asyncWrapper');
const Battle = require('./battle.model');
const AppError = require('../../shared/utils/AppError');

// get battle history for current user
router.get('/history', authMiddleware, asyncWrapper(async (req, res) => {
  const userId = req.user._id;
  const battles = await Battle.find({
    $or: [{ 'playerA.user': userId }, { 'playerB.user': userId }],
    status: 'finished',
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('problems', 'name slug difficulty');

  res.json({ success: true, battles });
}));

// get single battle result
router.get('/:id', authMiddleware, asyncWrapper(async (req, res) => {
  const battle = await Battle.findById(req.params.id)
    .populate('problems', 'name slug difficulty statement')
    .populate('playerA.user', 'username')
    .populate('playerB.user', 'username');

  if (!battle) throw new AppError('Battle not found', 404);

  res.json({ success: true, battle });
}));

module.exports = router;