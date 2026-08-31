import dotenv from 'dotenv';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import RoomVersion from '../models/RoomVersion.js';

dotenv.config();

const runSaveTests = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codesync';
    await mongoose.connect(mongoUri);
    console.log('[TestSaveCode] Connected to database');

    const testUser = await User.create({
      name: 'Save Test Developer',
      email: `savetest_${Date.now()}@example.com`,
      passwordHash: 'SavePass123!',
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'SavePass123!' });
    const token = loginRes.body.token;

    // Create Room
    const roomRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Database Persistence Test Room',
        language: 'javascript',
      });
    const roomId = roomRes.body.room.roomId;
    console.log(`✓ Room created: ${roomId}`);

    // 1. Test POST /api/rooms/:roomId/save with version snapshot
    console.log('Testing manual code save with version snapshot...');
    const savedCodePayload = '// Production CodeSync Version Snapshot\nconst status = "PERSISTED";';
    const saveRes = await request(app)
      .post(`/api/rooms/${roomId}/save`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: savedCodePayload,
        language: 'javascript',
        createVersion: true,
        title: 'Milestone 1 Implementation',
      });

    if (saveRes.status !== 200 || !saveRes.body.version) {
      throw new Error(`Save code failed: ${JSON.stringify(saveRes.body)}`);
    }
    console.log('✓ Manual Save API responded with success.');

    // 2. Verify MongoDB state directly
    const updatedRoomInDb = await Room.findOne({ roomId });
    if (updatedRoomInDb.code !== savedCodePayload) {
      throw new Error('Database Room code was not updated correctly!');
    }
    console.log('✓ Verified direct MongoDB persistence of room code.');

    const versionsInDb = await RoomVersion.find({ roomId });
    // Expect 2 versions: 1 from creation, 1 from save
    if (versionsInDb.length < 2) {
      throw new Error(`Expected at least 2 versions, found ${versionsInDb.length}`);
    }
    console.log(`✓ Verified RoomVersion snapshots in MongoDB (Total: ${versionsInDb.length}).`);

    // Clean up
    await RoomVersion.deleteMany({ roomId });
    await Room.deleteOne({ roomId });
    await User.deleteOne({ _id: testUser._id });
    console.log('✓ Cleaned up test records.');

    await mongoose.disconnect();
    console.log('✓ All Code Saving & MongoDB Persistence tests passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Save test failed:', error);
    process.exit(1);
  }
};

runSaveTests();
