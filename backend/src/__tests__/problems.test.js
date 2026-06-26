const request = require('supertest');
const app = require('./testApp');
const User = require('../features/auth/auth.model');

describe('Problems API', () => {

  let adminCookies;
  let userCookies;
  let createdProblemId;

  const adminUser = {
    fullName: 'Admin User',
    email: 'admin@codefront.com',
    username: 'adminuser',
    password: 'password123',
  };

  const regularUser = {
    fullName: 'Regular User',
    email: 'user@codefront.com',
    username: 'regularuser',
    password: 'password123',
  };

  beforeEach(async () => {
    // register admin
    const adminRes = await request(app)
      .post('/api/v1/auth/register')
      .send(adminUser);
    adminCookies = adminRes.headers['set-cookie'];

    // make admin
    await User.findOneAndUpdate(
      { email: adminUser.email },
      { role: 'admin' }
    );

    // re-login to get fresh token with admin role reflected
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminUser.email, password: adminUser.password });
    adminCookies = loginRes.headers['set-cookie'];

    // register regular user
    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send(regularUser);
    userCookies = userRes.headers['set-cookie'];
  });

  describe('GET /api/v1/problems', () => {
    it('should return empty list when no problems', async () => {
      const res = await request(app).get('/api/v1/problems');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.problems).toHaveLength(0);
    });

    it('should return problems list', async () => {
      await request(app)
        .post('/api/v1/problems')
        .set('Cookie', adminCookies)
        .send({
          name: 'Test Problem',
          slug: 'test-problem',
          statement: 'This is a test problem statement',
          difficulty: 'Easy',
          tags: ['array'],
          timeLimit: 5000,
          memoryLimit: 256,
        });

      const res = await request(app).get('/api/v1/problems');
      expect(res.status).toBe(200);
      expect(res.body.problems).toHaveLength(1);
    });

    it('should filter by difficulty', async () => {
      await request(app)
        .post('/api/v1/problems')
        .set('Cookie', adminCookies)
        .send({ name: 'Easy Problem', slug: 'easy-p', statement: 'Easy problem statement', difficulty: 'Easy', tags: [], timeLimit: 5000, memoryLimit: 256 });

      await request(app)
        .post('/api/v1/problems')
        .set('Cookie', adminCookies)
        .send({ name: 'Hard Problem', slug: 'hard-p', statement: 'Hard problem statement', difficulty: 'Hard', tags: [], timeLimit: 5000, memoryLimit: 256 });

      const res = await request(app).get('/api/v1/problems?difficulty=Easy');
      expect(res.status).toBe(200);
      expect(res.body.problems).toHaveLength(1);
      expect(res.body.problems[0].difficulty).toBe('Easy');
    });
  });

  describe('POST /api/v1/problems', () => {
    const newProblem = {
      name: 'Two Sum',
      slug: 'two-sum',
      statement: 'Given an array find two numbers that add to target',
      difficulty: 'Easy',
      tags: ['array', 'hash-table'],
      timeLimit: 5000,
      memoryLimit: 256,
    };

    it('should create problem as admin', async () => {
      const res = await request(app)
        .post('/api/v1/problems')
        .set('Cookie', adminCookies)
        .send(newProblem);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.problem.slug).toBe('two-sum');
      createdProblemId = res.body.problem._id;
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .post('/api/v1/problems')
        .set('Cookie', userCookies)
        .send(newProblem);

      expect(res.status).toBe(403);
    });

    it('should return 401 for unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/v1/problems')
        .send(newProblem);

      expect(res.status).toBe(401);
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/problems')
        .set('Cookie', adminCookies)
        .send({ name: 'Incomplete Problem' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/problems/:slug', () => {
    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/problems')
        .set('Cookie', adminCookies)
        .send({
          name: 'Slug Test Problem',
          slug: 'slug-test',
          statement: 'Test statement for slug test',
          difficulty: 'Medium',
          tags: ['test'],
          timeLimit: 5000,
          memoryLimit: 256,
        });
      createdProblemId = res.body.problem._id;
    });

    it('should return problem by slug', async () => {
      const res = await request(app).get('/api/v1/problems/slug-test');
      expect(res.status).toBe(200);
      expect(res.body.problem.slug).toBe('slug-test');
    });

    it('should return 404 for non-existent slug', async () => {
      const res = await request(app).get('/api/v1/problems/does-not-exist');
      expect(res.status).toBe(404);
    });
  });
});