const MCQ = require('./mcq.model');
const Battle = require('./battle.model');

const QUESTIONS_PER_BATTLE = 20;
// intra-battle difficulty progression: ramp from Easy to Hard within one battle
const BAND_SIZES = { Easy: 8, Medium: 8, Hard: 4 };

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// pulls `count` MCQs of a given difficulty, shuffled, falling back to any
// difficulty if the pool is too small (e.g. freshly seeded DB).
const pickMCQs = async (difficulty, count, excludeIds = []) => {
  const pool = await MCQ.aggregate([
    { $match: { difficulty, _id: { $nin: excludeIds } } },
    { $sample: { size: count } },
  ]);

  if (pool.length >= count) return shuffle(pool);

  const fallback = await MCQ.aggregate([
    { $match: { _id: { $nin: excludeIds } } },
    { $sample: { size: count } },
  ]);
  return shuffle(fallback);
};

// builds a full question sequence for one battle: Easy band, then Medium,
// then Hard, shuffled within each band so players don't see identical order.
const selectQuestionsForBattle = async (count = QUESTIONS_PER_BATTLE) => {
  const usedIds = [];
  const bands = [];

  // scale band sizes proportionally if count != QUESTIONS_PER_BATTLE
  const scale = count / QUESTIONS_PER_BATTLE;
  const sizes = {
    Easy: Math.max(1, Math.round(BAND_SIZES.Easy * scale)),
    Medium: Math.max(1, Math.round(BAND_SIZES.Medium * scale)),
    Hard: Math.max(1, Math.round(BAND_SIZES.Hard * scale)),
  };

  for (const difficulty of ['Easy', 'Medium', 'Hard']) {
    const picked = await pickMCQs(difficulty, sizes[difficulty], usedIds);
    picked.forEach(q => usedIds.push(q._id));
    bands.push(...picked);
  }

  return bands;
};

const pickExtraQuestion = async (excludeIds) => {
  const [q] = await pickMCQs('Hard', 1, excludeIds);
  return q;
};

const createBattle = async (playerA, playerB, mode) => {
  const questions = await selectQuestionsForBattle(QUESTIONS_PER_BATTLE);

  const battle = await Battle.create({
    playerA: {
      user: playerA.userId,
      username: playerA.username,
    },
    playerB: {
      user: playerB.userId,
      username: playerB.username,
    },
    questions: questions.map(q => q._id),
    mode,
    status: 'active',
    startTime: new Date(),
  });

  return { battle, questions };
};

const getModeTimeLimit = (mode) => {
  const limits = {
    '5min': 5 * 60 * 1000,
    '10min': 10 * 60 * 1000,
    '30min': 30 * 60 * 1000,
    'survival': null,
  };
  return limits[mode];
};

module.exports = {
  createBattle,
  getModeTimeLimit,
  selectQuestionsForBattle,
  pickExtraQuestion,
  QUESTIONS_PER_BATTLE,
};
