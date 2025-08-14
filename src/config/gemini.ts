import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export default genAI;


// import { GoogleGenerativeAI } from '@google/generative-ai';
// import { env } from './env';

// const geminiApiKey = process.env.GEMINI_API_KEY;
// if (!geminiApiKey) {
//   throw new Error('GEMINI_API_KEY is not defined in environment variables');
// }
// const genAI = new GoogleGenerativeAI(geminiApiKey);

// export async function askGemini(prompt: string) {
//   const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
//   const result = await model.generateContent(prompt);
//   const response = result.response;
//   return response.text();
// }
