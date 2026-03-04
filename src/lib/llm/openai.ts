import OpenAI from 'openai';
import type { LLMAdapter } from './adapter';

export class OpenAIAdapter implements LLMAdapter {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string) {
        this.client = new OpenAI({ apiKey });
        this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    }

    async generate(prompt: string): Promise<string> {
        const completion = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a JSON-only assistant. You MUST output valid JSON matching the schema provided. No markdown, no explanation, only JSON.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 8000,
        });

        return completion.choices[0]?.message?.content || '';
    }
}
