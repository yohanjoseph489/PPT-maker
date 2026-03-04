import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GenerateInputSchema, DeckSpecSchema } from '@/lib/schemas/deckspec';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { THEME_IDS } from '@/lib/themes';
import { buildGenerationPrompt } from '@/lib/llm/prompts';

export const maxDuration = 90;

// ─── Types ────────────────────────────────────────────────────

const VALID_SLIDE_TYPES = new Set([
    'cover', 'agenda', 'bullets', 'twoColumn', 'quote',
    'chart', 'imageWithCaption', 'sectionHeader', 'designerCanvas',
]);

const SLIDE_TYPE_ALIASES: Record<string, string> = {
    cover: 'cover', title: 'cover', titleslide: 'cover', hero: 'cover',
    agenda: 'agenda',
    bullets: 'bullets', list: 'bullets', bullet: 'bullets', bulletpoints: 'bullets',
    twocolumn: 'twoColumn', twocolumns: 'twoColumn', comparison: 'twoColumn', versus: 'twoColumn',
    quote: 'quote', pullquote: 'quote',
    chart: 'chart', graph: 'chart', data: 'chart', metrics: 'chart',
    imagewithcaption: 'imageWithCaption', image: 'imageWithCaption', imagecaption: 'imageWithCaption',
    sectionheader: 'sectionHeader', section: 'sectionHeader', divider: 'sectionHeader', transition: 'sectionHeader',
    designercanvas: 'designerCanvas', canvas: 'designerCanvas', custom: 'designerCanvas', visual: 'designerCanvas',
};

// ─── Helpers ──────────────────────────────────────────────────

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
        const n = value.trim().toLowerCase();
        if (n === 'normal' || n === 'medium' || n === 'semibold' || n === 'bold') return n;
        if (n === 'regular') return 'normal';
        if (n === 'semi-bold' || n === 'semi bold') return 'semibold';
        if (n === '700' || n === '800' || n === '900') return 'bold';
        if (n === '600') return 'semibold';
        if (n === '500') return 'medium';
        if (n === '400') return 'normal';
    }
    if (typeof value === 'number') {
        if (value >= 700) return 'bold';
        if (value >= 600) return 'semibold';
        if (value >= 500) return 'medium';
        return 'normal';
    }
    return undefined;
}

function toStringSafe(value: unknown, fallback = ''): string {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return fallback;
}

function toStringArray(value: unknown, fallback: string[]): string[] {
    if (!Array.isArray(value)) return fallback;
    const arr = value.map((v) => toStringSafe(v)).filter(Boolean);
    return arr.length ? arr : fallback;
}

