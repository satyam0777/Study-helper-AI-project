import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';

import { askGemini } from '../config/openai';
import Chat from '../models/Chat';
import User from '../models/User';
import { generateQuiz } from '../utils/generateQuiz';
import { summarizeText } from '../utils/summarizeText';
import { generateImage } from '../utils/generateImage';
import { generateFlashcards } from '../utils/flashcards';
import { aiValidation } from '../utils/validation';


// export const askQuestion = async (req: AuthRequest, res: Response) => {
//     try {
//     const { error, value } = aiValidation.askQuestion.validate(req.body);
//     if (error) {
//       return res.status(400).json({ error: error.details[0].message });
//     }

//     const { question, context, sessionId } = value;
//     const userId = req.user!._id;

//     // Check usage limits for free users
//     const user = await User.findById(userId);
//     if (user!.subscription.plan === 'free' && user!.subscription.usage.aiQueries >= 50) {
//       return res.status(429).json({ 
//         error: 'Daily query limit reached. Upgrade to premium for unlimited queries.',
//         upgradeUrl: '/api/auth/upgrade'
//       });
//     }

//     const startTime = Date.now();

//     // Build conversation context
//     let messages: any[] = [
//       {
//         role: "system",
//         content: `You are a helpful AI study assistant. Your personality is ${user!.profile.preferences.aiPersonality}. 
//                  Adjust your responses to ${user!.profile.preferences.difficultyLevel} level.
//                  Be encouraging and educational in your responses.`
//       }
//     ];

//     if (context) {
//       messages.push({
//         role: "system",
//         content: `Additional context: ${context}`
//       });
//     }

//     messages.push({
//       role: "user",
//       content: question
//     });

//     const completion = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages,
//       temperature: 0.7,
//       max_tokens: 1000
//     });

//     const answer = completion.choices[0].message.content;
//     const responseTime = Date.now() - startTime;

//     // Save to database
//     const chat = new Chat({
//       userId,
//       sessionId,
//       type: 'question',
//       input: { text: question },
//       output: { text: answer },
//       metadata: {
//         model: 'gpt-3.5-turbo',
//         tokensUsed: completion.usage?.total_tokens,
//         responseTime
//       }
//     });

//     await chat.save();

//     // Update user usage
//     await User.findByIdAndUpdate(userId, {
//       $inc: { 'subscription.usage.aiQueries': 1 }
//     });

//     res.json({
//       success: true,
//       data: {
//         answer,
//         chatId: chat._id,
//         tokensUsed: completion.usage?.total_tokens,
//         responseTime
//       }
//     });

//   } catch (error) {
//     if (
//       typeof error === 'object' &&
//       error !== null &&
//       'status' in error &&
//       (error as any).status === 429
//     ) {
//       console.log('Rate limit exceeded. Check your OpenAI billing.');
//       return res.status(429).json({ 
//         error: 'API quota exceeded. Please try again later.' 
//       });
//     }
//     // Optionally handle other errors
//     console.error('Error in askQuestion:', error);
//     return res.status(500).json({ error: 'Failed to process question' });
//   }
 
// };

// export const askQuestion = async (req: AuthRequest, res: Response) => {
//     try {
//         // 1. Validate input
//         const { error, value } = aiValidation.askQuestion.validate(req.body);
//         if (error) {
//             return res.status(400).json({ error: error.details[0].message });
//         }

//         const { question, context, sessionId } = value;
//         const userId = req.user!._id;

//         // 2. Check user exists and usage limits
//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ error: 'User not found' });
//         }

//         if (user.subscription.plan === 'free' && user.subscription.usage.aiQueries >= 50) {
//             return res.status(429).json({ 
//                 error: 'Daily query limit reached. Upgrade to premium for unlimited queries.',
//                 upgradeUrl: '/api/auth/upgrade'
//             });
//         }

//         const startTime = Date.now();

//         // 3. Generate mock response instead of calling OpenAI
//         const mockResponses = [
//             "That's an interesting question about: " + question,
//             "I'd be happy to help with: " + question,
//             "Let me think about: " + question,
//             "Here's what I know about: " + question
//         ];
        
//         const answer = mockResponses[Math.floor(Math.random() * mockResponses.length)];
//         const responseTime = Date.now() - startTime;

//         // 4. Save to database (maintaining all functionality)
//         const chat = new Chat({
//             userId,
//             sessionId,
//             type: 'question',
//             input: { text: question },
//             output: { text: answer },
//             metadata: {
//                 model: 'mock-service',
//                 tokensUsed: question.length + answer.length, // Mock token count
//                 responseTime
//             }
//         });

//         await chat.save();

//         // 5. Update user usage
//         await User.findByIdAndUpdate(userId, {
//             $inc: { 'subscription.usage.aiQueries': 1 }
//         });

//         // 6. Return success response
//         return res.json({
//             success: true,
//             data: {
//                 answer,
//                 chatId: chat._id,
//                 tokensUsed: question.length + answer.length,
//                 responseTime,
//                 mock: true // Indicates this is a mock response
//             }
//         });

//     } catch (error) {
//         console.error('Error in askQuestion:', error);
//         return res.status(500).json({ 
//             error: 'Failed to process question',
//             details: process.env.NODE_ENV === 'development' && error && typeof error === 'object' && 'message' in error
//                 ? (error as { message: string }).message
//                 : undefined
//         });
//     }
// };
// export const askQuestion = async (req: AuthRequest, res: Response) => {
//   try {
//     // Validate input
//     const { error, value } = aiValidation.askQuestion.validate(req.body);
//     if (error) {
//       return res.status(400).json({ error: error.details[0].message });
//     }

//     const { question, context, sessionId } = value;
//     const userId = req.user!._id;

