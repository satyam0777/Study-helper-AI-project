import { Router, Request, Response } from 'express';
import { authenticateToken, checkSubscription } from '../middlewares/authMiddleware';
import { aiLimiter } from '../middlewares/rateLimiter';
import {
  askQuestion,
  createQuiz,
  createSummary,
  createImage,
  createFlashcards
} from '../controllers/aiController';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Apply rate limiting to AI routes
router.use(aiLimiter);

// AI Chat endpoints

router.post('/ask', askQuestion);

router.post('/summary', createSummary);
router.post('/quiz', createQuiz);
router.post('/flashcards', createFlashcards);

// Image generation (premium feature for unlimited use)
router.post('/image', createImage);

export default router;