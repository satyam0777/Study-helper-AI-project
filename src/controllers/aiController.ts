import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import openai from '../config/openai';



import Chat from '../models/Chat';
import User from '../models/User';
import { generateQuiz } from '../utils/generateQuiz';
import { summarizeText } from '../utils/summarizeText';
import { generateImage } from '../utils/generateImage';
import { generateFlashcards } from '../utils/flashcards';
import { aiValidation } from '../utils/validation';


export const askQuestion = async (req: AuthRequest, res: Response) => {
    try {
    const { error, value } = aiValidation.askQuestion.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { question, context, sessionId } = value;
    const userId = req.user!._id;

    // Check usage limits for free users
    const user = await User.findById(userId);
    if (user!.subscription.plan === 'free' && user!.subscription.usage.aiQueries >= 50) {
      return res.status(429).json({ 
        error: 'Daily query limit reached. Upgrade to premium for unlimited queries.',
        upgradeUrl: '/api/auth/upgrade'
      });
    }

    const startTime = Date.now();

    // Build conversation context
    let messages: any[] = [
      {
        role: "system",
        content: `You are a helpful AI study assistant. Your personality is ${user!.profile.preferences.aiPersonality}. 
                 Adjust your responses to ${user!.profile.preferences.difficultyLevel} level.
                 Be encouraging and educational in your responses.`
      }
    ];

    if (context) {
      messages.push({
        role: "system",
        content: `Additional context: ${context}`
      });
    }

    messages.push({
      role: "user",
      content: question
    });

    // const completion = await openai.chat.completions.create({
    //   model: "gpt-3.5-turbo",
    //   messages,
    //   temperature: 0.7,
    //   max_tokens: 1000
    // });
    const completion = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages,
  temperature: 0.7,
  max_tokens: 1000
});


    const answer = completion.choices[0].message.content;
    const responseTime = Date.now() - startTime;

    // Save to database
    const chat = new Chat({
      userId,
      sessionId,
      type: 'question',
      input: { text: question },
      output: { text: answer },
      metadata: {
        model: 'gpt-3.5-turbo',
        tokensUsed: completion.usage?.total_tokens,
        responseTime
      }
    });

    await chat.save();

    // Update user usage
    await User.findByIdAndUpdate(userId, {
      $inc: { 'subscription.usage.aiQueries': 1 }
    });

    res.json({
      success: true,
      data: {
        answer,
        chatId: chat._id,
        tokensUsed: completion.usage?.total_tokens,
        responseTime
      }
    });

  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      (error as any).status === 429
    ) {
      console.log('Rate limit exceeded. Check your OpenAI billing.');
      return res.status(429).json({ 
        error: 'API quota exceeded. Please try again later.' 
      });
    }
    // Optionally handle other errors
    console.error('Error in askQuestion:', error);
    return res.status(500).json({ error: 'Failed to process question' });
  }
 
};


export const createQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const { error, value } = aiValidation.generateQuiz.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { content, numberOfQuestions, difficulty, questionType } = value;
    const userId = req.user!._id;

    const questions = await generateQuiz(content, {
      numberOfQuestions,
      difficulty,
      questionType
    });

    // Save to database
    const chat = new Chat({
      userId,
      type: 'quiz',
      input: { text: content },
      output: { quiz: { questions } },
      metadata: {
        model: 'gpt-3.5-turbo'
      }
    });

    await chat.save();

    res.json({
      success: true,
      data: {
        quiz: questions,
        chatId: chat._id,
        totalQuestions: questions.length
      }
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
};

export const createSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { error, value } = aiValidation.summarize.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { text, length, style, focusAreas } = value;
    const userId = req.user!._id;

    const result = await summarizeText(text, { length, style, focusAreas });

    // Save to database
    const chat = new Chat({
      userId,
      type: 'summary',
      input: { text },
      output: { text: result.summary },
      metadata: {
        model: 'gpt-3.5-turbo'
      }
    });

    await chat.save();

    res.json({
      success: true,
      data: {
        summary: result.summary,
        keyPoints: result.keyPoints,
        originalWordCount: result.wordCount,
        chatId: chat._id
      }
    });
  } catch (error) {
    console.error('Error creating summary:', error);
    res.status(500).json({ error: 'Failed to create summary' });
  }
};

export const createImage = async (req: AuthRequest, res: Response) => {
  try {
    const { error, value } = aiValidation.generateImage.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { prompt, style, size, quality } = value;
    const userId = req.user!._id;

    // Check usage limits for free users
    const user = await User.findById(userId);
    if (user!.subscription.plan === 'free' && user!.subscription.usage.imagesGenerated >= 10) {
      return res.status(429).json({ 
        error: 'Daily image generation limit reached. Upgrade to premium for more images.',
        upgradeUrl: '/api/auth/upgrade'
      });
    }

    const result = await generateImage(prompt, { style, size, quality });

    // Save to database
    const chat = new Chat({
      userId,
      type: 'image',
      input: { imagePrompt: prompt },
      output: { imageUrl: result.imageUrl, text: result.revisedPrompt },
      metadata: {
        model: 'dall-e-3'
      }
    });

    await chat.save();

    // Update user usage
    await User.findByIdAndUpdate(userId, {
      $inc: { 'subscription.usage.imagesGenerated': 1 }
    });

    res.json({
      success: true,
      data: {
        imageUrl: result.imageUrl,
        revisedPrompt: result.revisedPrompt,
        chatId: chat._id
      }
    });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
};

export const createFlashcards = async (req: AuthRequest, res: Response) => {
  try {
    const { content, numberOfCards = 10 } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const userId = req.user!._id;
    const flashcards = await generateFlashcards(content, numberOfCards);

    // Save to database
    const chat = new Chat({
      userId,
      type: 'flashcard',
      input: { text: content },
      output: { flashcards },
      metadata: {
        model: 'gpt-3.5-turbo'
      }
    });

    await chat.save();

    res.json({
      success: true,
      data: {
        flashcards,
        chatId: chat._id,
        totalCards: flashcards.length
      }
    });
  } catch (error) {
    console.error('Error creating flashcards:', error);
    res.status(500).json({ error: 'Failed to create flashcards' });
  }
};


  // function OPENAI_API_KEY(question: any) {
  //   throw new Error('Function not implemented.');
  // }