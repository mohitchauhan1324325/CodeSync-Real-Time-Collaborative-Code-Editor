import dotenv from 'dotenv';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';

dotenv.config();

const runAuthTests = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codesync';
    await mongoose.connect(mongoUri);
    console.log('[TestAuth] Connected to database');

    const testEmail = `authtest_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    let token = '';

    // 1. Test Register
    console.log('Testing user registration...');
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Auth Test User',
        email: testEmail,
        password: testPassword,
      });

    if (registerRes.status !== 201 || !registerRes.body.token) {
      throw new Error(`Register failed with status ${registerRes.status}: ${JSON.stringify(registerRes.body)}`);
    }
    console.log('✓ Registration passed! Token generated.');

    // 2. Test Duplicate Register
    console.log('Testing duplicate registration prevention...');
    const duplicateRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Auth Test User',
        email: testEmail,
        password: testPassword,
      });

    if (duplicateRes.status !== 400) {
      throw new Error(`Duplicate registration was not blocked! Status: ${duplicateRes.status}`);
    }
    console.log('✓ Duplicate registration successfully blocked.');

    // 3. Test Login
    console.log('Testing user login...');
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    if (loginRes.status !== 200 || !loginRes.body.token) {
      throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.body)}`);
    }
    token = loginRes.body.token;
    console.log('✓ Login passed!');

    // 4. Test Invalid Password Login
    console.log('Testing invalid password login...');
    const invalidLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword!',
      });

    if (invalidLoginRes.status !== 401) {
      throw new Error(`Invalid login was not rejected! Status: ${invalidLoginRes.status}`);
    }
    console.log('✓ Invalid password correctly rejected (401).');

    // 5. Test Protected Route: GET /api/auth/me
    console.log('Testing protected route GET /api/auth/me...');
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    if (meRes.status !== 200 || meRes.body.user.email !== testEmail) {
      throw new Error(`GetMe failed with status ${meRes.status}: ${JSON.stringify(meRes.body)}`);
    }
    console.log('✓ Protected route GET /api/auth/me passed! User:', meRes.body.user.name);

    // 6. Test Update Profile: PUT /api/auth/profile
    console.log('Testing profile update...');
    const updateRes = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bio: 'Full Stack Engineer & Real-Time Specialist',
      });

    if (updateRes.status !== 200 || updateRes.body.user.bio !== 'Full Stack Engineer & Real-Time Specialist') {
      throw new Error(`Profile update failed with status ${updateRes.status}`);
    }
    console.log('✓ Profile update passed!');

    // Clean up test user
    await User.deleteOne({ email: testEmail });
    console.log('✓ Cleaned up test user.');

    await mongoose.disconnect();
    console.log('✓ All Authentication tests passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Authentication test failed:', error);
    process.exit(1);
  }
};

runAuthTests();
