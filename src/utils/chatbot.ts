import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_KEY || '');

export async function getLegalResponse(question: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const prompt = `As an expert in Indian law and the Indian Constitution, please answer the following question. 
    Provide accurate, well-structured information with relevant sections and articles when applicable.
    Keep the response concise but informative.

    Question: ${question}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to get response');
  }
}
