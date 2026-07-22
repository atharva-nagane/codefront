const jwt = require('jsonwebtoken');
const User = require('../auth/auth.model');
const Battle = require('./battle.model');
const { createBattle, getModeTimeLimit, pickExtraQuestion } = require('./battle.service');
const redis = require('../../config/redis');
const {
  joinQueue, findMatch, leaveQueue,
  saveSession, getSession, updateSession, deleteSession,
  setUserBattle, getUserBattle, clearUserBattle,
  QUEUE_KEY,
} = require('./battle.queue');
const logger = require('../../shared/utils/logger');

const MAX_WRONGS = 3;

// strips answer-revealing fields before a question set is sent to clients —
// the full data (with correctIndex/explanation) stays server-side in the
// Redis session for validation.
const sanitizeQuestions = (questions) => questions.map(q => ({
  _id: q._id.toString(),
  question: q.question,
  options: q.options,
  difficulty: q.difficulty,
  topic: q.topic,
}));

const authenticateSocket = async (socket) => {
  try {
    const token = socket.handshake.auth.token ||
      socket.handshake.headers.cookie?.split('accessToken=')[1]?.split(';')[0];
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    return user;
  } catch {
    return null;
  }
};

// P1.6 — persist a lightweight checkpoint of battle state to MongoDB so a
// Redis restart mid-battle doesn't lose scores/progress entirely. MCQ battles
// only need to checkpoint scores/index/wrongCounts (no code state), so this
// write is cheap and safe to do on every submission.
const checkpointBattle = async (battleId, session) => {
  try {
    await Battle.findByIdAndUpdate(battleId, {
      'playerA.score': session.playerA.score,
      'playerA.wrongCount': session.playerA.wrongCount,
      'playerA.currentIndex': session.playerA.currentIndex,
      'playerA.locked': session.playerA.locked,
      'playerA.solvedQuestions': session.playerA.solvedQuestions,
      'playerA.reviewQuestions': session.playerA.reviewQuestions,
      'playerB.score': session.playerB.score,
      'playerB.wrongCount': session.playerB.wrongCount,
      'playerB.currentIndex': session.playerB.currentIndex,
      'playerB.locked': session.playerB.locked,
      'playerB.solvedQuestions': session.playerB.solvedQuestions,
      'playerB.reviewQuestions': session.playerB.reviewQuestions,
      status: session.status,
      lastCheckpointAt: new Date(),
    });
  } catch (err) {
    logger.error(`Battle checkpoint failed for ${battleId}: ${err.message}`);
  }
};

// recovery path — if Redis lost the session (restart/eviction) but Mongo
// still shows the battle as active, finish it from the last checkpoint
// rather than leaving it stuck forever.
const recoverFromCheckpoint = async (io, battleId) => {
  const battle = await Battle.findById(battleId);
  if (!battle || battle.status === 'finished') return null;

  let winner = null;
  let isDraw = false;
  if (battle.playerA.score > battle.playerB.score) winner = battle.playerA.user;
  else if (battle.playerB.score > battle.playerA.score) winner = battle.playerB.user;
  else isDraw = true;

  battle.status = 'finished';
  battle.winner = winner;
  battle.isDraw = isDraw;
  battle.endTime = new Date();
  await battle.save();

  logger.warn(`Battle ${battleId} recovered from checkpoint after Redis session loss`);

  const resultPayload = {
    winner: winner
      ? (winner.toString() === battle.playerA.user.toString() ? battle.playerA.username : battle.playerB.username)
      : null,
    isDraw,
    playerA: { username: battle.playerA.username, score: battle.playerA.score, wrongCount: battle.playerA.wrongCount },
    playerB: { username: battle.playerB.username, score: battle.playerB.score, wrongCount: battle.playerB.wrongCount },
    reason: 'redis_recovery',
  };

  io.to(battleId).emit('battle:ended', resultPayload);
  return resultPayload;
};

