import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateRegister } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.post('/register', authLimiter, validateRegister, registerUser);
router.post('/login', authLimiter, loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
