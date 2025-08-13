import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import {
  createStudySession,
  getStudySessions,
  getStudySessionById,
  updateStudySession,
  addDocumentToSession,
  updateStudyProgress,
  getStudyAnalytics
} from '../controllers/studyController';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Study session management
router.post('/', createStudySession);
router.get('/', getStudySessions);
router.get('/analytics', getStudyAnalytics);
router.get('/:id', getStudySessionById);
router.put('/:id', updateStudySession);
router.put('/:id/progress', updateStudyProgress);

// Document management within sessions
router.put('/:sessionId/documents/:documentId', addDocumentToSession);

export default router;