const buildReview = async (player) => {
  const MCQ = require('./mcq.model');
  if (!player.reviewQuestions?.length) return [];

  const ids = player.reviewQuestions.map(r => r.questionId);
  const mcqs = await MCQ.find({ _id: { $in: ids } });
  const mcqMap = new Map(mcqs.map(m => [m._id.toString(), m]));

  return player.reviewQuestions.map(r => {
    const mcq = mcqMap.get(r.questionId);
    if (!mcq) return null;
    return {
      question: mcq.question,
      options: mcq.options,
      correctIndex: mcq.correctIndex,
      explanation: mcq.explanation,
      selectedIndex: r.selectedIndex,
    };
  }).filter(Boolean);
};

const endBattle = async (io, battleId, session, reason) => {
  logger.info(`Battle ${battleId} ending — reason: ${reason}`);

  const { playerA, playerB } = session;

  let winner = null;
  let isDraw = false;

  if (playerA.score > playerB.score) winner = playerA.userId;
  else if (playerB.score > playerA.score) winner = playerB.userId;
  else isDraw = true;

  await Battle.findByIdAndUpdate(battleId, {
    status: 'finished',
    winner: winner || null,
    isDraw,
    endTime: new Date(),
    'playerA.score': playerA.score,
    'playerA.wrongCount': playerA.wrongCount,
    'playerA.currentIndex': playerA.currentIndex,
    'playerA.locked': playerA.locked,
    'playerA.solvedQuestions': playerA.solvedQuestions,
    'playerA.reviewQuestions': playerA.reviewQuestions,
    'playerB.score': playerB.score,
    'playerB.wrongCount': playerB.wrongCount,
    'playerB.currentIndex': playerB.currentIndex,
    'playerB.locked': playerB.locked,
    'playerB.solvedQuestions': playerB.solvedQuestions,
    'playerB.reviewQuestions': playerB.reviewQuestions,
  });

  const [reviewA, reviewB] = await Promise.all([
    buildReview(playerA),
    buildReview(playerB),
  ]);

  const resultPayload = {
    winner: winner
      ? (winner === playerA.userId ? playerA.username : playerB.username)
      : null,
    isDraw,
    playerA: {
      username: playerA.username,
      score: playerA.score,
      wrongCount: playerA.wrongCount,
      review: reviewA,
    },
    playerB: {
      username: playerB.username,
      score: playerB.score,
      wrongCount: playerB.wrongCount,
      review: reviewB,
    },
    reason,
  };

  // each player only needs their own review — send targeted payloads
  io.to(playerA.socketId).emit('battle:ended', {
    ...resultPayload,
    myReview: reviewA,
  });
  io.to(playerB.socketId).emit('battle:ended', {
    ...resultPayload,
    myReview: reviewB,
  });

  await deleteSession(battleId);
  await clearUserBattle(playerA.userId);
  await clearUserBattle(playerB.userId);
};

