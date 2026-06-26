const request = require('supertest');
const app = require('./testApp');
const User = require('../features/auth/auth.model');
const Submission = require('../features/submissions/submission.model');

describe('Submissions API', () => {

  let userCookies;
  let problemId;

  const testUser = {
    fullName: 'Submission Tester',
    email: 'submitter@codefront.com',
    username: 'submitter',
    password: 'password123',
  };

  const adminUser = {
    fullName: 'Admin',
    email: 'admin2@codefront.com',
    username: 'admin2',
    password: 'password123',
  };

  beforeEach(async () => {
    // setup user
    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);
    userCookies = userRes.headers['set-cookie'];

    // setup admin and create problem
    await request(app).post('/api/v1/auth/register').send(adminUser);
    await User.findOneAndUpdate({ email: adminUser.email }, { role: 'admin' });
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminUser.email, password: adminUser.password });
    const adminCookies = loginRes.headers['set-cookie'];

    const problemRes = await request(app)
      .post('/api/v1/problems')
      .set('Cookie', adminCookies)
      .send({
        name: 'Test Problem',
        slug: 'test-submission-problem',
        statement: 'A problem for testing submissions',
        difficulty: 'Easy',
        tags: ['test'],
        timeLimit: 5000,
        memoryLimit: 256,
      });
    problemId = problemRes.body.problem._id;
  });

  describe('POST /api/v1/submissions', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/submissions')
        .send({ problemId, code: 'print("hello")', language: 'python' });

      expect(res.status).toBe(401);
    });

    it('should create submission with Pending verdict when authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/submissions')
        .set('Cookie', userCookies)
        .send({ problemId, code: 'print("hello")', language: 'python' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.submissionId).toBeDefined();

      const submission = await Submission.findById(res.body.submissionId);
      expect(submission).toBeDefined();
      expect(submission.verdict).toBe('Pending');
    });

    it('should return 400 for invalid language', async () => {
      const res = await request(app)
        .post('/api/v1/submissions')
        .set('Cookie', userCookies)
        .send({ problemId, code: 'print("hello")', language: 'ruby' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing code', async () => {
      const res = await request(app)
        .post('/api/v1/submissions')
        .set('Cookie', userCookies)
        .send({ problemId, language: 'python' });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent problem', async () => {
      const res = await request(app)
        .post('/api/v1/submissions')
        .set('Cookie', userCookies)
        .send({
          problemId: '507f1f77bcf86cd799439011',
          code: 'print("hello")',
          language: 'python',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/submissions/:id', () => {
    it('should return submission by id for owner', async () => {
      const submitRes = await request(app)
        .post('/api/v1/submissions')
        .set('Cookie', userCookies)
        .send({ problemId, code: 'print("hello")', language: 'python' });

      const submissionId = submitRes.body.submissionId;

      const res = await request(app)
        .get(`/api/v1/submissions/${submissionId}`)
        .set('Cookie', userCookies);

      expect(res.status).toBe(200);
      expect(res.body.submission._id).toBe(submissionId);
    });

    it('should return 401 when not authenticated', async () => {
      const submitRes = await request(app)
        .post('/api/v1/submissions')
        .set('Cookie', userCookies)
        .send({ problemId, code: 'print("hello")', language: 'python' });

      const res = await request(app)
        .get(`/api/v1/submissions/${submitRes.body.submissionId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/submissions', () => {
    it('should return user submission history', async () => {
      await request(app)
        .post('/api/v1/submissions')
        .set('Cookie', userCookies)
        .send({ problemId, code: 'print("hello")', language: 'python' });

      await request(app)
        .post('/api/v1/submissions')
        .set('Cookie', userCookies)
        .send({ problemId, code: 'print("world")', language: 'python' });

      const res = await request(app)
        .get('/api/v1/submissions')
        .set('Cookie', userCookies);

      expect(res.status).toBe(200);
      expect(res.body.submissions).toHaveLength(2);
    });
  });
});