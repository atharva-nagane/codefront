
const request = require('supertest');
const app = require('./testApp');
const User = require('../features/auth/auth.model');

describe('Auth API', () => {

  const validUser = {
    fullName: 'Test User',
    email: 'test@codefront.com',
    username: 'testuser',
    password: 'password123',
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return 201', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.username).toBe(validUser.username);
      expect(res.body.user.role).toBe('user');
    });

    it('should set httpOnly cookies on register', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validUser);

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const accessTokenCookie = cookies.find(c => c.startsWith('accessToken='));
      const refreshTokenCookie = cookies.find(c => c.startsWith('refreshToken='));
      expect(accessTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toBeDefined();
      expect(accessTokenCookie).toContain('HttpOnly');
    });

    it('should not store plain text password', async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
      const user = await User.findOne({ email: validUser.email });
      expect(user.password).not.toBe(validUser.password);
      expect(user.password).toMatch(/^\$2[aby]\$/);
    });

    it('should return 400 for duplicate email', async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
      const res = await request(app).post('/api/v1/auth/register').send(validUser);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@test.com' });
      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validUser, email: 'notanemail' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
    });

    it('should login with correct credentials and return 200', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.username).toBe(validUser.username);
    });

    it('should set cookies on login', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.find(c => c.startsWith('accessToken='))).toBeDefined();
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@test.com', password: 'password123' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return user data when authenticated', async () => {
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send(validUser);

      const cookies = registerRes.headers['set-cookie'];

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe(validUser.username);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should clear cookies on logout', async () => {
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send(validUser);

      const cookies = registerRes.headers['set-cookie'];

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      const clearedCookies = res.headers['set-cookie'];
      const accessCookie = clearedCookies?.find(c => c.startsWith('accessToken='));
      expect(accessCookie).toContain('Expires=Thu, 01 Jan 1970');
    });
  });
});
