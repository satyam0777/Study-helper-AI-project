import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import {
  getChatHistory,
  bookmarkChat,
  addTagsToChat,
  deleteChat
} from '../controllers/chatController';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Chat management
router.get('/', getChatHistory);
router.put('/:id/bookmark', bookmarkChat);
router.put('/:id/tags', addTagsToChat);
router.delete('/:id', deleteChat);

export default router;