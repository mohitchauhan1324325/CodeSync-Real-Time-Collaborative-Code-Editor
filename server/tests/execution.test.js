import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Room from '../src/models/Room.js';
import ExecutionHistory from '../src/models/ExecutionHistory.js';
import { connectTestDB, closeTestDB } from './setup.js';

describe('Sandboxed Code Execution Suite', () => {
  let userToken = '';
  let userId = '';
  let roomId = '';

  beforeAll(async () => {
    await connectTestDB();
    const user = await User.create({
      name: 'Jest Runner',
      email: `jest_exec_${Date.now()}@example.com`,
      passwordHash: 'RunnerPass123!',
    });
    userId = user._id;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'RunnerPass123!' });
    userToken = loginRes.body.token;

    const roomRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Execution Test Room', language: 'javascript' });
    roomId = roomRes.body.room.roomId;
  });

  afterAll(async () => {
    await ExecutionHistory.deleteMany({ roomId });
    await Room.deleteOne({ roomId });
    await User.deleteOne({ _id: userId });
    await closeTestDB();
  });

  test('POST /api/rooms/:roomId/execute - Successfully runs JS calculation', async () => {
    const res = await request(app)
      .post(`/api/rooms/${roomId}/execute`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        code: 'const result = 20 + 22; console.log("Answer:", result);',
        language: 'javascript',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stdout).toContain('Answer: 42');
    expect(res.body.data.status).toBe('Accepted');
  });

  test('POST /api/rooms/:roomId/execute - Handles custom stdin stream', async () => {
    const res = await request(app)
      .post(`/api/rooms/${roomId}/execute`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        code: 'console.log("Input:", stdin);',
        language: 'javascript',
        stdin: 'SampleInputVal',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.stdout).toContain('SampleInputVal');
  });

  test('GET /api/rooms/:roomId/executions - Retrieves execution telemetry history', async () => {
    const res = await request(app)
      .get(`/api/rooms/${roomId}/executions`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.executions.length).toBeGreaterThanOrEqual(2);
  });
});
