const jwt = require('jsonwebtoken');
const User = require('../auth/auth.model');
const Battle = require('./battle.model');
const TestCase = require('../testcases/testcase.model');
const { runCode } = require('../execution/dockerRunner');
const { createBattle, getModeTimeLimit } = require('./battle.service');
const redis = require('../../config/redis');
const {
  joinQueue, findMatch, leaveQueue,
  saveSession, getSession, updateSession, deleteSession,
  setUserBattle, getUserBattle, clearUserBattle,
  QUEUE_KEY,
} = require('./battle.queue');
const logger = require('../../shared/utils/logger');

const MAX_WRONGS = 3;

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
    'playerA.locked': playerA.locked,
    'playerA.solvedProblems': playerA.solvedProblems,
    'playerA.reviewProblems': playerA.reviewProblems,
    'playerB.score': playerB.score,
    'playerB.wrongCount': playerB.wrongCount,
    'playerB.locked': playerB.locked,
    'playerB.solvedProblems': playerB.solvedProblems,
    'playerB.reviewProblems': playerB.reviewProblems,
  });

  const resultPayload = {
    winner: winner
      ? (winner === playerA.userId ? playerA.username : playerB.username)
      : null,
    isDraw,
    playerA: {
      username: playerA.username,
      score: playerA.score,
      wrongCount: playerA.wrongCount,
    },
    playerB: {
      username: playerB.username,
      score: playerB.score,
      wrongCount: playerB.wrongCount,
    },
    reason,
  };

  io.to(battleId).emit('battle:ended', resultPayload);

  await deleteSession(battleId);
  await clearUserBattle(playerA.userId);
  await clearUserBattle(playerB.userId);
};

const setupBattleSocket = (io) => {
  // per-user submit cooldown map
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

          const { battle, problems } = await createBattle(
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
            problems: problems.map(p => ({
              _id: p._id.toString(),
              name: p.name,
              slug: p.slug,
              difficulty: p.difficulty,
              statement: p.statement,
              timeLimit: p.timeLimit,
              memoryLimit: p.memoryLimit,
            })),
            playerA: {
              userId: playerA.userId,
              username: playerA.username,
              socketId: playerA.socketId,
              score: 0, wrongCount: 0, currentIndex: 0,
              locked: false, solvedProblems: [], reviewProblems: [],
            },
            playerB: {
              userId: playerB.userId,
              username: playerB.username,
              socketId: playerB.socketId,
              score: 0, wrongCount: 0, currentIndex: 0,
              locked: false, solvedProblems: [], reviewProblems: [],
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
            problems: session.problems,
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
    socket.on('battle:submit', async ({ battleId, problemId, code, language }) => {
      try {
        const userId = socket.user._id.toString();

        // rate limit — 1 submission per 3 seconds per user
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
        if (!session) return socket.emit('battle:error', { message: 'Battle not found' });

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

        const testCases = await TestCase.find({ problem: problemId });

        const results = await Promise.all(
          testCases.map(tc =>
            runCode(
              `battle_${battleId}_${userId}_${Date.now()}`,
              code, language, tc.input
            )
          )
        );

        let verdict = 'Accepted';
        for (let i = 0; i < results.length; i++) {
          if (results[i].verdict) { verdict = results[i].verdict; break; }
          if (results[i].output.trim() !== testCases[i].output.trim()) {
            verdict = 'Wrong Answer'; break;
          }
        }

        const correct = verdict === 'Accepted';

        if (correct) {
          session[playerKey].score += 1;
          session[playerKey].solvedProblems.push(problemId);
          session[playerKey].currentIndex += 1;
        } else {
          session[playerKey].wrongCount += 1;
          session[playerKey].reviewProblems.push(problemId);
          session[playerKey].currentIndex += 1;

          if (session[playerKey].wrongCount >= MAX_WRONGS) {
            session[playerKey].locked = true;
          }
        }

        await updateSession(battleId, session);

        socket.emit('battle:submit_result', {
          verdict,
          correct,
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

        // check if both finished all problems
        const totalProblems = session.problems.length;
        if (
          session.playerA.currentIndex >= totalProblems &&
          session.playerB.currentIndex >= totalProblems
        ) {
          if (session.playerA.score === session.playerB.score) {
            session.status = 'sudden_death';
            await updateSession(battleId, session);
            const suddenDeathProblem = session.problems[0];
            io.to(battleId).emit('battle:sudden_death', {
              problem: suddenDeathProblem,
            });
          } else {
            await endBattle(io, battleId, session, 'all_problems_done');
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