//     // Fetch user from database
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     const completion = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages: [
//         {
//           role: "system",
//           content: `You are a ${user.profile.preferences.aiPersonality} tutor. 
//                    Teach at ${user.profile.preferences.difficultyLevel} level.`
//         },
//         { role: "user", content: question }
//       ],
//       temperature: 0.7,
//       max_tokens: 1000
//     });

//     const answer = completion.choices[0].message.content;
    
//     // Rest of your database and response logic
//     res.json({
//       success: true,
//       data: {
//         answer,
//         tokensUsed: completion.usage?.total_tokens
//       }
//     });

//   } catch (error) {
//     console.error('OpenAI Error:', error);
//     res.status(500).json({ 
//       error: 'AI service error',
//       details: error instanceof Error ? error.message : String(error)
//     });
//   }
// };


// export const askQuestion = async (req: AuthRequest, res: Response) => {
//   try {
//     const { error, value } = aiValidation.askQuestion.validate(req.body);
//     if (error) {
//       return res.status(400).json({ error: error.details[0].message });
//     }

//     const { question, context, sessionId } = value;
//     const userId = req.user!._id;

//     // Check usage limits for free users
//     const user = await User.findById(userId);
//     if (user!.subscription.plan === 'free' && user!.subscription.usage.aiQueries >= 50) {
//       return res.status(429).json({ 
//         error: 'Daily query limit reached. Upgrade to premium for unlimited queries.',
//         upgradeUrl: '/api/auth/upgrade'
//       });
//     }

//     const startTime = Date.now();
//     let answer: string;
//     let tokensUsed = 0;

//     // Use mock response if OpenAI is not available
//     if (shouldUseMock()) {
//       console.log('Using mock AI response for development');
//       const mockResponse = mockAIResponses.askQuestion(question);
//       answer = mockResponse.answer;
//       tokensUsed = 50; // Mock token count
//     } else {
//       try {
//         // Build conversation context
//         let messages: any[] = [
//           {
//             role: "system",
//             content: `You are a helpful AI study assistant. Your personality is ${user!.profile.preferences.aiPersonality}. 
//                      Adjust your responses to ${user!.profile.preferences.difficultyLevel} level.
//                      Be encouraging and educational in your responses.`
//           }
//         ];

//         if (context) {
//           messages.push({
//             role: "system",
//             content: `Additional context: ${context}`
//           });
//         }

//         messages.push({
//           role: "user",
//           content: question
//         });

//         const completion = await openai.chat.completions.create({
//           model: "gpt-3.5-turbo",
//           messages,
//           temperature: 0.7,
//           max_tokens: 1000
//         });

//         answer = completion.choices[0].message.content || 'No response generated';
//         tokensUsed = completion.usage?.total_tokens || 0;
//       } catch (openaiError: any) {
//         console.error('OpenAI API Error:', openaiError.message);
        
//         // If OpenAI fails, fall back to mock response
//         console.log('Falling back to mock response due to OpenAI error');
//         const mockResponse = mockAIResponses.askQuestion(question);
//         answer = `[Development Mode] ${mockResponse.answer}`;
//         tokensUsed = 50;
//       }
//     }

//     const responseTime = Date.now() - startTime;

//     // Save to database
//     const chat = new Chat({
//       userId,
//       sessionId,
//       type: 'question',
//       input: { text: question },
//       output: { text: answer },
//       metadata: {
//         model: shouldUseMock() ? 'mock-gpt' : 'gpt-3.5-turbo',
//         tokensUsed,
//         responseTime
//       }
//     });

//     await chat.save();

//     // Update user usage
//     await User.findByIdAndUpdate(userId, {
//       $inc: { 'subscription.usage.aiQueries': 1 }
//     });

//     res.json({
//       success: true,
//       data: {
//         answer,
//         chatId: chat._id,
//         tokensUsed,
//         responseTime,
//         usingMock: shouldUseMock()
//       }
//     });
//   } catch (error) {
//     console.error('Error in askQuestion:', error);
//     res.status(500).json({ error: 'Failed to process question' });
//   }
// };

// In your aiController.ts
const isDevelopment = process.env.NODE_ENV === 'development';

export const askQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { question, subject, context } = req.body;
    
    if (!question) {
      return res.status(400).json({ 
        error: 'Question is required', 
        success: false 
      });
    }

    if (isDevelopment && process.env.MOCK_AI === 'true') {
      return res.json({
        answer: `Mock answer for: "${question}" in ${subject || 'general'} subject.`,
        success: true
      });
    }
    
    // Build the system message based on subject
    let systemMessage = "You are a helpful study assistant. Provide clear, educational answers.";
    
    if (subject) {
      systemMessage += ` Focus on ${subject} topics.`;
    }
    
    if (context) {
      systemMessage += ` Context: ${context}`;
    }

    const answer = await askGemini(question);

    res.json({ 
      answer, 
      success: true
    });
    
  } catch (error) {
    console.error('Error in askQuestion:', error);
    
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      (error as any).status === 429
    ) {
      console.log('Rate limit exceeded. Check your OpenAI billing.');
      return res.status(429).json({ 
        error: 'API quota exceeded. Please try again later.',
        success: false 
      });
    }
    
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      (error as any).status === 401
    ) {
      return res.status(401).json({
        error: 'Invalid API key',
        success: false
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error', 
      success: false 
    });
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

// function shouldUseMock() {
//   // Use mock if NODE_ENV is 'development' or if OPENAI_API_KEY is missing
//   return (
//     process.env.NODE_ENV === 'development' ||
//     !process.env.OPENAI_API_KEY
//   );
// }

// function shouldUseMock() {
//   throw new Error('Function not implemented.');
// }
