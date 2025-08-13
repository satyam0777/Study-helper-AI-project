import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';

// Routes
import aiRoutes from './routes/aiRoutes';
import pdfRoutes from './routes/pdfRoutes';
import authRoutes from './routes/authRoutes';
import chatRoutes from './routes/chatRoutes';
import studyRoutes from './routes/studyRoutes';

// Middlewares
import { errorHandler, notFound } from './middlewares/errorHandler';
import { generalLimiter } from './middlewares/rateLimiter';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use(generalLimiter);

// Static files (for uploaded documents - in production, use cloud storage)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
// app.use('/api/ai', aiRoutes);

console.log('Mounting AI routes...');  // Debug log 1
app.use('/api/ai', aiRoutes);
console.log('Routes mounted successfully!');  // Debug log 2
app.use('/api/pdf', pdfRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/study', studyRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Study Helper AI API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      ai: '/api/ai',
      pdf: '/api/pdf',
      chat: '/api/chat',
      study: '/api/study'
    },
    documentation: 'https://github.com/your-repo/studyhelper-backend'
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;