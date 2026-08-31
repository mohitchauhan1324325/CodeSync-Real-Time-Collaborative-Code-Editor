import http from 'http';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import express from 'express';
import { registerRoomHandlers } from '../sockets/roomHandler.js';

const runCursorTests = async () => {
  console.log('[TestCursorSync] Starting simulated cursor & presence test...');

  const app = express();
  const testServer = http.createServer(app);
  const testIo = new Server(testServer);

  testIo.on('connection', (socket) => {
    registerRoomHandlers(testIo, socket);
  });

  const TEST_PORT = 5056;
  await new Promise((resolve) => testServer.listen(TEST_PORT, resolve));

  const clientA = Client(`http://localhost:${TEST_PORT}`, { autoConnect: true });
  const clientB = Client(`http://localhost:${TEST_PORT}`, { autoConnect: true });

  const testRoomId = 'CS-CURSORSYNC';
  const userA = { id: 'user_a', name: 'User A', email: 'userA@example.com' };
  const userB = { id: 'user_b', name: 'User B', email: 'userB@example.com' };

  try {
    await Promise.all([
      new Promise((res) => clientA.on('connect', res)),
      new Promise((res) => clientB.on('connect', res)),
    ]);

    clientA.emit('join-room', { roomId: testRoomId, user: userA });
    clientB.emit('join-room', { roomId: testRoomId, user: userB });

    // Wait a brief moment for both to be in room
    await new Promise((r) => setTimeout(r, 200));

    // 1. Test Cursor Movement (Client A moves cursor -> Client B receives cursor-update)
    const cursorPromise = new Promise((resolve) => {
      clientB.once('cursor-update', (data) => {
        resolve(data);
      });
    });

    clientA.emit('cursor-change', {
      roomId: testRoomId,
      position: { lineNumber: 14, column: 22 },
      selection: { startLineNumber: 14, startColumn: 22, endLineNumber: 14, endColumn: 22 },
    });

    const receivedCursor = await cursorPromise;
    if (
      receivedCursor.position.lineNumber !== 14 ||
      receivedCursor.position.column !== 22 ||
      !receivedCursor.user.color
    ) {
      throw new Error(`Cursor update verification failed: ${JSON.stringify(receivedCursor)}`);
    }
    console.log(`✓ Real-time Cursor update verified! User A cursor at Line 14, Col 22 (Color: ${receivedCursor.user.color})`);

    // 2. Test Typing Indicators (Client A starts typing -> Client B receives user-typing true)
    const typingPromise = new Promise((resolve) => {
      clientB.once('user-typing', (data) => {
        resolve(data);
      });
    });

    clientA.emit('typing-start', { roomId: testRoomId });
    const typingEvent = await typingPromise;
    if (!typingEvent.isTyping) {
      throw new Error('Typing start event verification failed');
    }
    console.log('✓ Real-time Typing Indicator verified: User A is typing');

    // Clean up
    clientA.disconnect();
    clientB.disconnect();
    testIo.close();
    testServer.close();

    console.log('✓ All Collaborative Cursor & Presence tests passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Cursor sync test failed:', error);
    clientA.disconnect();
    clientB.disconnect();
    testIo.close();
    testServer.close();
    process.exit(1);
  }
};

runCursorTests();