function toNumberArray(value: unknown, fallback: number[]): number[] {
    if (!Array.isArray(value)) return fallback;
    const arr = value.map((v) => toNumber(v)).filter((v): v is number => typeof v === 'number');
    return arr.length ? arr : fallback;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function clampCoord(value: number): number { return clamp(value, 0, 99); }
function clampDim(value: number): number { return clamp(value, 1, 98); }

function normalizeChartSeries(rawLabels: unknown, rawValues: unknown): { labels: string[]; values: number[] } {
    const labels = toStringArray(rawLabels, ['Category A', 'Category B']).slice(0, 12);
    const values = toNumberArray(rawValues, [10, 20]).slice(0, 12);
    const len = Math.max(2, Math.min(labels.length, values.length));
    const finalLabels = labels.slice(0, len);
    const finalValues = values.slice(0, len);
    while (finalLabels.length < 2) finalLabels.push(`P${finalLabels.length + 1}`);
    while (finalValues.length < 2) finalValues.push(finalValues.length ? finalValues[finalValues.length - 1] : 10);
    return { labels: finalLabels, values: finalValues };
}

function normalizeSlideType(value: unknown): string {
    const raw = toStringSafe(value);
    if (!raw) return 'bullets';
    if (VALID_SLIDE_TYPES.has(raw)) return raw;
    const canonical = raw.replace(/[^a-zA-Z]/g, '').toLowerCase();
    return SLIDE_TYPE_ALIASES[canonical] || 'bullets';
}

// ─── Canvas Element Normalization ─────────────────────────────

function normalizeCanvasElement(element: unknown, index: number) {
    if (!element || typeof element !== 'object') {
        return { id: `e${index + 1}`, kind: 'text', x: 6, y: 20, w: 88, h: 20, text: 'Key message', style: { fontSize: 24 } };
    }

    const raw = element as Record<string, unknown>;
    const kind = toStringSafe(raw.kind);
    const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id : `e${index + 1}`;

    // Clamp all coordinates strictly
    const baseX = clampCoord(toNumber(raw.x) ?? 5);
    const baseY = clampCoord(toNumber(raw.y) ?? 10);
    const rawW = clampDim(toNumber(raw.w) ?? 30);
    const rawH = clampDim(toNumber(raw.h) ?? 20);

    // Ensure element doesn't overflow slide
    const base = {
        id,
        x: baseX,
        y: baseY,
        w: Math.min(rawW, 98 - baseX),
        h: Math.min(rawH, 96 - baseY),
    };

    if (kind === 'chart') {
        const { labels, values } = normalizeChartSeries(raw.labels, raw.values);
        const chartType = toStringSafe(raw.chartType, 'bar');
        return {
            ...base,
            kind: 'chart',
            chartType: ['bar', 'line', 'pie'].includes(chartType) ? chartType : 'bar',
            labels,
            values,
        };
    }

    if (kind === 'text') {
        const style = raw.style && typeof raw.style === 'object' ? (raw.style as Record<string, unknown>) : undefined;
        const rawFontSize = toNumber(style?.fontSize);
        // Cap font sizes to prevent overflow — max 56px in canvas
        const fontSize = rawFontSize !== undefined ? clamp(rawFontSize, 8, 56) : undefined;
        const fontWeight = normalizeFontWeight(style?.fontWeight);
        const align = toStringSafe(style?.align);
        return {
            ...base,
            kind: 'text',
            text: toStringSafe(raw.text, 'Key message'),
            ...(style ? {
                style: {
                    ...(style.color ? { color: toStringSafe(style.color) } : {}),
                    ...(align === 'left' || align === 'center' || align === 'right' ? { align } : {}),
                    ...(style.italic === true ? { italic: true } : {}),
                    ...(fontSize !== undefined ? { fontSize } : {}),
                    ...(fontWeight ? { fontWeight } : {}),
                    ...(style.fontFamily ? { fontFamily: toStringSafe(style.fontFamily) } : {}),
                },
            } : {}),
        };
    }

    if (kind === 'shape') {
        const shape = toStringSafe(raw.shape, 'rect');
        const style = raw.style && typeof raw.style === 'object' ? (raw.style as Record<string, unknown>) : undefined;
        const strokeWidth = toNumber(style?.strokeWidth);
        const opacity = toNumber(style?.opacity);
        return {
            ...base,
            kind: 'shape',
            shape: ['rect', 'roundedRect', 'circle', 'line'].includes(shape) ? shape : 'rect',
            ...(style ? {
                style: {
                    ...(style.fill ? { fill: toStringSafe(style.fill) } : {}),
                    ...(style.stroke ? { stroke: toStringSafe(style.stroke) } : {}),
                    ...(strokeWidth !== undefined ? { strokeWidth: clamp(strokeWidth, 0, 20) } : {}),
                    ...(opacity !== undefined ? { opacity: clamp(opacity, 0, 1) } : {}),
                },
            } : {}),
        };
    }

    if (kind === 'image') {
        return {
            ...base,
            kind: 'image',
            imageUrl: toStringSafe(raw.imageUrl) || undefined,
            prompt: toStringSafe(raw.prompt || raw.imagePrompt) || undefined,
            fit: toStringSafe(raw.fit) === 'contain' ? 'contain' : 'cover',
        };
    }

    // Unknown kind → default to text
    return {
        ...base,
        kind: 'text',
        text: toStringSafe(raw.text || raw.content, 'Key message'),
        style: { fontSize: 16 },
    };
}

// ─── Slide Normalization ──────────────────────────────────────

function normalizeSlide(slide: unknown, index: number) {
    if (!slide || typeof slide !== 'object') {
        return { id: String(index + 1), type: 'bullets', title: 'Key Points', bullets: ['Point 1', 'Point 2', 'Point 3'] };
    }

    const raw = slide as Record<string, unknown>;
    const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id : String(index + 1);
    const type = normalizeSlideType(raw.type);
    const speakerNotes = toStringSafe(raw.speakerNotes) || undefined;

    if (type === 'cover') {
        return { id, type: 'cover', title: toStringSafe(raw.title, 'Untitled Presentation'), subtitle: toStringSafe(raw.subtitle) || undefined, ...(speakerNotes ? { speakerNotes } : {}) };
    }

    if (type === 'agenda' || type === 'bullets') {
        return { id, type, title: toStringSafe(raw.title, type === 'agenda' ? 'Agenda' : 'Key Points'), bullets: toStringArray(raw.bullets, ['Point 1', 'Point 2', 'Point 3']), ...(speakerNotes ? { speakerNotes } : {}) };
    }

    if (type === 'twoColumn') {
        return { id, type: 'twoColumn', title: toStringSafe(raw.title, 'Comparison'), left: toStringArray(raw.left, ['Left point 1', 'Left point 2']), right: toStringArray(raw.right, ['Right point 1', 'Right point 2']), ...(speakerNotes ? { speakerNotes } : {}) };
    }

    if (type === 'quote') {
        return { id, type: 'quote', quote: toStringSafe(raw.quote || raw.title, 'Key insight'), attribution: toStringSafe(raw.attribution) || undefined, ...(speakerNotes ? { speakerNotes } : {}) };
    }

    if (type === 'chart') {
        const { labels, values } = normalizeChartSeries(raw.labels, raw.values);
        const chartType = toStringSafe(raw.chartType, 'bar');
        return { id, type: 'chart', title: toStringSafe(raw.title, 'Performance Trend'), chartType: ['bar', 'line', 'pie'].includes(chartType) ? chartType : 'bar', labels, values, insights: toStringArray(raw.insights, []).slice(0, 4), ...(speakerNotes ? { speakerNotes } : {}) };
    }

    if (type === 'imageWithCaption') {
        return {
            id, type: 'imageWithCaption',
            title: toStringSafe(raw.title) || undefined,
            imagePrompt: toStringSafe(raw.imagePrompt || raw.prompt, 'Professional illustration relevant to the topic'),
            imageUrl: toStringSafe(raw.imageUrl) || undefined,
            caption: toStringSafe(raw.caption, 'Supporting visual'),
            ...(speakerNotes ? { speakerNotes } : {}),
        };
    }

    if (type === 'sectionHeader') {
        return { id, type: 'sectionHeader', title: toStringSafe(raw.title, 'Section'), subtitle: toStringSafe(raw.subtitle) || undefined, ...(speakerNotes ? { speakerNotes } : {}) };
    }

    if (type === 'designerCanvas') {
        const rawElements = Array.isArray(raw.elements) ? raw.elements : [];
        const elements = rawElements
            .slice(0, 10)  // max 10 elements
            .map((el, elIndex) => normalizeCanvasElement(el, elIndex))
            .filter(Boolean);

        const safeElements = elements.length > 0
            ? elements
            : [
                { id: 'e1', kind: 'text', x: 6, y: 25, w: 88, h: 28, text: 'Key message', style: { fontSize: 40, fontWeight: 'bold', align: 'center' } },
                { id: 'e2', kind: 'text', x: 15, y: 58, w: 70, h: 20, text: 'Supporting detail', style: { fontSize: 16, align: 'center' } },
            ];

        return {
            id,
            type: 'designerCanvas',
            title: toStringSafe(raw.title, 'Visual Slide'),
            background: toStringSafe(raw.background) || undefined,
            elements: safeElements,
            ...(speakerNotes ? { speakerNotes } : {}),
        };
    }

    // fallback
    return { id, type: 'bullets', title: toStringSafe(raw.title, 'Key Points'), bullets: toStringArray(raw.bullets, ['Point 1', 'Point 2']), ...(speakerNotes ? { speakerNotes } : {}) };
}

// ─── Deck Normalization ───────────────────────────────────────

function normalizeDeckSpec(candidate: unknown) {
    if (!candidate || typeof candidate !== 'object') return candidate;
    const obj = candidate as Record<string, unknown>;

    // Handle nested wrapper objects
    const nested = (obj.deckSpec && typeof obj.deckSpec === 'object' && obj.deckSpec)
        || (obj.deck && typeof obj.deck === 'object' && obj.deck)
        || (obj.presentation && typeof obj.presentation === 'object' && obj.presentation);
    const root = (nested && typeof nested === 'object') ? (nested as Record<string, unknown>) : obj;

    const rawTheme = typeof root.themeId === 'string' ? root.themeId.trim() : '';
    const themeId = THEME_IDS.includes(rawTheme as (typeof THEME_IDS)[number]) ? rawTheme : 'corporate';

    const rawSlides = Array.isArray(root.slides)
        ? root.slides
        : (root.slides && typeof root.slides === 'object')
            ? Object.values(root.slides as Record<string, unknown>)
            : [];

    const slides = rawSlides.map((slide, index) => normalizeSlide(slide, index)).slice(0, 20);

    const title = typeof root.title === 'string' && root.title.trim() ? root.title.trim() : 'Untitled Presentation';

    return {
        title,
        subtitle: typeof root.subtitle === 'string' ? root.subtitle.trim() : undefined,
        themeId,
        slides: slides.length
            ? slides
            : [{ id: '1', type: 'cover', title }],
    };
}

// ─── API Route ────────────────────────────────────────────────

export async function POST(req: Request) {
    try {
        const ip = getClientIP(req);
        const limit = rateLimit(ip);
        if (!limit.allowed) {
            return NextResponse.json({ error: 'Rate limit exceeded. Please wait a moment.' }, { status: 429 });
        }

        const json = await req.json();
        const parsed = GenerateInputSchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
        }

        const input = parsed.data;
        const geminiKey = process.env.GEMINI_API_KEY;
        const openaiKey = process.env.OPENAI_API_KEY;

        if (!geminiKey && !openaiKey) {
            return NextResponse.json({ error: 'No LLM API key found. Set GEMINI_API_KEY or OPENAI_API_KEY in .env.local' }, { status: 500 });
        }

        const prompt = buildGenerationPrompt(input);
        let rawResponse = '';

        if (geminiKey) {
            try {
                const genAI = new GoogleGenerativeAI(geminiKey);

                // Use gemini-2.5-pro for advanced layout (best quality), flash for standard (faster)
                const modelName = process.env.GEMINI_MODEL
                    || (input.generationMode === 'advancedLayout' ? 'gemini-2.5-pro' : 'gemini-2.0-flash');

                console.log(`[generate] Using model: ${modelName}, mode: ${input.generationMode}`);

                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        temperature: input.generationMode === 'advancedLayout' ? 0.6 : 0.75,
                        // Force JSON output mode — eliminates markdown wrapping entirely
                        responseMimeType: 'application/json',
                        maxOutputTokens: 16000,
                    },
                    systemInstruction: 'You are a professional presentation architect. You output ONLY valid JSON matching the exact schema specified by the user. Never add markdown, comments, or explanations.',
                });

                const result = await model.generateContent(prompt);
                rawResponse = result.response.text();
                console.log(`[generate] Response length: ${rawResponse.length} chars`);
            } catch (err: any) {
                console.error('[generate] Gemini error:', err?.message);

                // If 2.5 pro fails (quota/availability), fall back to flash
                if (err?.message?.includes('not found') || err?.message?.includes('quota') || err?.message?.includes('404')) {
                    try {
                        console.log('[generate] Falling back to gemini-2.0-flash...');
                        const genAI = new GoogleGenerativeAI(geminiKey);
                        const fallbackModel = genAI.getGenerativeModel({
                            model: 'gemini-2.0-flash',
                            generationConfig: {
                                temperature: 0.7,
                                responseMimeType: 'application/json',
                                maxOutputTokens: 12000,
                            },
                        });
                        const fallbackResult = await fallbackModel.generateContent(prompt);
                        rawResponse = fallbackResult.response.text();
                        console.log('[generate] Fallback successful');
                    } catch (fallbackErr: any) {
                        console.error('[generate] Fallback also failed:', fallbackErr?.message);
                        return NextResponse.json({ error: `Gemini API error: ${err.message}` }, { status: 502 });
                    }
                } else {
                    return NextResponse.json({ error: `Gemini API error: ${err.message}` }, { status: 502 });
                }
            }
        } else {
            // OpenAI path
            const modelName = process.env.OPENAI_MODEL || 'gpt-4o';
            try {
                const res = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
                    body: JSON.stringify({
                        model: modelName,
                        messages: [
                            { role: 'system', content: 'You are a professional presentation architect. Output ONLY valid JSON. No markdown, no explanation.' },
                            { role: 'user', content: prompt },
                        ],
                        temperature: 0.7,
                        max_tokens: 10000,
                        response_format: { type: 'json_object' },
                    }),
                });

                if (!res.ok) {
                    const errBody = await res.text();
                    console.error('[generate] OpenAI error:', res.status, errBody);
                    return NextResponse.json({ error: `OpenAI API error (${res.status}). Check your API key.` }, { status: 502 });
                }

                const data = await res.json();
                rawResponse = data.choices?.[0]?.message?.content || '';
            } catch (openaiErr: any) {
                return NextResponse.json({ error: `OpenAI request failed: ${openaiErr.message}` }, { status: 502 });
            }
        }

        // ─── Parse and Normalize ───────────────────────────────
        let cleaned = rawResponse.trim();
        // Strip accidental markdown fences
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
        } catch (parseErr) {
            console.error('[generate] JSON parse failed. First 300 chars:', cleaned.substring(0, 300));
            return NextResponse.json({ error: 'The AI returned invalid JSON. Please try again.' }, { status: 500 });
        }

        const normalized = normalizeDeckSpec(parsedDeck);
        const validated = DeckSpecSchema.safeParse(normalized);

        if (!validated.success) {
            console.warn('[generate] Validation failed:', JSON.stringify(validated.error.flatten(), null, 2));
            // In development show details; in production be vague
            return NextResponse.json(
                process.env.NODE_ENV === 'production'
                    ? { error: 'The model returned an invalid deck. Please try again.' }
                    : { error: 'Validation failed — check server logs.', details: validated.error.flatten() },
                { status: 422 }
            );
        }

        console.log(`[generate] ✅ Success: ${validated.data.slides.length} slides`);
        return NextResponse.json({ deckSpec: validated.data });
    } catch (error: any) {
        console.error('[generate] Unexpected error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
    }
}
