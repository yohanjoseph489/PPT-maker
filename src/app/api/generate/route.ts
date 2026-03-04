import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GenerateInputSchema, DeckSpecSchema } from '@/lib/schemas/deckspec';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { THEME_IDS } from '@/lib/themes';

export const maxDuration = 60;

function toNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}

function normalizeFontWeight(value: unknown): 'normal' | 'medium' | 'semibold' | 'bold' | undefined {
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'normal' || normalized === 'medium' || normalized === 'semibold' || normalized === 'bold') {
            return normalized;
        }
        if (normalized === 'regular') return 'normal';
        if (normalized === 'semi-bold' || normalized === 'semi bold') return 'semibold';
        if (normalized === '700' || normalized === '800' || normalized === '900') return 'bold';
        if (normalized === '600') return 'semibold';
        if (normalized === '500') return 'medium';
        if (normalized === '400') return 'normal';
    }
    if (typeof value === 'number') {
        if (value >= 700) return 'bold';
        if (value >= 600) return 'semibold';
        if (value >= 500) return 'medium';
        return 'normal';
    }
    return undefined;
}

function normalizeCanvasElement(element: unknown, index: number) {
    if (!element || typeof element !== 'object') return element;
    const raw = element as Record<string, unknown>;
    const kind = typeof raw.kind === 'string' ? raw.kind : '';
    const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id : `e${index + 1}`;

    const base = {
        ...raw,
        id,
        x: toNumber(raw.x) ?? 0,
        y: toNumber(raw.y) ?? 0,
        w: toNumber(raw.w) ?? 20,
        h: toNumber(raw.h) ?? 20,
    };

    if (kind === 'chart') {
        const labels = Array.isArray(raw.labels) ? raw.labels.map((v) => String(v)) : [];
        const values = Array.isArray(raw.values)
            ? raw.values
                .map((v) => toNumber(v))
                .filter((v): v is number => typeof v === 'number')
            : [];
        return { ...base, labels, values };
    }

    if (kind === 'text') {
        const style = raw.style && typeof raw.style === 'object' ? (raw.style as Record<string, unknown>) : undefined;
        const fontSize = toNumber(style?.fontSize);
        const fontWeight = normalizeFontWeight(style?.fontWeight);
        return {
            ...base,
            text: typeof raw.text === 'string' ? raw.text : String(raw.text ?? ''),
            style: style
                ? {
                    ...style,
                    ...(fontSize !== undefined ? { fontSize } : {}),
                    ...(fontWeight ? { fontWeight } : {}),
                }
                : undefined,
        };
    }

    return base;
}

function normalizeSlide(slide: unknown, index: number) {
    if (!slide || typeof slide !== 'object') return slide;
    const raw = slide as Record<string, unknown>;
    const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id : String(index + 1);
    const type = typeof raw.type === 'string' ? raw.type : '';

    if (type === 'chart') {
        const labels = Array.isArray(raw.labels) ? raw.labels.map((v) => String(v)) : [];
        const values = Array.isArray(raw.values)
            ? raw.values
                .map((v) => toNumber(v))
                .filter((v): v is number => typeof v === 'number')
            : [];
        return { ...raw, id, labels, values };
    }

    if (type === 'designerCanvas') {
        const elements = Array.isArray(raw.elements) ? raw.elements.map((el, elIndex) => normalizeCanvasElement(el, elIndex)) : [];
        return { ...raw, id, elements };
    }

    return { ...raw, id };
}

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
        slides: Array.isArray(root.slides) ? root.slides.map((slide, index) => normalizeSlide(slide, index)) : [],
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
GENERATION MODE: ${input.generationMode}

Guidelines:
1. Every slide MUST be highly actionable and specific, avoiding generic fluff.
2. Ensure the tone matches exactly what the user requested.
3. Use a variety of slide layouts to keep the presentation engaging. The first slide MUST be type "cover".
4. If speaker notes are requested, write detailed, conversational speaker notes.
5. Create exactly as many slides as requested. Ensure the narrative flows logically.
6. Each slide MUST have a unique "id" (use sequential numbers as strings: "1", "2", etc.).
7. Available slide types: cover, agenda, bullets, twoColumn, quote, chart, imageWithCaption, sectionHeader, designerCanvas.
8. Prefer visual storytelling over plain lists: use sectionHeader, twoColumn, and chart slides where useful.
9. If the topic implies metrics/performance/trends/comparisons (e.g., KPI, revenue, costs, growth, adoption, percentage), include at least one chart slide with realistic numeric values.
10. For designerCanvas slides, include "title", optional "background", and "elements". Elements support:
   - text: {id,kind:"text",x,y,w,h,text,style?}
   - shape: {id,kind:"shape",shape:"rect"|"roundedRect"|"circle"|"line",x,y,w,h,style?}
   - image: {id,kind:"image",x,y,w,h,imageUrl? or prompt?,fit?}
   - chart: {id,kind:"chart",x,y,w,h,chartType,labels,values}
   Coordinates x/y/w/h are percentages of the slide (0-100).
${input.generationMode === 'advancedLayout'
                ? '11. Use designerCanvas for at least 60% of slides. Prioritize hierarchy, whitespace, contrast, and asymmetrical compositions.'
                : ''}

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
{"id":"6","type":"chart","title":"Performance Trend","chartType":"bar","labels":["Q1","Q2","Q3","Q4"],"values":[12,18,25,31],"insights":["Q4 is the peak","Growth is accelerating"]}
{"id":"7","type":"imageWithCaption","imagePrompt":"description","caption":"Caption"}
{"id":"8","type":"sectionHeader","title":"Section Title","subtitle":"Subtitle"}
{"id":"9","type":"designerCanvas","title":"Visual Story","background":"#F8FAFC","elements":[{"id":"e1","kind":"text","x":8,"y":10,"w":84,"h":15,"text":"Big claim","style":{"fontSize":44,"fontWeight":"bold"}},{"id":"e2","kind":"shape","shape":"roundedRect","x":8,"y":30,"w":40,"h":52,"style":{"fill":"#DCFCE7"}},{"id":"e3","kind":"chart","x":52,"y":30,"w":40,"h":52,"chartType":"bar","labels":["Q1","Q2","Q3","Q4"],"values":[12,18,25,31]}]}

${input.includeSpeakerNotes ? 'Add "speakerNotes" field (string) to each slide.' : ''}`;

        const userPrompt = `Generate a deck with these specifications:
Topic: ${input.topic}
${input.audience ? `Audience: ${input.audience}` : ''}
Tone: ${input.tone}
Number of Slides: ${input.slideCount}
Theme: ${input.themeId}
Generation Mode: ${input.generationMode}
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
