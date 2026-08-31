import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Room from '../src/models/Room.js';
import RoomVersion from '../src/models/RoomVersion.js';
import { connectTestDB, closeTestDB } from './setup.js';

describe('Rooms & Collaboration API Suite', () => {
  let userToken = '';
  let userId = '';
  let createdRoomId = '';

  beforeAll(async () => {
    await connectTestDB();
    const user = await User.create({
      name: 'Jest Room Owner',
      email: `jest_room_${Date.now()}@example.com`,
      passwordHash: 'RoomPass123!',
    });
    userId = user._id;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'RoomPass123!' });
    userToken = loginRes.body.token;
  });

  afterAll(async () => {
    if (createdRoomId) {
      await RoomVersion.deleteMany({ roomId: createdRoomId });
      await Room.deleteOne({ roomId: createdRoomId });
    }
    await User.deleteOne({ _id: userId });
    await closeTestDB();
  });

  test('POST /api/rooms - Creates room with unique CS-XXXXXX identifier', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Algorithms Workspace',
        language: 'python',
        isPublic: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.room.roomId).toMatch(/^CS-[A-Z0-9]{6}$/);
    expect(res.body.room.language).toBe('python');
    createdRoomId = res.body.room.roomId;
  });

  test('GET /api/rooms/:roomId - Retrieves room details', async () => {
    const res = await request(app)
      .get(`/api/rooms/${createdRoomId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.room.name).toBe('Algorithms Workspace');
  });

  test('POST /api/rooms/:roomId/save - Saves code and creates RoomVersion', async () => {
    const res = await request(app)
      .post(`/api/rooms/${createdRoomId}/save`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        code: 'def solve(): return True',
        language: 'python',
        createVersion: true,
        title: 'Initial Solution',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.version).toBeDefined();
  });

  test('GET /api/rooms/:roomId/versions - Retrieves version history list', async () => {
    const res = await request(app)
      .get(`/api/rooms/${createdRoomId}/versions`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.versions.length).toBeGreaterThanOrEqual(1);
  });
});
