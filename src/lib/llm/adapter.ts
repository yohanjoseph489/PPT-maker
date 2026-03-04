export interface LLMAdapter {
    generate(prompt: string): Promise<string>;
}

export function createLLMAdapter(): LLMAdapter {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
        // Lazy import to avoid loading unused SDK
        const { GeminiAdapter } = require('./gemini');
        return new GeminiAdapter(geminiKey);
    }

    if (openaiKey) {
        const { OpenAIAdapter } = require('./openai');
        return new OpenAIAdapter(openaiKey);
    }

    throw new Error(
        'No LLM API key configured. Set either GEMINI_API_KEY or OPENAI_API_KEY in .env.local'
    );
}
