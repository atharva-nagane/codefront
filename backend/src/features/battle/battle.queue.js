const redis = require('../../config/redis');

const QUEUE_KEY = (mode) => `battle:queue:${mode}`;
const SESSION_KEY = (battleId) => `battle:session:${battleId}`;
const USER_BATTLE_KEY = (userId) => `battle:user:${userId}`;

const joinQueue = async (mode, userId, username, socketId) => {
  const entry = JSON.stringify({ userId, username, socketId, joinedAt: Date.now() });
  await redis.lpush(QUEUE_KEY(mode), entry);
};

const findMatch = async (mode) => {
  const queueKey = QUEUE_KEY(mode);
  const length = await redis.llen(queueKey);
  if (length < 2) return null;

  const entryA = await redis.rpop(queueKey);
  const entryB = await redis.rpop(queueKey);

  if (!entryA || !entryB) return null;

  return {
    playerA: JSON.parse(entryA),
    playerB: JSON.parse(entryB),
  };
};

const leaveQueue = async (mode, userId) => {
  const queueKey = QUEUE_KEY(mode);
  const entries = await redis.lrange(queueKey, 0, -1);
  for (const entry of entries) {
    const parsed = JSON.parse(entry);
    if (parsed.userId === userId) {
      await redis.lrem(queueKey, 1, entry);
      break;
    }
  }
};

const saveSession = async (battleId, sessionData) => {
  await redis.set(
    SESSION_KEY(battleId),
    JSON.stringify(sessionData),
    'EX', 60 * 60 * 2
  );
};

const getSession = async (battleId) => {
  const data = await redis.get(SESSION_KEY(battleId));
  return data ? JSON.parse(data) : null;
};

const updateSession = async (battleId, sessionData) => {
  await redis.set(
    SESSION_KEY(battleId),
    JSON.stringify(sessionData),
    'EX', 60 * 60 * 2
  );
};

const deleteSession = async (battleId) => {
  await redis.del(SESSION_KEY(battleId));
};

const setUserBattle = async (userId, battleId) => {
  await redis.set(USER_BATTLE_KEY(userId), battleId, 'EX', 60 * 60 * 2);
};

const getUserBattle = async (userId) => {
  return await redis.get(USER_BATTLE_KEY(userId));
};

const clearUserBattle = async (userId) => {
  await redis.del(USER_BATTLE_KEY(userId));
};

module.exports = {
  joinQueue, findMatch, leaveQueue,
  saveSession, getSession, updateSession, deleteSession,
  setUserBattle, getUserBattle, clearUserBattle,
  QUEUE_KEY,
};