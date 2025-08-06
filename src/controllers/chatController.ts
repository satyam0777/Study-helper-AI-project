import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import Chat from '../models/Chat';

export const getChatHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { 
      page = 1, 
      limit = 20, 
      type, 
      sessionId,
      search,
      startDate,
      endDate 
    } = req.query;

    const query: any = { userId };

    if (type) query.type = type;
    if (sessionId) query.sessionId = sessionId;
    if (search) {
      query.$or = [
        { 'input.text': { $regex: search, $options: 'i' } },
        { 'output.text': { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } }
      ];
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const chats = await Chat.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Chat.countDocuments(query);

    res.json({
      success: true,
      data: {
        chats,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};

export const bookmarkChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const chat = await Chat.findOne({ _id: id, userId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    chat.isBookmarked = !chat.isBookmarked;
    await chat.save();

    res.json({
      success: true,
      data: {
        chatId: chat._id,
        isBookmarked: chat.isBookmarked
      }
    });
  } catch (error) {
    console.error('Error bookmarking chat:', error);
    res.status(500).json({ error: 'Failed to bookmark chat' });
  }
};

export const addTagsToChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;
    const userId = req.user!._id;

    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: 'Tags must be an array' });
    }

    const chat = await Chat.findOne({ _id: id, userId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Add new tags, avoiding duplicates
    const newTags = tags.filter(tag => !chat.tags.includes(tag));
    chat.tags.push(...newTags);
    await chat.save();

    res.json({
      success: true,
      data: {
        chatId: chat._id,
        tags: chat.tags
      }
    });
  } catch (error) {
    console.error('Error adding tags:', error);
    res.status(500).json({ error: 'Failed to add tags' });
  }
};

export const deleteChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const chat = await Chat.findOne({ _id: id, userId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    await Chat.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
};