import Room from '../models/Room.js';
import RoomVersion from '../models/RoomVersion.js';
import { activeRooms } from '../sockets/roomHandler.js';

// @desc    Get all saved version snapshots for a room
// @route   GET /api/rooms/:roomId/versions
// @access  Private
export const getRoomVersions = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const versions = await RoomVersion.find({
      roomId: roomId.toUpperCase().trim(),
    })
      .populate('savedBy', 'name email avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: versions.length,
      versions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single version snapshot by ID
// @route   GET /api/rooms/:roomId/versions/:versionId
// @access  Private
export const getVersionById = async (req, res, next) => {
  try {
    const { roomId, versionId } = req.params;

    const version = await RoomVersion.findOne({
      _id: versionId,
      roomId: roomId.toUpperCase().trim(),
    }).populate('savedBy', 'name email avatar');

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Version snapshot not found',
      });
    }

    return res.status(200).json({
      success: true,
      version,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore a previous version snapshot into active room code
// @route   POST /api/rooms/:roomId/versions/:versionId/restore
// @access  Private
export const restoreVersion = async (req, res, next) => {
  try {
    const { roomId, versionId } = req.params;
    const userId = req.user._id;

    const room = await Room.findOne({ roomId: roomId.toUpperCase().trim() });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room '${roomId}' not found`,
      });
    }

    const version = await RoomVersion.findOne({
      _id: versionId,
      roomId: room.roomId,
    });

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Specified version snapshot was not found',
      });
    }

    // Update MongoDB Room
    room.code = version.code;
    room.language = version.language;
    room.lastUpdatedBy = userId;
    await room.save();

    // Create a new snapshot tracking the restoration event
    const restoredSnapshot = await RoomVersion.create({
      roomId: room.roomId,
      code: room.code,
      language: room.language,
      title: `Restored from '${version.title}'`,
      savedBy: userId,
    });

    // Update in-memory active room cache
    const activeCache = activeRooms.get(room.roomId);
    if (activeCache) {
      activeCache.code = room.code;
      activeCache.language = room.language;
    }

    return res.status(200).json({
      success: true,
      message: `Restored code from snapshot '${version.title}'`,
      code: room.code,
      language: room.language,
      version: restoredSnapshot,
    });
  } catch (error) {
    next(error);
  }
};
