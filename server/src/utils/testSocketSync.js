import http from 'http';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import express from 'express';
import { registerRoomHandlers } from '../sockets/roomHandler.js';

const runSocketTests = async () => {
  console.log('[TestSocketSync] Starting simulated real-time synchronization test...');

  const app = express();
  const testServer = http.createServer(app);
  const testIo = new Server(testServer);

  testIo.on('connection', (socket) => {
    registerRoomHandlers(testIo, socket);
  });

  const TEST_PORT = 5055;
  await new Promise((resolve) => testServer.listen(TEST_PORT, resolve));
  console.log(`[TestSocketSync] Test server listening on port ${TEST_PORT}`);

  const clientA = Client(`http://localhost:${TEST_PORT}`, { autoConnect: true });
  const clientB = Client(`http://localhost:${TEST_PORT}`, { autoConnect: true });

  const testRoomId = 'CS-TESTSYNC';
  const userA = { id: 'user_a', name: 'User A', email: 'userA@example.com' };
  const userB = { id: 'user_b', name: 'User B', email: 'userB@example.com' };

  try {
    // Wait for both clients to connect
    await Promise.all([
      new Promise((res) => clientA.on('connect', res)),
      new Promise((res) => clientB.on('connect', res)),
    ]);
    console.log('✓ Both Socket.io clients connected successfully.');

    // 1. Client A joins room
    const clientAJoinedPromise = new Promise((resolve) => {
      clientA.once('room-state', (state) => {
        resolve(state);
      });
    });
    clientA.emit('join-room', { roomId: testRoomId, user: userA });
    const stateA = await clientAJoinedPromise;
    console.log('✓ Client A joined room and received room-state. Code length:', stateA.code.length);

    // 2. Client B joins room -> Client A receives user-joined
    const userJoinedPromise = new Promise((resolve) => {
      clientA.once('user-joined', (data) => {
        resolve(data);
      });
    });
    clientB.emit('join-room', { roomId: testRoomId, user: userB });
    const joinEvent = await userJoinedPromise;
    console.log('✓ Client A received user-joined broadcast for:', joinEvent.user.name);

    // 3. Test Real-time Code Synchronization (Client A edits code -> Client B receives sync-code)
    const codeSyncPromise = new Promise((resolve) => {
      clientB.once('sync-code', (data) => {
        resolve(data);
      });
    });

    const newCodePayload = 'function collaborativeSum(a, b) { return a + b; }';
    clientA.emit('code-change', { roomId: testRoomId, code: newCodePayload });
    const receivedCode = await codeSyncPromise;

    if (receivedCode.code !== newCodePayload) {
      throw new Error(`Code mismatch! Expected '${newCodePayload}', got '${receivedCode.code}'`);
    }
    console.log('✓ Real-time Code Sync verified: Client B received updated code payload!');

    // 4. Test Language Synchronization (Client B switches to python -> Client A receives language-update)
    const langSyncPromise = new Promise((resolve) => {
      clientA.once('language-update', (data) => {
        resolve(data);
      });
    });

    clientB.emit('language-change', { roomId: testRoomId, language: 'python' });
    const receivedLang = await langSyncPromise;

    if (receivedLang.language !== 'python') {
      throw new Error(`Language mismatch! Expected 'python', got '${receivedLang.language}'`);
    }
    console.log('✓ Real-time Language Sync verified: Client A received language-update (python)!');

    // 5. Test Leave Room
    const userLeftPromise = new Promise((resolve) => {
      clientA.once('user-left', (data) => {
        resolve(data);
      });
    });

    clientB.emit('leave-room', { roomId: testRoomId });
    const leftEvent = await userLeftPromise;
    console.log(`✓ User-left broadcast verified: ${leftEvent.name} left the room.`);

    // Clean up connections
    clientA.disconnect();
    clientB.disconnect();
    testIo.close();
    testServer.close();

    console.log('✓ All Real-Time WebSocket Synchronization tests passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Socket sync test failed:', error);
    clientA.disconnect();
    clientB.disconnect();
    testIo.close();
    testServer.close();
    process.exit(1);
  }
};

runSocketTests();
