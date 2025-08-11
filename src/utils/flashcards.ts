import openai from '../config/openai';

export interface Flashcard {
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export const generateFlashcards = async (
  content: string,
  numberOfCards: number = 10
): Promise<Flashcard[]> => {
  try {
    const prompt = `
Create ${numberOfCards} flashcards from the following content. 
Each flashcard should have a clear question/term on the front and a comprehensive answer/definition on the back.
Include a mix of difficulty levels and relevant tags.

Content:
${content}

Return as JSON array:
[
  {
    "front": "Question or term",
    "back": "Answer or definition",
    "difficulty": "easy|medium|hard",
    "tags": ["tag1", "tag2"]
  }
]
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating effective flashcards for studying."
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

    return JSON.parse(response);
  } catch (error) {
    console.error('Error generating flashcards:', error);
    throw new Error('Failed to generate flashcards');
  }
};