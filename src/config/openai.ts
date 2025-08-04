

import OpenAI from 'openai';
import {env} from './env'; 

if (!env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not defined in environment variables');
}

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export default openai;

