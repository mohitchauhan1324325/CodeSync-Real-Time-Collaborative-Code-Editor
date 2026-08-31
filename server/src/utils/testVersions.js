import dotenv from 'dotenv';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import RoomVersion from '../models/RoomVersion.js';

dotenv.config();

const runVersionTests = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codesync';
    await mongoose.connect(mongoUri);
    console.log('[TestVersions] Connected to database');

    const testUser = await User.create({
      name: 'Version History Engineer',
      email: `version_${Date.now()}@example.com`,
      passwordHash: 'VersionPass123!',
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'VersionPass123!' });
    const token = loginRes.body.token;

    // 1. Create Room (Generates Version 1)
    const roomRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Version Control Test Room',
        language: 'javascript',
      });
    const roomId = roomRes.body.room.roomId;
    console.log(`✓ Room created: ${roomId}`);

    // 2. Save Second Milestone (Version 2)
    const v2Code = 'function calculateFibonacci(n) { return n <= 1 ? n : calculateFibonacci(n-1) + calculateFibonacci(n-2); }';
    await request(app)
      .post(`/api/rooms/${roomId}/save`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: v2Code,
        language: 'javascript',
        createVersion: true,
        title: 'Added Fibonacci algorithm',
      });

    // 3. Save Third Milestone (Version 3)
    const v3Code = 'function brokenCode() { throw new Error("Oops!"); }';
    await request(app)
      .post(`/api/rooms/${roomId}/save`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: v3Code,
        language: 'javascript',
        createVersion: true,
        title: 'Broken experiment',
      });

    // 4. Test GET /api/rooms/:roomId/versions
    console.log('Testing GET /api/rooms/:roomId/versions...');
    const versionsRes = await request(app)
      .get(`/api/rooms/${roomId}/versions`)
      .set('Authorization', `Bearer ${token}`);

    if (versionsRes.status !== 200 || versionsRes.body.versions.length !== 3) {
      throw new Error(`Versions list failed! Expected 3, got ${versionsRes.body.versions?.length}`);
    }
    console.log(`✓ Retrieved all 3 version snapshots successfully.`);

    const targetVersionToRestore = versionsRes.body.versions.find((v) => v.title === 'Added Fibonacci algorithm');
    if (!targetVersionToRestore) {
      throw new Error('Target version not found');
    }

    // 5. Test Restore Endpoint POST /api/rooms/:roomId/versions/:versionId/restore
    console.log(`Testing version restore for version ID: ${targetVersionToRestore._id}...`);
    const restoreRes = await request(app)
      .post(`/api/rooms/${roomId}/versions/${targetVersionToRestore._id}/restore`)
      .set('Authorization', `Bearer ${token}`);

    if (restoreRes.status !== 200 || restoreRes.body.code !== v2Code) {
      throw new Error(`Restore failed: ${JSON.stringify(restoreRes.body)}`);
    }
    console.log('✓ Successfully restored code to Fibonacci milestone.');

    // 6. Verify MongoDB Room document is updated
    const updatedRoom = await Room.findOne({ roomId });
    if (updatedRoom.code !== v2Code) {
      throw new Error('Room code in MongoDB was not updated by restore!');
    }
    console.log('✓ Verified direct MongoDB state after version restoration.');

    // Clean up
    await RoomVersion.deleteMany({ roomId });
    await Room.deleteOne({ roomId });
    await User.deleteOne({ _id: testUser._id });
    console.log('✓ Cleaned up test records.');

    await mongoose.disconnect();
    console.log('✓ All Version History & Restore tests passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Version test failed:', error);
    process.exit(1);
  }
};

runVersionTests();
