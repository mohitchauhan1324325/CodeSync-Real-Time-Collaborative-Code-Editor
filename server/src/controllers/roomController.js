import Room from '../models/Room.js';
import RoomVersion from '../models/RoomVersion.js';
import ExecutionHistory from '../models/ExecutionHistory.js';
import { generateUniqueRoomId } from '../utils/roomIdGenerator.js';
import { SUPPORTED_LANGUAGES } from '../config/constants.js';

// @desc    Create a new coding room
// @route   POST /api/rooms
// @access  Private
export const createRoom = async (req, res, next) => {
  try {
    const { name, language = 'javascript', isPublic = true } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid room name',
      });
    }

    if (!SUPPORTED_LANGUAGES[language]) {
      return res.status(400).json({
        success: false,
        message: `Language '${language}' is not supported. Supported: ${Object.keys(
          SUPPORTED_LANGUAGES
        ).join(', ')}`,
      });
    }

    const roomId = await generateUniqueRoomId();
    const defaultCode = SUPPORTED_LANGUAGES[language]?.defaultCode || '// Happy Coding!';

    const room = await Room.create({
      roomId,
      name: name.trim(),
      owner: req.user._id,
      language,
      code: defaultCode,
      isPublic: isPublic !== false,
      participants: [
        {
          user: req.user._id,
          role: 'owner',
          joinedAt: new Date(),
        },
      ],
      lastUpdatedBy: req.user._id,
    });

    // Create initial snapshot in RoomVersion
    await RoomVersion.create({
      roomId: room.roomId,
      code: room.code,
      language: room.language,
      title: 'Initial room creation',
      savedBy: req.user._id,
    });

    const populatedRoom = await Room.findById(room._id)
      .populate('owner', 'name email avatar')
      .populate('participants.user', 'name email avatar');

    return res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room: populatedRoom,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's rooms (owned and participated)
// @route   GET /api/rooms
// @access  Private
export const getUserRooms = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const rooms = await Room.find({
      $or: [{ owner: userId }, { 'participants.user': userId }],
    })
      .populate('owner', 'name email avatar')
      .populate('participants.user', 'name email avatar')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get room details by roomId
// @route   GET /api/rooms/:roomId
// @access  Private
export const getRoomById = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId: roomId.toUpperCase().trim() })
      .populate('owner', 'name email avatar')
      .populate('participants.user', 'name email avatar')
      .populate('lastUpdatedBy', 'name email avatar');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room with ID '${roomId}' was not found`,
      });
    }

    return res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join a room by roomId
// @route   POST /api/rooms/:roomId/join
// @access  Private
export const joinRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const room = await Room.findOne({ roomId: roomId.toUpperCase().trim() });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room with ID '${roomId}' was not found`,
      });
    }

    const isAlreadyParticipant = room.participants.some(
      (p) => p.user.toString() === userId.toString()
    );

    if (!isAlreadyParticipant) {
      const isOwner = room.owner.toString() === userId.toString();
      room.participants.push({
        user: userId,
        role: isOwner ? 'owner' : 'editor',
        joinedAt: new Date(),
      });
      await room.save();
    }

    const updatedRoom = await Room.findById(room._id)
      .populate('owner', 'name email avatar')
      .populate('participants.user', 'name email avatar');

    return res.status(200).json({
      success: true,
      message: 'Joined room successfully',
      room: updatedRoom,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave a room by roomId
// @route   POST /api/rooms/:roomId/leave
// @access  Private
export const leaveRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const room = await Room.findOne({ roomId: roomId.toUpperCase().trim() });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room with ID '${roomId}' was not found`,
      });
    }

    // Remove user from participants unless they are the owner
    if (room.owner.toString() !== userId.toString()) {
      room.participants = room.participants.filter(
        (p) => p.user.toString() !== userId.toString()
      );
      await room.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Left room successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update room details (language, name, code)
// @route   PUT /api/rooms/:roomId
// @access  Private
export const updateRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { name, language, code, isPublic } = req.body;
    const userId = req.user._id;

    const room = await Room.findOne({ roomId: roomId.toUpperCase().trim() });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room with ID '${roomId}' was not found`,
      });
    }

    // Check authorization: must be owner or participant
    const isParticipant = room.participants.some(
      (p) => p.user.toString() === userId.toString()
    );

    if (room.owner.toString() !== userId.toString() && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this room',
      });
    }

    if (name) room.name = name.trim();
    if (isPublic !== undefined) room.isPublic = isPublic;
    if (language && SUPPORTED_LANGUAGES[language]) {
      room.language = language;
    }
    if (code !== undefined) {
      room.code = code;
    }
    room.lastUpdatedBy = userId;

    await room.save();

    const updatedRoom = await Room.findById(room._id)
      .populate('owner', 'name email avatar')
      .populate('participants.user', 'name email avatar')
      .populate('lastUpdatedBy', 'name email avatar');

    return res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      room: updatedRoom,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save room code and create version snapshot
// @route   POST /api/rooms/:roomId/save
// @access  Private
export const saveRoomCode = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { code, language, createVersion = true, title } = req.body;
    const userId = req.user._id;

    if (code === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide code content to save',
      });
    }

    const room = await Room.findOne({ roomId: roomId.toUpperCase().trim() });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room with ID '${roomId}' was not found`,
      });
    }

    const isParticipant = room.participants.some(
      (p) => p.user.toString() === userId.toString()
    );

    if (room.owner.toString() !== userId.toString() && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to save changes to this room',
      });
    }

    room.code = code;
    if (language && SUPPORTED_LANGUAGES[language]) {
      room.language = language;
    }
    room.lastUpdatedBy = userId;

    await room.save();

    let version = null;
    if (createVersion) {
      version = await RoomVersion.create({
        roomId: room.roomId,
        code: room.code,
        language: room.language,
        title: title || `Manual Save - ${new Date().toLocaleTimeString()}`,
        savedBy: userId,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Code saved successfully to MongoDB',
      lastSaved: room.updatedAt,
      version: version
        ? {
            id: version._id,
            title: version.title,
            createdAt: version.createdAt,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a room (Owner only)
// @route   DELETE /api/rooms/:roomId
// @access  Private
export const deleteRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const room = await Room.findOne({ roomId: roomId.toUpperCase().trim() });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room with ID '${roomId}' was not found`,
      });
    }

    if (room.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the room owner has permission to delete this room',
      });
    }

    // Cascade delete versions & execution history
    await RoomVersion.deleteMany({ roomId: room.roomId });
    await ExecutionHistory.deleteMany({ roomId: room.roomId });
    await Room.deleteOne({ _id: room._id });

    return res.status(200).json({
      success: true,
      message: `Room '${room.roomId}' and its history have been permanently deleted`,
    });
  } catch (error) {
    next(error);
  }
};
