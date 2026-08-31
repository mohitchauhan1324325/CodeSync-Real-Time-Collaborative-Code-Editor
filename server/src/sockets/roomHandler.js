import Room from '../models/Room.js';
import { USER_COLORS } from '../config/constants.js';

// In-memory active room state cache to avoid hitting MongoDB on every keystroke
// Structure: Map<roomId, { code: string, language: string, activeUsers: Map<socketId, userObj> }>
export const activeRooms = new Map();

export const registerRoomHandlers = (io, socket) => {
  // 1. Join Room
  socket.on('join-room', async ({ roomId, user }) => {
    if (!roomId || !user) return;
    const normalizedRoomId = roomId.toUpperCase().trim();
    const roomChannel = `room_${normalizedRoomId}`;

    socket.join(roomChannel);
    socket.roomId = normalizedRoomId;

    // Assign consistent color based on user ID or socket ID
    const colorIndex = Math.abs(
      (user.id || socket.id)
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % USER_COLORS.length;

    const userWithMetadata = {
      ...user,
      socketId: socket.id,
      color: USER_COLORS[colorIndex],
      joinedAt: new Date(),
    };
    socket.userData = userWithMetadata;

    // Retrieve or initialize in-memory room cache
    if (!activeRooms.has(normalizedRoomId)) {
      try {
        const dbRoom = await Room.findOne({ roomId: normalizedRoomId });
        activeRooms.set(normalizedRoomId, {
          code: dbRoom ? dbRoom.code : '// Welcome to CodeSync',
          language: dbRoom ? dbRoom.language : 'javascript',
          activeUsers: new Map(),
        });
      } catch (err) {
        console.error('[Socket] Error loading room from DB:', err.message);
        activeRooms.set(normalizedRoomId, {
          code: '// Welcome to CodeSync',
          language: 'javascript',
          activeUsers: new Map(),
        });
      }
    }

    const currentRoomState = activeRooms.get(normalizedRoomId);
    currentRoomState.activeUsers.set(socket.id, userWithMetadata);

    const activeUsersList = Array.from(currentRoomState.activeUsers.values());

    // Send current state to newly joined user
    socket.emit('room-state', {
      code: currentRoomState.code,
      language: currentRoomState.language,
      activeUsers: activeUsersList,
      currentUser: userWithMetadata,
    });

    // Broadcast to other peers in room that a new user joined
    socket.to(roomChannel).emit('user-joined', {
      user: userWithMetadata,
      activeUsers: activeUsersList,
    });

    console.log(`[Socket] ${user.name} (${socket.id}) joined ${normalizedRoomId}. Active: ${activeUsersList.length}`);
  });

  // 2. Code Change Synchronization
  socket.on('code-change', ({ roomId, code }) => {
    if (!roomId || code === undefined) return;
    const normalizedRoomId = roomId.toUpperCase().trim();
    const roomChannel = `room_${normalizedRoomId}`;

    const roomState = activeRooms.get(normalizedRoomId);
    if (roomState) {
      roomState.code = code;
    }

    // Broadcast to all other peers in the room (prevent echoing to sender)
    socket.to(roomChannel).emit('sync-code', {
      code,
      senderSocketId: socket.id,
      senderName: socket.userData?.name || 'Collaborator',
    });
  });

  // 3. Language Change Synchronization
  socket.on('language-change', ({ roomId, language }) => {
    if (!roomId || !language) return;
    const normalizedRoomId = roomId.toUpperCase().trim();
    const roomChannel = `room_${normalizedRoomId}`;

    const roomState = activeRooms.get(normalizedRoomId);
    if (roomState) {
      roomState.language = language;
    }

    // Broadcast language update to peers
    socket.to(roomChannel).emit('language-update', {
      language,
      senderName: socket.userData?.name || 'Collaborator',
    });

    console.log(`[Socket] Room ${normalizedRoomId} language updated to ${language} by ${socket.userData?.name}`);
  });

  // 4. Cursor Movement Synchronization (Throttled on client)
  socket.on('cursor-change', ({ roomId, position, selection }) => {
    if (!roomId || !position) return;
    const normalizedRoomId = roomId.toUpperCase().trim();
    const roomChannel = `room_${normalizedRoomId}`;

    // Broadcast cursor position and user info to other peers
    socket.to(roomChannel).emit('cursor-update', {
      socketId: socket.id,
      user: socket.userData,
      position,
      selection,
    });
  });

  // 5. Typing Activity Indicators
  socket.on('typing-start', ({ roomId }) => {
    if (!roomId) return;
    const normalizedRoomId = roomId.toUpperCase().trim();
    const roomChannel = `room_${normalizedRoomId}`;

    socket.to(roomChannel).emit('user-typing', {
      socketId: socket.id,
      user: socket.userData,
      isTyping: true,
    });
  });

  socket.on('typing-stop', ({ roomId }) => {
    if (!roomId) return;
    const normalizedRoomId = roomId.toUpperCase().trim();
    const roomChannel = `room_${normalizedRoomId}`;

    socket.to(roomChannel).emit('user-typing', {
      socketId: socket.id,
      user: socket.userData,
      isTyping: false,
    });
  });

  // 6. Code Saved Broadcast Notification
  socket.on('code-saved', ({ roomId, versionTitle, savedBy }) => {
    if (!roomId) return;
    const normalizedRoomId = roomId.toUpperCase().trim();
    const roomChannel = `room_${normalizedRoomId}`;

    socket.to(roomChannel).emit('code-saved-alert', {
      savedBy: savedBy || socket.userData?.name || 'A collaborator',
      versionTitle: versionTitle || 'New Snapshot',
      timestamp: new Date().toISOString(),
    });
  });

  // 7. Leave Room
  socket.on('leave-room', ({ roomId }) => {
    if (!roomId) return;
    const normalizedRoomId = roomId.toUpperCase().trim();
    handleUserLeave(io, socket, normalizedRoomId);
  });

  // 8. Disconnection
  socket.on('disconnecting', () => {
    if (socket.roomId) {
      handleUserLeave(io, socket, socket.roomId);
    }
  });
};

const handleUserLeave = (io, socket, roomId) => {
  const roomChannel = `room_${roomId}`;
  socket.leave(roomChannel);

  const roomState = activeRooms.get(roomId);
  if (roomState) {
    roomState.activeUsers.delete(socket.id);
    const activeUsersList = Array.from(roomState.activeUsers.values());

    socket.to(roomChannel).emit('user-left', {
      userId: socket.userData?.id,
      socketId: socket.id,
      name: socket.userData?.name || 'A user',
      activeUsers: activeUsersList,
    });

    console.log(`[Socket] ${socket.userData?.name || socket.id} left room ${roomId}. Remaining: ${activeUsersList.length}`);

    // If room is empty, we keep code cached for persistence or future rejoiners
    if (activeUsersList.length === 0) {
      // Optional: scheduled buffer flush can be triggered here
    }
  }
};
