import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import StudySession from '../models/StudySession';
import Chat from '../models/Chat';
import Document from '../models/Document';
import { studyValidation } from '../utils/validation';

export const createStudySession = async (req: AuthRequest, res: Response) => {
  try {
    const { error, value } = studyValidation.createSession.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { title, subject, description, difficulty, studyMode } = value;
    const userId = req.user!._id;

    const session = new StudySession({
      userId,
      title,
      subject,
      description,
      settings: {
        difficulty,
        studyMode
      }
    });

    await session.save();

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error creating study session:', error);
    res.status(500).json({ error: 'Failed to create study session' });
  }
};

export const getStudySessions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { page = 1, limit = 10, subject, isActive } = req.query;

    const query: any = { userId };
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const sessions = await StudySession.find(query)
      .populate('documents', 'originalName uploadDate')
      .sort({ updatedAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await StudySession.countDocuments(query);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching study sessions:', error);
    res.status(500).json({ error: 'Failed to fetch study sessions' });
  }
};

export const getStudySessionById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const session = await StudySession.findOne({ _id: id, userId })
      .populate('documents', 'originalName uploadDate size processingStatus')
      .populate('chats', 'type createdAt isBookmarked');

    if (!session) {
      return res.status(404).json({ error: 'Study session not found' });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error fetching study session:', error);
    res.status(500).json({ error: 'Failed to fetch study session' });
  }
};

export const updateStudySession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    const updates = req.body;

    const session = await StudySession.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Study session not found' });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error updating study session:', error);
    res.status(500).json({ error: 'Failed to update study session' });
  }
};

// export const addDocumentToSession = async (req: AuthRequest, res: Response) => {
//   try {
//     const { sessionId, documentId } = req.params;
//     const userId = req.user!._id;

//     // Verify both session and document belong to user
//     const session = await StudySession.findOne({ _id: sessionId, userId });
//     const document = await Document.findOne({ _id: documentId, userId });

//     if (!session) {
//       return res.status(404).json({ error: 'Study session not found' });
//     }

//     if (!document) {
//       return res.status(404).json({ error: 'Document not found' });
//     }

//     // Add document if not already present
//     if (!session.documents.includes(document._id)) {
//       session.documents.push(document._id);
//       await session.save();
//     }

//     res.json({
//       success: true,
//       data: {
//         sessionId: session._id,
//         documentsCount: session.documents.length
//       }
//     });
//   } catch (error) {
//     console.error('Error adding document to session:', error);
//     res.status(500).json({ error: 'Failed to add document to session' });
//   }
// };
export const addDocumentToSession = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, documentId } = req.params;
    const userId = req.user!._id;

    // Check if session and document exist for this user
    const session = await StudySession.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ error: 'Study session not found' });
    }

    const document = await Document.findOne({ _id: documentId, userId }) as any;
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Ensure ObjectId is treated properly (defensive)
    const documentIdStr = (document._id as any).toString();
    const isAlreadyPresent = session.documents.some(
      (doc: any) => doc.toString() === documentIdStr
    );

    if (!isAlreadyPresent) {
      session.documents.push(document._id as typeof session.documents[0]);
      await session.save();
    }

    res.json({
      success: true,
      data: {
        sessionId: (session._id as string | { toString(): string }).toString(),
        documentsCount: session.documents.length
      }
    });
  } catch (error) {
    console.error('Error adding document to session:', error);
    res.status(500).json({ error: 'Failed to add document to session' });
  }
};

export const updateStudyProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { completedTopics, currentTopic, timeSpent, studyGoals } = req.body;
    const userId = req.user!._id;

    const updateData: any = {};
    if (completedTopics) updateData['progress.completedTopics'] = completedTopics;
    if (currentTopic) updateData['progress.currentTopic'] = currentTopic;
    if (timeSpent) updateData.$inc = { 'progress.timeSpent': timeSpent };
    if (studyGoals) updateData['progress.studyGoals'] = studyGoals;

    const session = await StudySession.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Study session not found' });
    }

    res.json({
      success: true,
      data: {
        progress: session.progress
      }
    });
  } catch (error) {
    console.error('Error updating study progress:', error);
    res.status(500).json({ error: 'Failed to update study progress' });
  }
};

export const getStudyAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { period = '7d' } = req.query;

    let dateFilter: Date;
    switch (period) {
      case '1d':
        dateFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get study sessions analytics
    const sessions = await StudySession.find({ userId, createdAt: { $gte: dateFilter } });
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.isActive).length;
    const totalStudyTime = sessions.reduce((sum, s) => sum + s.progress.timeSpent, 0);

    // Get chat analytics
    const chats = await Chat.find({ userId, createdAt: { $gte: dateFilter } });
    const chatsByType = chats.reduce((acc, chat) => {
      acc[chat.type] = (acc[chat.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get document analytics
    const documents = await Document.find({ userId, uploadDate: { $gte: dateFilter } });

    res.json({
      success: true,
      data: {
        period,
        studyStats: {
          totalSessions,
          activeSessions,
          totalStudyTime, // in minutes
          averageSessionTime: totalSessions > 0 ? Math.round(totalStudyTime / totalSessions) : 0
        },
        activityStats: {
          totalChats: chats.length,
          chatsByType,
          documentsUploaded: documents.length
        },
        subjects: sessions.reduce((acc, session) => {
          acc[session.subject] = (acc[session.subject] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    console.error('Error getting study analytics:', error);
    res.status(500).json({ error: 'Failed to get study analytics' });
  }
};