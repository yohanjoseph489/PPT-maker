import { NextResponse } from 'next/server';
import { RegenerateInputSchema, DeckSpecSchema, SlideSchema } from '@/lib/schemas/deckspec';
import { createLLMAdapter } from '@/lib/llm/adapter';
import {
    buildRegenerateSlidePrompt,
    buildRegenerateAllPrompt,
    extractJSON,
} from '@/lib/llm/prompts';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(request: Request) {
    try {
        const ip = getClientIP(request);
        const limit = rateLimit(ip);
        if (!limit.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please wait a moment.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const parsed = RegenerateInputSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { deckSpec, slideIndex, instruction } = parsed.data;
        const adapter = createLLMAdapter();

        if (slideIndex !== undefined) {
            // Regenerate single slide
            const prompt = buildRegenerateSlidePrompt(deckSpec, slideIndex, instruction);
            const rawResponse = await adapter.generate(prompt);
            const jsonStr = extractJSON(rawResponse);
            const slideResult = SlideSchema.safeParse(JSON.parse(jsonStr));

            if (!slideResult.success) {
                return NextResponse.json(
                    { error: 'Failed to regenerate slide. Please try again.' },
                    { status: 500 }
                );
            }

            const newSlides = [...deckSpec.slides];
            newSlides[slideIndex] = slideResult.data;
            const updatedSpec = { ...deckSpec, slides: newSlides };

            return NextResponse.json({ deckSpec: updatedSpec });
        } else {
            // Regenerate entire deck
            const prompt = buildRegenerateAllPrompt(deckSpec, instruction);
            const rawResponse = await adapter.generate(prompt);
            const jsonStr = extractJSON(rawResponse);
            const result = DeckSpecSchema.safeParse(JSON.parse(jsonStr));

            if (!result.success) {
                return NextResponse.json(
                    { error: 'Failed to regenerate deck. Please try again.' },
                    { status: 500 }
                );
            }

            return NextResponse.json({ deckSpec: result.data });
        }
    } catch (error) {
        console.error('Regenerate route error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred.' },
            { status: 500 }
        );
    }
}
