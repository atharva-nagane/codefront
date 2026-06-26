const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// set test env vars if not already set
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-testing';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-for-testing';
process.env.JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
process.env.JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
process.env.NODE_ENV = 'test';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});