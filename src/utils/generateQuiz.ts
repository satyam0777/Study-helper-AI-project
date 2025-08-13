import openai from '../config/openai';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizOptions {
  numberOfQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'multiple-choice' | 'true-false' | 'short-answer' | 'mixed';
  topic?: string;
}

export const generateQuiz = async (
  content: string,
  options: QuizOptions
): Promise<QuizQuestion[]> => {
  try {
    const prompt = `
Create a ${options.difficulty} quiz with ${options.numberOfQuestions} ${options.questionType} questions based on the following content:

${content}

Requirements:
- Generate exactly ${options.numberOfQuestions} questions
- Difficulty level: ${options.difficulty}
- Question type: ${options.questionType}
- Include clear explanations for each answer
- For multiple choice, provide 4 options
- Make questions test understanding, not just memorization

Return the response as a JSON array with this structure:
[
  {
    "question": "Question text here?",
    "options": ["A", "B", "C", "D"] (for multiple choice only),
    "correctAnswer": "Correct answer",
    "explanation": "Why this is correct",
    "difficulty": "${options.difficulty}"
  }
]
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert quiz generator. Create educational quizzes that test comprehension and critical thinking."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const response = completion.choices[0].message.content;
    if (!response) throw new Error('No response from OpenAI');

    const questions = JSON.parse(response);
    return questions;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw new Error('Failed to generate quiz');
  }
};