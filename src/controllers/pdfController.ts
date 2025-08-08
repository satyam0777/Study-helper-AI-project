import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import Document from '../models/Document';
import User from '../models/User';
import { parsePDF, cleanupTempFile } from '../utils/parsePDF';
import { summarizeText } from '../utils/summarizeText';

export const uploadAndProcessPDF = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user!._id;

    // Check upload limits for free users
    const user = await User.findById(userId);
    if (user!.subscription.plan === 'free' && user!.subscription.usage.pdfUploads >= 5) {
      cleanupTempFile(req.file.path);
      return res.status(429).json({ 
        error: 'Daily PDF upload limit reached. Upgrade to premium for unlimited uploads.',
        upgradeUrl: '/api/auth/upgrade'
      });
    }

    // Parse PDF
    const pdfResult = await parsePDF(req.file.path);

    // Create document record
    const document = new Document({
      userId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      extractedText: pdfResult.text,
      metadata: {
        pageCount: pdfResult.pages,
        language: 'en' // You can add language detection here
      },
      processingStatus: 'processing'
    });

    await document.save();

    // Generate summary in background
    try {
      const summaryResult = await summarizeText(pdfResult.text, {
        length: 'medium',
        style: 'paragraph'
      });

      document.summary = summaryResult.summary;
      document.keyPoints = summaryResult.keyPoints;
      document.processingStatus = 'completed';
      document.lastProcessed = new Date();
      
      await document.save();

      // Update user usage
      await User.findByIdAndUpdate(userId, {
        $inc: { 'subscription.usage.pdfUploads': 1 }
      });

      // Clean up temporary file
      cleanupTempFile(req.file.path);

      res.json({
        success: true,
        data: {
          documentId: document._id,
          filename: document.originalName,
          pages: pdfResult.pages,
          wordCount: pdfResult.wordCount,
          summary: summaryResult.summary,
          keyPoints: summaryResult.keyPoints,
          extractedText: pdfResult.text.substring(0, 1000) + '...' // First 1000 chars
        }
      });
    } catch (summaryError) {
      console.error('Error generating summary:', summaryError);
      document.processingStatus = 'completed'; // Still mark as completed even without summary
      await document.save();

      res.json({
        success: true,
        data: {
          documentId: document._id,
          filename: document.originalName,
          pages: pdfResult.pages,
          wordCount: pdfResult.wordCount,
          extractedText: pdfResult.text.substring(0, 1000) + '...',
          warning: 'PDF processed but summary generation failed'
        }
      });
    }
  } catch (error) {
    console.error('Error processing PDF:', error);
    
    // Clean up file on error
    if (req.file) {
      cleanupTempFile(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to process PDF' });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { page = 1, limit = 10, search } = req.query;

    const query: any = { userId };
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } }
      ];
    }

    const documents = await Document.find(query)
      .select('-extractedText -path') // Exclude large fields
      .sort({ uploadDate: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Document.countDocuments(query);

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

export const getDocumentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const document = await Document.findOne({ _id: id, userId });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const document = await Document.findOne({ _id: id, userId });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Clean up file
    cleanupTempFile(document.path);

    // Delete from database
    await Document.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};