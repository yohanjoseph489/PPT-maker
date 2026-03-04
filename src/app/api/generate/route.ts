import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GenerateInputSchema, DeckSpecSchema } from '@/lib/schemas/deckspec';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { THEME_IDS } from '@/lib/themes';

export const maxDuration = 60;

function normalizeDeckSpec(candidate: unknown) {
    if (!candidate || typeof candidate !== 'object') return candidate;
    const obj = candidate as Record<string, unknown>;
    const nested = obj.deckSpec;
    const root = nested && typeof nested === 'object' ? (nested as Record<string, unknown>) : obj;

    const rawTheme = typeof root.themeId === 'string' ? root.themeId.trim() : '';
    const themeId = THEME_IDS.includes(rawTheme as (typeof THEME_IDS)[number]) ? rawTheme : 'corporate';

    return {
        ...root,
        title: typeof root.title === 'string' ? root.title.trim() : '',
        subtitle: typeof root.subtitle === 'string' ? root.subtitle.trim() : undefined,
        themeId,
        slides: Array.isArray(root.slides) ? root.slides : [],
    };
}

export async function POST(req: Request) {
    try {
        const ip = getClientIP(req);
        const limit = rateLimit(ip);
        if (!limit.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please wait a moment.' },
                { status: 429 }
            );
        }

        const json = await req.json();
        const parsed = GenerateInputSchema.safeParse(json);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const input = parsed.data;
        const geminiKey = process.env.GEMINI_API_KEY;
        const openaiKey = process.env.OPENAI_API_KEY;

        if (!geminiKey && !openaiKey) {
            return NextResponse.json(
                { error: 'Server misconfiguration: No LLM API key found. Set GEMINI_API_KEY or OPENAI_API_KEY in .env.local' },
                { status: 500 }
            );
        }

        const systemPrompt = `You are a world-class presentation designer and strategist.
Your goal is to create a compelling, highly structured presentation deck.

Guidelines:
1. Every slide MUST be highly actionable and specific, avoiding generic fluff.
2. Ensure the tone matches exactly what the user requested.
3. Use a variety of slide layouts to keep the presentation engaging. The first slide MUST be type "cover".
4. If speaker notes are requested, write detailed, conversational speaker notes.
5. Create exactly as many slides as requested. Ensure the narrative flows logically.
6. Each slide MUST have a unique "id" (use sequential numbers as strings: "1", "2", etc.).
7. Available slide types: cover, agenda, bullets, twoColumn, quote, imageWithCaption, sectionHeader.

Return ONLY valid JSON. No markdown, no explanation, no code fences.

The JSON must match this exact structure:
{
  "title": "Deck Title",
  "subtitle": "Optional subtitle",
  "themeId": "${input.themeId}",
  "slides": [...]
}

Slide type examples:
{"id":"1","type":"cover","title":"Title","subtitle":"Subtitle"}
{"id":"2","type":"agenda","title":"Agenda","bullets":["Item 1","Item 2"]}
{"id":"3","type":"bullets","title":"Key Points","bullets":["Point 1","Point 2"]}
{"id":"4","type":"twoColumn","title":"Comparison","left":["Left 1"],"right":["Right 1"]}
{"id":"5","type":"quote","quote":"A great quote","attribution":"Author Name"}
{"id":"6","type":"imageWithCaption","imagePrompt":"description","caption":"Caption"}
{"id":"7","type":"sectionHeader","title":"Section Title","subtitle":"Subtitle"}

${input.includeSpeakerNotes ? 'Add "speakerNotes" field (string) to each slide.' : ''}`;

        const userPrompt = `Generate a deck with these specifications:
Topic: ${input.topic}
${input.audience ? `Audience: ${input.audience}` : ''}
Tone: ${input.tone}
Number of Slides: ${input.slideCount}
Theme: ${input.themeId}
${input.additionalInstructions ? `Additional Instructions: ${input.additionalInstructions}` : ''}

Create exactly ${input.slideCount} slides. Make the content insightful, specific, and presentation-worthy.`;

        let rawResponse = '';

        if (geminiKey) {
            try {
                const genAI = new GoogleGenerativeAI(geminiKey);
                const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        temperature: 0.7,
                        responseMimeType: 'application/json',
                    },
                });
                const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
                rawResponse = result.response.text();
            } catch (err: any) {
                console.error('Gemini SDK error:', err);
                return NextResponse.json(
                    { error: `Gemini API error. Check your API key. Details: ${err.message}` },
                    { status: 502 }
                );
            }
        } else {
            const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';

            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${openaiKey}`,
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt },
                    ],
                    temperature: 0.7,
                    max_tokens: 8000,
                    response_format: { type: 'json_object' },
                }),
            });

            if (!res.ok) {
                const errBody = await res.text();
                console.error('OpenAI API error:', res.status, errBody);
                return NextResponse.json(
                    { error: `OpenAI API error (${res.status}). Check your API key.` },
                    { status: 502 }
                );
            }

            const data = await res.json();
            rawResponse = data.choices?.[0]?.message?.content || '';
        }

        let cleaned = rawResponse.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
            cleaned = cleaned.slice(start, end + 1);
        }

        let parsedDeck: unknown;
        try {
            parsedDeck = JSON.parse(cleaned);
        } catch {
            console.error('Failed to parse LLM JSON:', cleaned.substring(0, 200));
            return NextResponse.json(
                { error: 'The AI returned invalid JSON. Please try again.' },
                { status: 500 }
            );
        }

        const normalized = normalizeDeckSpec(parsedDeck);
        const validated = DeckSpecSchema.safeParse(normalized);
        if (!validated.success) {
            console.warn('DeckSpec validation failed:', validated.error.flatten());
            return NextResponse.json(
                { error: 'The model returned an invalid deck format. Please try again.' },
                { status: 422 }
            );
        }

        return NextResponse.json({ deckSpec: validated.data });
    } catch (error) {
        console.error('Generate route error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        );
    }
}
