import crypto from 'crypto';
import Room from '../models/Room.js';

/**
 * Generates a unique, collision-free Room ID in the format: CS-XXXXXX
 * Example: CS-8F3K29
 */
export const generateUniqueRoomId = async () => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omitted similar chars: 0, O, 1, I
  let isUnique = false;
  let roomId = '';

  while (!isUnique) {
    let result = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(bytes[i] % characters.length);
    }
    roomId = `CS-${result}`;

    const existing = await Room.findOne({ roomId });
    if (!existing) {
      isUnique = true;
    }
  }

  return roomId;
};
