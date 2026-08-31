import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { connectTestDB, closeTestDB } from './setup.js';

describe('Authentication API Suite', () => {
  const testUser = {
    name: 'Jest Test User',
    email: `jest_auth_${Date.now()}@example.com`,
    password: 'Password123!',
  };
  let token = '';

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await User.deleteMany({ email: testUser.email });
    await closeTestDB();
  });

  test('POST /api/auth/register - Successfully registers user and returns JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test('POST /api/auth/register - Rejects duplicate email with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login - Successfully authenticates and returns token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  test('POST /api/auth/login - Rejects invalid password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'IncorrectPassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/me - Returns current user details with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.name).toBe(testUser.name);
  });

  test('GET /api/auth/me - Rejects request without token with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
