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
            if (slideIndex < 0 || slideIndex >= deckSpec.slides.length) {
                return NextResponse.json(
                    { error: 'Invalid slide index.' },
                    { status: 400 }
                );
            }

            // Regenerate single slide
            const prompt = buildRegenerateSlidePrompt(deckSpec, slideIndex, instruction);
            const rawResponse = await adapter.generate(prompt);

            let parsedSlide: unknown;
            try {
                const jsonStr = extractJSON(rawResponse);
                parsedSlide = JSON.parse(jsonStr);
            } catch {
                return NextResponse.json(
                    { error: 'Failed to parse regenerated slide output.' },
                    { status: 502 }
                );
            }

            const slideResult = SlideSchema.safeParse(parsedSlide);

            if (!slideResult.success) {
                return NextResponse.json(
                    { error: 'Failed to regenerate slide. Please try again.' },
                    { status: 500 }
                );
            }

            const originalSlide = deckSpec.slides[slideIndex];
            if (slideResult.data.type !== originalSlide.type) {
                return NextResponse.json(
                    { error: `Regenerated slide type mismatch. Expected "${originalSlide.type}".` },
                    { status: 422 }
                );
            }

            const newSlides = [...deckSpec.slides];
            newSlides[slideIndex] = { ...slideResult.data, id: originalSlide.id };
            const updatedSpec = { ...deckSpec, slides: newSlides };

            return NextResponse.json({ deckSpec: updatedSpec });
        } else {
            // Regenerate entire deck
            const prompt = buildRegenerateAllPrompt(deckSpec, instruction);
            const rawResponse = await adapter.generate(prompt);

            let parsedDeck: unknown;
            try {
                const jsonStr = extractJSON(rawResponse);
                parsedDeck = JSON.parse(jsonStr);
            } catch {
                return NextResponse.json(
                    { error: 'Failed to parse regenerated deck output.' },
                    { status: 502 }
                );
            }

            const result = DeckSpecSchema.safeParse(parsedDeck);

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
