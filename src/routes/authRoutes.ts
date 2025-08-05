import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import {
  register,
  login,
  getProfile,
  updateProfile,
  getUsageStats
} from '../controllers/authController';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.get('/usage', authenticateToken, getUsageStats);

export default router;