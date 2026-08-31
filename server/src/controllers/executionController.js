import Room from '../models/Room.js';
import ExecutionHistory from '../models/ExecutionHistory.js';
import { ExecutionService } from '../services/executionService.js';

// @desc    Execute code in a sandboxed runtime
// @route   POST /api/rooms/:roomId/execute
// @access  Private
export const executeCode = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { code, language, stdin = '' } = req.body;
    const userId = req.user._id;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide code to execute',
      });
    }

    const room = await Room.findOne({ roomId: roomId.toUpperCase().trim() });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room with ID '${roomId}' was not found`,
      });
    }

    const selectedLanguage = language || room.language;

    const result = await ExecutionService.executeCode({
      roomId: room.roomId,
      userId,
      language: selectedLanguage,
      code,
      stdin,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get execution history for a room
// @route   GET /api/rooms/:roomId/executions
// @access  Private
export const getExecutionHistory = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const executions = await ExecutionHistory.find({
      roomId: roomId.toUpperCase().trim(),
    })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(30);

    return res.status(200).json({
      success: true,
      count: executions.length,
      executions,
    });
  } catch (error) {
    next(error);
  }
};
