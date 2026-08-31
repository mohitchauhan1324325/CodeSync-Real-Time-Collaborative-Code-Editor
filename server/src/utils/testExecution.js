import dotenv from 'dotenv';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import ExecutionHistory from '../models/ExecutionHistory.js';

dotenv.config();

const runExecutionTests = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codesync';
    await mongoose.connect(mongoUri);
    console.log('[TestExecution] Connected to database');

    const testUser = await User.create({
      name: 'Execution Engineer',
      email: `exec_${Date.now()}@example.com`,
      passwordHash: 'ExecPass123!',
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'ExecPass123!' });
    const token = loginRes.body.token;

    const roomRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Execution Sandbox Room',
        language: 'javascript',
      });
    const roomId = roomRes.body.room.roomId;
    console.log(`✓ Room created: ${roomId}`);

    // 1. Test JavaScript Execution with stdout and calculations
    console.log('Testing JavaScript code execution...');
    const jsCode = `
      const a = 15;
      const b = 35;
      console.log("Calculated Sum:", a + b);
    `;

    const execRes = await request(app)
      .post(`/api/rooms/${roomId}/execute`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: jsCode,
        language: 'javascript',
        stdin: '',
      });

    if (execRes.status !== 200 || !execRes.body.data.stdout.includes('Calculated Sum: 50')) {
      throw new Error(`JavaScript execution failed: ${JSON.stringify(execRes.body)}`);
    }
    console.log(`✓ JavaScript executed successfully! Output: "${execRes.body.data.stdout.trim()}" (Time: ${execRes.body.data.executionTime}ms)`);

    // 2. Test Execution with Custom Stdin Input
    console.log('Testing execution with custom stdin...');
    const stdinCode = `
      console.log("Received Stdin:", stdin);
    `;

    const stdinRes = await request(app)
      .post(`/api/rooms/${roomId}/execute`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: stdinCode,
        language: 'javascript',
        stdin: '42\nCodeSync',
      });

    if (stdinRes.status !== 200 || !stdinRes.body.data.stdout.includes('42\\nCodeSync') && !stdinRes.body.data.stdout.includes('42')) {
      throw new Error(`Stdin execution failed: ${JSON.stringify(stdinRes.body)}`);
    }
    console.log('✓ Stdin input handling verified.');

    // 3. Test Runtime Error capture
    console.log('Testing error capture on invalid code...');
    const errorCode = `nonExistentFunctionCall();`;
    const errRes = await request(app)
      .post(`/api/rooms/${roomId}/execute`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: errorCode,
        language: 'javascript',
      });

    if (errRes.status !== 200 || (!errRes.body.data.stdout.includes('ERROR') && !errRes.body.data.stderr)) {
      throw new Error(`Error capture failed: ${JSON.stringify(errRes.body)}`);
    }
    console.log('✓ Error gracefully captured and returned.');

    // 4. Test Execution History API
    console.log('Testing GET /api/rooms/:roomId/executions...');
    const historyRes = await request(app)
      .get(`/api/rooms/${roomId}/executions`)
      .set('Authorization', `Bearer ${token}`);

    if (historyRes.status !== 200 || historyRes.body.executions.length < 3) {
      throw new Error(`Execution history check failed: ${JSON.stringify(historyRes.body)}`);
    }
    console.log(`✓ Execution history logged and retrieved from MongoDB (Total logs: ${historyRes.body.executions.length}).`);

    // Clean up
    await ExecutionHistory.deleteMany({ roomId });
    await Room.deleteOne({ roomId });
    await User.deleteOne({ _id: testUser._id });
    console.log('✓ Cleaned up test records.');

    await mongoose.disconnect();
    console.log('✓ All Code Execution Sandbox tests passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Execution test failed:', error);
    process.exit(1);
  }
};

runExecutionTests();
