import openai from '../config/openai';

export interface SummaryOptions {
  length: 'short' | 'medium' | 'long';
  style: 'bullet-points' | 'paragraph' | 'outline';
  focusAreas?: string[];
}

export const summarizeText = async (
  text: string,
  options: SummaryOptions = { length: 'medium', style: 'paragraph' }
): Promise<{
  summary: string;
  keyPoints: string[];
  wordCount: number;
}> => {
  try {
    const lengthInstructions = {
      short: 'in 2-3 sentences',
      medium: 'in 1-2 paragraphs',
      long: 'in 3-4 detailed paragraphs'
    };

    const styleInstructions = {
      'bullet-points': 'Format as clear bullet points',
      'paragraph': 'Write in coherent paragraphs',
      'outline': 'Create a structured outline format'
    };

    const focusInstruction = options.focusAreas?.length 
      ? `Focus particularly on: ${options.focusAreas.join(', ')}.` 
      : '';

    const prompt = `
Summarize the following text ${lengthInstructions[options.length]}. 
${styleInstructions[options.style]}.
${focusInstruction}

Also extract 5-7 key points as a separate list.

Text to summarize:
${text}

Provide your response in JSON format:
{
  "summary": "Your summary here",
  "keyPoints": ["Point 1", "Point 2", "Point 3", ...],
  "wordCount": number_of_words_in_original_text
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating clear, concise summaries that capture the essential information."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    const response = completion.choices[0].message.content;
    if (!response) throw new Error('No response from OpenAI');

    const result = JSON.parse(response);
    return {
      summary: result.summary,
      keyPoints: result.keyPoints,
      wordCount: text.split(' ').length
    };
  } catch (error) {
    console.error('Error summarizing text:', error);
    throw new Error('Failed to summarize text');
  }
};