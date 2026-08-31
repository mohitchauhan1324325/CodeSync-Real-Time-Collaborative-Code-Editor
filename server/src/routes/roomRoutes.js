import express from 'express';
import {
  createRoom,
  getUserRooms,
  getRoomById,
  joinRoom,
  leaveRoom,
  updateRoom,
  saveRoomCode,
  deleteRoom,
} from '../controllers/roomController.js';
import {
  executeCode,
  getExecutionHistory,
} from '../controllers/executionController.js';
import {
  getRoomVersions,
  getVersionById,
  restoreVersion,
} from '../controllers/versionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { executionLimiter } from '../middleware/rateLimiter.js';
import {
  validateCreateRoom,
  validateExecute,
} from '../middleware/validationMiddleware.js';

const router = express.Router();

// Apply auth guard to all room routes
router.use(protect);

router.route('/')
  .post(validateCreateRoom, createRoom)
  .get(getUserRooms);

router.route('/:roomId')
  .get(getRoomById)
  .put(updateRoom)
  .delete(deleteRoom);

router.post('/:roomId/save', saveRoomCode);
router.post('/:roomId/execute', executionLimiter, validateExecute, executeCode);
router.get('/:roomId/executions', getExecutionHistory);

// Version History Endpoints
router.get('/:roomId/versions', getRoomVersions);
router.get('/:roomId/versions/:versionId', getVersionById);
router.post('/:roomId/versions/:versionId/restore', restoreVersion);

router.post('/:roomId/join', joinRoom);
router.post('/:roomId/leave', leaveRoom);

export default router;
