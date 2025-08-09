import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/uploadMiddleware';
import { uploadLimiter } from '../middlewares/rateLimiter';
import {
  uploadAndProcessPDF,
  getDocuments,
  getDocumentById,
  deleteDocument
} from '../controllers/pdfController';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// PDF upload and processing
router.post('/upload', uploadLimiter, upload.single('pdf'), uploadAndProcessPDF);

// Document management
router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.delete('/:id', deleteDocument);

export default router;