const setupBattleSocket = (io) => {
  // per-user submit cooldown map — still useful to prevent spam-clicking
  // through MCQ options even though validation itself is instant.
  const submitCooldowns = new Map();

  io.use(async (socket, next) => {
    const user = await authenticateSocket(socket);
    if (!user) return next(new Error('Unauthorized'));
    socket.user = user;
    next();
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.user.username}`);

    // ── JOIN QUEUE ──────────────────────────────────────────────────────────
    socket.on('battle:join_queue', async (mode) => {
      try {
        const validModes = ['5min', '10min', '30min', 'survival'];
        if (!validModes.includes(mode)) return;

        const userId = socket.user._id.toString();

        // clear any stale state first
        await leaveQueue(mode, userId);
        await clearUserBattle(userId);

        // check if already in an active battle
        const existingBattle = await getUserBattle(userId);
        if (existingBattle) {
          const session = await getSession(existingBattle);
          if (session && session.status !== 'finished') {
            socket.emit('battle:error', { message: 'Already in a battle' });
            return;
          }
          await clearUserBattle(userId);
        }

        await joinQueue(mode, userId, socket.user.username, socket.id);
        socket.emit('battle:queued', { mode });

        const tryMatch = async () => {
          const match = await findMatch(mode);
          if (!match) return false;

          const { playerA, playerB } = match;

          const socketA = io.sockets.get(playerA.socketId);
          const socketB = io.sockets.get(playerB.socketId);

          if (!socketA || !socketB) {
            if (socketA) await joinQueue(mode, playerA.userId, playerA.username, playerA.socketId);
            if (socketB) await joinQueue(mode, playerB.userId, playerB.username, playerB.socketId);
            return false;
          }

          const { battle, questions } = await createBattle(
            { userId: playerA.userId, username: playerA.username },
            { userId: playerB.userId, username: playerB.username },
            mode
          );

          const battleId = battle._id.toString();

          const session = {
            battleId,
            mode,
            status: 'active',
            startTime: Date.now(),
            // full data (with correctIndex/explanation) kept server-side only
            questions: questions.map(q => ({
              _id: q._id.toString(),
              question: q.question,
              options: q.options,
              difficulty: q.difficulty,
              topic: q.topic,
              correctIndex: q.correctIndex,
              explanation: q.explanation,
            })),
            playerA: {
              userId: playerA.userId,
              username: playerA.username,
              socketId: playerA.socketId,
              score: 0, wrongCount: 0, currentIndex: 0,
              locked: false, solvedQuestions: [], reviewQuestions: [],
            },
            playerB: {
              userId: playerB.userId,
              username: playerB.username,
              socketId: playerB.socketId,
              score: 0, wrongCount: 0, currentIndex: 0,
              locked: false, solvedQuestions: [], reviewQuestions: [],
            },
          };

          await saveSession(battleId, session);
          await setUserBattle(playerA.userId, battleId);
          await setUserBattle(playerB.userId, battleId);

          socketA.join(battleId);
          socketB.join(battleId);

          const timeLimit = getModeTimeLimit(mode);

          const matchPayload = {
            battleId, mode, timeLimit,
            questions: sanitizeQuestions(questions),
          };

          socketA.emit('battle:matched', {
            ...matchPayload,
            opponent: { username: playerB.username },
            yourRole: 'playerA',
          });

          socketB.emit('battle:matched', {
            ...matchPayload,
            opponent: { username: playerA.username },
            yourRole: 'playerB',
          });

          if (timeLimit) {
            setTimeout(async () => {
              const currentSession = await getSession(battleId);
              if (currentSession && currentSession.status !== 'finished') {
                await endBattle(io, battleId, currentSession, 'time_expired');
              }
            }, timeLimit);
          }

          return true;
        };

        // try immediately
        const matched = await tryMatch();

        // if not matched poll every 2 seconds for up to 60 seconds
        if (!matched) {
          let attempts = 0;
          const pollInterval = setInterval(async () => {
            attempts++;

            try {
              const entries = await redis.lrange(QUEUE_KEY(mode), 0, -1);
              const stillInQueue = entries.some(e => JSON.parse(e).userId === userId);

              if (!stillInQueue || attempts > 30) {
                clearInterval(pollInterval);
                return;
              }

              const found = await tryMatch();
              if (found) clearInterval(pollInterval);
            } catch (err) {
              clearInterval(pollInterval);
            }
          }, 2000);
        }

      } catch (err) {
        logger.error(`battle:join_queue error: ${err.message}`);
        socket.emit('battle:error', { message: 'Failed to join queue' });
      }
    });

    // ── LEAVE QUEUE ─────────────────────────────────────────────────────────
    socket.on('battle:leave_queue', async (mode) => {
      try {
        const userId = socket.user._id.toString();
        await leaveQueue(mode, userId);
        await clearUserBattle(userId);
        socket.emit('battle:left_queue');
      } catch (err) {
        logger.error(`battle:leave_queue error: ${err.message}`);
      }
    });

    // ── SUBMIT IN BATTLE ────────────────────────────────────────────────────
    // MCQ battles validate synchronously in-memory — no Docker, no queue.
    socket.on('battle:submit', async ({ battleId, questionId, selectedIndex }) => {
      try {
        const userId = socket.user._id.toString();

        // rate limit — 1 submission per 3 seconds per user (prevents spam-clicking)
        const now = Date.now();
        const lastSubmit = submitCooldowns.get(userId) || 0;
        if (now - lastSubmit < 3000) {
          socket.emit('battle:error', {
            message: `Please wait ${Math.ceil((3000 - (now - lastSubmit)) / 1000)}s before submitting again`,
          });
          return;
        }
        submitCooldowns.set(userId, now);

        const session = await getSession(battleId);
        if (!session) {
          // Redis lost the session — recover from the last MongoDB checkpoint
          await recoverFromCheckpoint(io, battleId);
          return socket.emit('battle:error', { message: 'Battle not found' });
        }

        const isPlayerA = session.playerA.userId === userId;
        const playerKey = isPlayerA ? 'playerA' : 'playerB';
        const opponentKey = isPlayerA ? 'playerB' : 'playerA';
        const player = session[playerKey];

        if (player.locked) {
          socket.emit('battle:submit_result', {
            verdict: 'locked',
            message: 'You have 3 wrong answers',
          });
          return;
        }

        const mcq = session.questions.find(q => q._id === questionId);
        if (!mcq) return socket.emit('battle:error', { message: 'Question not found' });

        const correct = selectedIndex === mcq.correctIndex;

        if (correct) {
          session[playerKey].score += 1;
          session[playerKey].solvedQuestions.push(questionId);
          session[playerKey].currentIndex += 1;
        } else {
          session[playerKey].wrongCount += 1;
          session[playerKey].reviewQuestions.push({ questionId, selectedIndex });
          session[playerKey].currentIndex += 1;

          if (session[playerKey].wrongCount >= MAX_WRONGS) {
            session[playerKey].locked = true;
          }
        }

        await updateSession(battleId, session);
        await checkpointBattle(battleId, session);

        socket.emit('battle:submit_result', {
          correct,
          correctIndex: mcq.correctIndex,
          explanation: mcq.explanation,
          score: session[playerKey].score,
          wrongCount: session[playerKey].wrongCount,
          locked: session[playerKey].locked,
          nextIndex: session[playerKey].currentIndex,
        });

        io.to(session[opponentKey].socketId).emit('battle:opponent_update', {
          score: session[playerKey].score,
          wrongCount: session[playerKey].wrongCount,
          locked: session[playerKey].locked,
        });

        // check if both locked
        if (session.playerA.locked && session.playerB.locked) {
          await endBattle(io, battleId, session, 'both_locked');
          return;
        }

        // check if both finished all questions
        const totalQuestions = session.questions.length;
        if (
          session.playerA.currentIndex >= totalQuestions &&
          session.playerB.currentIndex >= totalQuestions
        ) {
          if (session.playerA.score === session.playerB.score) {
            session.status = 'sudden_death';
            const extra = await pickExtraQuestion(session.questions.map(q => q._id));
            if (extra) {
              session.questions.push({
                _id: extra._id.toString(),
                question: extra.question,
                options: extra.options,
                difficulty: extra.difficulty,
                topic: extra.topic,
                correctIndex: extra.correctIndex,
                explanation: extra.explanation,
              });
            }
            await updateSession(battleId, session);
            const suddenDeathQuestion = session.questions[session.questions.length - 1];
            io.to(battleId).emit('battle:sudden_death', {
              question: sanitizeQuestions([suddenDeathQuestion])[0],
            });
          } else {
            await endBattle(io, battleId, session, 'all_questions_done');
          }
        }

      } catch (err) {
        logger.error(`battle:submit error: ${err.message}`);
        socket.emit('battle:error', { message: 'Submission failed' });
      }
    });

    // ── DISCONNECT ──────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: ${socket.user.username}`);
      const userId = socket.user._id.toString();

      // cleanup rate limit entry
      submitCooldowns.delete(userId);

      const battleId = await getUserBattle(userId);

      if (battleId) {
        const session = await getSession(battleId);
        if (session && session.status !== 'finished') {
          await endBattle(io, battleId, session, 'opponent_left');
        }
      }
    });
  });
};

module.exports = { setupBattleSocket };
