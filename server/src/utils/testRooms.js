import dotenv from 'dotenv';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import RoomVersion from '../models/RoomVersion.js';

dotenv.config();

const runRoomTests = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codesync';
    await mongoose.connect(mongoUri);
    console.log('[TestRooms] Connected to database');

    // Create Owner User
    const ownerUser = await User.create({
      name: 'Room Owner',
      email: `owner_${Date.now()}@example.com`,
      passwordHash: 'OwnerPass123!',
    });

    // Create Collaborator User
    const collabUser = await User.create({
      name: 'Collaborator',
      email: `collab_${Date.now()}@example.com`,
      passwordHash: 'CollabPass123!',
    });

    // Login Owner
    const ownerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: ownerUser.email, password: 'OwnerPass123!' });
    const ownerToken = ownerLogin.body.token;

    // Login Collaborator
    const collabLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: collabUser.email, password: 'CollabPass123!' });
    const collabToken = collabLogin.body.token;

    // 1. Test Room Creation
    console.log('Testing room creation...');
    const createRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'LeetCode Hard Practice',
        language: 'python',
        isPublic: true,
      });

    if (createRes.status !== 201 || !createRes.body.room.roomId.startsWith('CS-')) {
      throw new Error(`Create room failed: ${JSON.stringify(createRes.body)}`);
    }
    const createdRoomId = createRes.body.room.roomId;
    console.log(`✓ Room created successfully with unique ID: ${createdRoomId}`);

    // 2. Test Get Room By ID
    console.log('Testing get room by ID...');
    const getRes = await request(app)
      .get(`/api/rooms/${createdRoomId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    if (getRes.status !== 200 || getRes.body.room.name !== 'LeetCode Hard Practice') {
      throw new Error(`Get room failed: ${JSON.stringify(getRes.body)}`);
    }
    console.log('✓ Get room by ID verified.');

    // 3. Test Collaborator Joining Room
    console.log('Testing collaborator joining room...');
    const joinRes = await request(app)
      .post(`/api/rooms/${createdRoomId}/join`)
      .set('Authorization', `Bearer ${collabToken}`);

    if (joinRes.status !== 200 || joinRes.body.room.participants.length !== 2) {
      throw new Error(`Join room failed: ${JSON.stringify(joinRes.body)}`);
    }
    console.log('✓ Collaborator joined room. Participant count = 2.');

    // 4. Test Collaborator Updating Code
    console.log('Testing code update by participant...');
    const updateRes = await request(app)
      .put(`/api/rooms/${createdRoomId}`)
      .set('Authorization', `Bearer ${collabToken}`)
      .send({
        code: 'def twoSum(nums, target): return [0, 1]',
      });

    if (updateRes.status !== 200 || !updateRes.body.room.code.includes('twoSum')) {
      throw new Error(`Update room code failed: ${JSON.stringify(updateRes.body)}`);
    }
    console.log('✓ Code updated successfully by participant.');

    // 5. Test Unauthorized Deletion (Non-owner cannot delete)
    console.log('Testing unauthorized deletion block...');
    const unauthDelRes = await request(app)
      .delete(`/api/rooms/${createdRoomId}`)
      .set('Authorization', `Bearer ${collabToken}`);

    if (unauthDelRes.status !== 403) {
      throw new Error(`Unauthorized delete was not rejected! Status: ${unauthDelRes.status}`);
    }
    console.log('✓ Unauthorized deletion properly blocked (403).');

    // 6. Test Collaborator Leaving Room
    console.log('Testing collaborator leaving room...');
    const leaveRes = await request(app)
      .post(`/api/rooms/${createdRoomId}/leave`)
      .set('Authorization', `Bearer ${collabToken}`);

    if (leaveRes.status !== 200) {
      throw new Error(`Leave room failed: ${JSON.stringify(leaveRes.body)}`);
    }
    console.log('✓ Collaborator successfully left room.');

    // 7. Test Owner Deleting Room (Cascade delete)
    console.log('Testing owner deletion & cascade...');
    const deleteRes = await request(app)
      .delete(`/api/rooms/${createdRoomId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    if (deleteRes.status !== 200) {
      throw new Error(`Delete room failed: ${JSON.stringify(deleteRes.body)}`);
    }

    const versionsRemaining = await RoomVersion.find({ roomId: createdRoomId });
    if (versionsRemaining.length > 0) {
      throw new Error('Cascade deletion failed: RoomVersions still exist!');
    }
    console.log('✓ Room and associated versions cascade deleted.');

    // Cleanup test users
    await User.deleteMany({ _id: { $in: [ownerUser._id, collabUser._id] } });
    console.log('✓ Cleaned up test users.');

    await mongoose.disconnect();
    console.log('✓ All Room API tests passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Room test failed:', error);
    process.exit(1);
  }
};

runRoomTests();
