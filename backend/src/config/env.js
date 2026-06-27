const { execSync } = require('child_process');
const logger = require('../shared/utils/logger');

const requiredVars = [
  'MONGO_URI',
  'REDIS_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_EXPIRY',
  'JWT_REFRESH_EXPIRY',
  'CLIENT_URL',
];

// PORT only required for server, not worker
if (!process.env.IS_WORKER) {
  requiredVars.push('PORT');
}

const missing = requiredVars.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

// Docker health check
try {
  execSync('docker ps', { stdio: 'ignore' });
  logger.info('Docker is running');
} catch (err) {
  logger.warn('Docker is not running — code execution will fail.');
}

logger.info('All environment variables loaded successfully');