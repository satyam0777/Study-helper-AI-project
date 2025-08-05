import Joi from 'joi';

export const authValidation = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().min(1).max(50).optional(),
    lastName: Joi.string().min(1).max(50).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
};

export const aiValidation = {
  askQuestion: Joi.object({
    question: Joi.string().min(1).max(1000).required(),
    context: Joi.string().max(5000).optional(),
    sessionId: Joi.string().optional()
  }),

  generateQuiz: Joi.object({
    content: Joi.string().min(10).required(),
    numberOfQuestions: Joi.number().min(1).max(20).default(5),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
    questionType: Joi.string().valid('multiple-choice', 'true-false', 'short-answer', 'mixed').default('multiple-choice')
  }),

  summarize: Joi.object({
    text: Joi.string().min(50).required(),
    length: Joi.string().valid('short', 'medium', 'long').default('medium'),
    style: Joi.string().valid('bullet-points', 'paragraph', 'outline').default('paragraph'),
    focusAreas: Joi.array().items(Joi.string()).optional()
  }),

  generateImage: Joi.object({
    prompt: Joi.string().min(5).max(500).required(),
    style: Joi.string().valid('natural', 'cartoon', 'artistic', 'diagram', 'infographic').default('natural'),
    size: Joi.string().valid('256x256', '512x512', '1024x1024').default('512x512'),
    quality: Joi.string().valid('standard', 'hd').default('standard')
  })
};

export const studyValidation = {
  createSession: Joi.object({
    title: Joi.string().min(1).max(100).required(),
    subject: Joi.string().min(1).max(50).required(),
    description: Joi.string().max(500).optional(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
    studyMode: Joi.string().valid('reading', 'practice', 'review').default('reading')
  })
};