import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMAdapter } from './adapter';

export class GeminiAdapter implements LLMAdapter {
    private client: GoogleGenerativeAI;
    private model: string;

    constructor(apiKey: string) {
        this.client = new GoogleGenerativeAI(apiKey);
        this.model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    }

    async generate(prompt: string): Promise<string> {
        const model = this.client.getGenerativeModel({ model: this.model });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return text;
    }
}
