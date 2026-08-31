import dotenv from 'dotenv';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';

dotenv.config();

const runSecurityTests = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codesync';
    await mongoose.connect(mongoUri);
    console.log('[TestSecurity] Connected to database');

    // 1. Test NoSQL Injection Defense ($gt in login)
    console.log('Testing NoSQL injection attack defense on login...');
    const injectionRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: { $gt: '' }, // Injection attempt
        password: { $gt: '' },
      });

    // Sanitizer removes $gt keys, leading to missing credentials or 400/401
    if (injectionRes.status !== 400 && injectionRes.status !== 401) {
      throw new Error(`NoSQL Injection was not mitigated! Status: ${injectionRes.status}`);
    }
    console.log('✓ NoSQL injection attack stripped and prevented.');

    // 2. Test Input Validation on Registration (invalid email & short password)
    console.log('Testing validation on malformed email...');
    const invalidEmailRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test',
        email: 'invalid-email-string',
        password: '123',
      });

    if (invalidEmailRes.status !== 400) {
      throw new Error(`Validation failed to catch invalid email! Status: ${invalidEmailRes.status}`);
    }
    console.log('✓ Invalid email correctly blocked (400).');

    // 3. Test Room Creation Validation (Empty Name)
    const validUser = await User.create({
      name: 'Security Admin',
      email: `security_${Date.now()}@example.com`,
      passwordHash: 'SecPass123!',
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'SecPass123!' });
    const token = loginRes.body.token;

    console.log('Testing room creation validation with empty name...');
    const emptyRoomRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: '   ',
        language: 'javascript',
      });

    if (emptyRoomRes.status !== 400) {
      throw new Error('Empty room name was not blocked!');
    }
    console.log('✓ Empty room name correctly blocked (400).');

    // 4. Test Code Execution Payload Size Limit
    console.log('Testing oversized code execution payload rejection (>64KB)...');
    const oversizedCode = 'console.log("X");'.repeat(5000); // ~90KB
    const oversizedRes = await request(app)
      .post('/api/rooms/CS-NONEXISTENT/execute')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: oversizedCode,
        language: 'javascript',
      });

    if (oversizedRes.status !== 400) {
      throw new Error(`Oversized payload was not blocked! Status: ${oversizedRes.status}`);
    }
    console.log('✓ Oversized execution payload correctly blocked (>64KB).');

    // Clean up
    await User.deleteOne({ _id: validUser._id });
    console.log('✓ Cleaned up test user.');

    await mongoose.disconnect();
    console.log('✓ All Security, Sanitization & Validation tests passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Security test failed:', error);
    process.exit(1);
  }
};

runSecurityTests();
