import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.VITE_GOOGLE_AI_KEY || '');

export async function summarizeText(text: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5' });
    
    const prompt = `Please provide a clear and concise summary of the following legal section in simple terms that anyone can understand: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to generate summary');
  }
}
