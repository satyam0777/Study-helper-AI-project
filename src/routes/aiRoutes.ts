import { Router, Request, Response } from 'express';
import { authenticateToken, checkSubscription } from '../middlewares/authMiddleware';
import { aiLimiter } from '../middlewares/rateLimiter';
// import openai from '../config/openai';
import genAI from '../config/gemini';

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

// router.post('/ask', askQuestion);
// router.post('/ask', (req, res) => {
//   console.log('AI /ask endpoint hit');
//   res.json({ test: true });
// });
// router.post('/ask', async (req, res) => {
//   try {
//     const { question } = req.body;

//     // Call your OpenAI API here
//     const completion = await openai.chat.completions.create({
//       model: 'gpt-3.5-turbo',
//       messages: [{ role: 'user', content: question }],
//     });

//     res.json({ answer: completion.choices[0].message.content });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Something went wrong' });
//   }
// });
router.post('/ask', async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(question);

    res.json({ answer: result.response.text() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI request failed" });
  }
});

router.post('/summary', createSummary);
router.post('/quiz', createQuiz);
router.post('/flashcards', createFlashcards);

// // Image generation (premium feature for unlimited use)
router.post('/image', createImage);

export default router;