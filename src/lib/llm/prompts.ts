import type { GenerateInput, DeckSpec, SlideType } from '@/lib/schemas/deckspec';
import { themes, type ThemeId } from '@/lib/themes';

// ─── Layout Templates for designerCanvas ─────────────────────
// These are pixel-perfect layout templates with validated coordinates.
// The LLM MUST pick from this library and only fill in content.

export const CANVAS_LAYOUT_TEMPLATES = {
    // 1. Hero statement: big headline, subtext, decorative accent
    heroStatement: {
        name: 'heroStatement',
        description: 'Full-bleed hero: giant headline on left, accent shape right',
        elements: [
            { id: 'bg-accent', kind: 'shape', shape: 'roundedRect', x: 62, y: 0, w: 38, h: 100, style: { fill: '{{primary}}18', stroke: 'none', strokeWidth: 0 } },
            { id: 'eyebrow', kind: 'text', x: 6, y: 12, w: 55, h: 8, text: '{{eyebrow}}', style: { fontSize: 13, fontWeight: 'semibold', color: '{{primary}}', align: 'left' } },
            { id: 'headline', kind: 'text', x: 6, y: 22, w: 55, h: 38, text: '{{headline}}', style: { fontSize: 42, fontWeight: 'bold', align: 'left' } },
            { id: 'body', kind: 'text', x: 6, y: 63, w: 52, h: 22, text: '{{body}}', style: { fontSize: 16, fontWeight: 'normal', align: 'left' } },
        ],
    },

    // 2. Split layout: text left, chart right
    textAndChart: {
        name: 'textAndChart',
        description: 'Two-pane: insights on left, chart visualization on right',
        elements: [
            { id: 'title', kind: 'text', x: 5, y: 8, w: 90, h: 12, text: '{{title}}', style: { fontSize: 26, fontWeight: 'bold', align: 'left' } },
            { id: 'insight1', kind: 'text', x: 5, y: 24, w: 40, h: 8, text: '{{insight1}}', style: { fontSize: 14, fontWeight: 'semibold', align: 'left' } },
            { id: 'insight2', kind: 'text', x: 5, y: 34, w: 40, h: 8, text: '{{insight2}}', style: { fontSize: 14, fontWeight: 'normal', align: 'left' } },
            { id: 'insight3', kind: 'text', x: 5, y: 44, w: 40, h: 8, text: '{{insight3}}', style: { fontSize: 14, fontWeight: 'normal', align: 'left' } },
            { id: 'chart', kind: 'chart', x: 50, y: 20, w: 46, h: 68, chartType: 'bar', labels: ['{{l1}}', '{{l2}}', '{{l3}}', '{{l4}}'], values: [0, 0, 0, 0] },
        ],
    },

    // 3. Stat showcase: 3 KPI cards side by side
    threeKpis: {
        name: 'threeKpis',
        description: 'Three equal KPI metric cards across the width',
        elements: [
            { id: 'title', kind: 'text', x: 5, y: 6, w: 90, h: 12, text: '{{title}}', style: { fontSize: 26, fontWeight: 'bold', align: 'left' } },
            { id: 'card1', kind: 'shape', shape: 'roundedRect', x: 5, y: 24, w: 27, h: 58, style: { fill: '{{primary}}12', stroke: '{{primary}}30', strokeWidth: 1 } },
            { id: 'kpi1-val', kind: 'text', x: 7, y: 32, w: 23, h: 20, text: '{{kpi1_value}}', style: { fontSize: 36, fontWeight: 'bold', align: 'center', color: '{{primary}}' } },
            { id: 'kpi1-lbl', kind: 'text', x: 7, y: 52, w: 23, h: 12, text: '{{kpi1_label}}', style: { fontSize: 13, fontWeight: 'normal', align: 'center' } },
            { id: 'card2', kind: 'shape', shape: 'roundedRect', x: 37, y: 24, w: 27, h: 58, style: { fill: '{{primary}}12', stroke: '{{primary}}30', strokeWidth: 1 } },
            { id: 'kpi2-val', kind: 'text', x: 39, y: 32, w: 23, h: 20, text: '{{kpi2_value}}', style: { fontSize: 36, fontWeight: 'bold', align: 'center', color: '{{primary}}' } },
            { id: 'kpi2-lbl', kind: 'text', x: 39, y: 52, w: 23, h: 12, text: '{{kpi2_label}}', style: { fontSize: 13, fontWeight: 'normal', align: 'center' } },
            { id: 'card3', kind: 'shape', shape: 'roundedRect', x: 69, y: 24, w: 27, h: 58, style: { fill: '{{primary}}12', stroke: '{{primary}}30', strokeWidth: 1 } },
            { id: 'kpi3-val', kind: 'text', x: 71, y: 32, w: 23, h: 20, text: '{{kpi3_value}}', style: { fontSize: 36, fontWeight: 'bold', align: 'center', color: '{{primary}}' } },
            { id: 'kpi3-lbl', kind: 'text', x: 71, y: 52, w: 23, h: 12, text: '{{kpi3_label}}', style: { fontSize: 13, fontWeight: 'normal', align: 'center' } },
        ],
    },

    // 4. Callout quote + supporting data
    quoteWithSupport: {
        name: 'quoteWithSupport',
        description: 'Large pull quote left, supporting stat card right',
        elements: [
            { id: 'quote-mark', kind: 'text', x: 5, y: 10, w: 15, h: 18, text: '"', style: { fontSize: 80, fontWeight: 'bold', color: '{{primary}}', align: 'left' } },
            { id: 'quote', kind: 'text', x: 5, y: 24, w: 52, h: 40, text: '{{quote_text}}', style: { fontSize: 20, fontWeight: 'semibold', align: 'left' } },
            { id: 'attrib', kind: 'text', x: 5, y: 68, w: 52, h: 10, text: '— {{attribution}}', style: { fontSize: 13, fontWeight: 'normal', align: 'left' } },
            { id: 'support-card', kind: 'shape', shape: 'roundedRect', x: 63, y: 18, w: 32, h: 62, style: { fill: '{{primary}}', stroke: 'none', strokeWidth: 0 } },
            { id: 'support-val', kind: 'text', x: 65, y: 30, w: 28, h: 22, text: '{{stat_value}}', style: { fontSize: 40, fontWeight: 'bold', align: 'center', color: '#ffffff' } },
            { id: 'support-lbl', kind: 'text', x: 65, y: 54, w: 28, h: 18, text: '{{stat_label}}', style: { fontSize: 13, fontWeight: 'normal', align: 'center', color: '#ffffff' } },
        ],
    },

    // 5. Timeline / process steps (3 steps horizontal)
    threeSteps: {
        name: 'threeSteps',
        description: 'Horizontal three-step process with connectors',
        elements: [
            { id: 'title', kind: 'text', x: 5, y: 6, w: 90, h: 12, text: '{{title}}', style: { fontSize: 26, fontWeight: 'bold', align: 'left' } },
            { id: 'connector', kind: 'shape', shape: 'line', x: 18, y: 52, w: 64, h: 1, style: { stroke: '{{primary}}40', strokeWidth: 2 } },
            { id: 'step1-dot', kind: 'shape', shape: 'circle', x: 10, y: 46, w: 8, h: 8, style: { fill: '{{primary}}', stroke: 'none', strokeWidth: 0 } },
            { id: 'step1-num', kind: 'text', x: 10, y: 48, w: 8, h: 6, text: '01', style: { fontSize: 11, fontWeight: 'bold', color: '#ffffff', align: 'center' } },
            { id: 'step1-title', kind: 'text', x: 5, y: 58, w: 22, h: 10, text: '{{step1_title}}', style: { fontSize: 14, fontWeight: 'semibold', align: 'center' } },
            { id: 'step1-body', kind: 'text', x: 5, y: 70, w: 22, h: 16, text: '{{step1_body}}', style: { fontSize: 12, fontWeight: 'normal', align: 'center' } },
            { id: 'step2-dot', kind: 'shape', shape: 'circle', x: 46, y: 46, w: 8, h: 8, style: { fill: '{{primary}}', stroke: 'none', strokeWidth: 0 } },
            { id: 'step2-num', kind: 'text', x: 46, y: 48, w: 8, h: 6, text: '02', style: { fontSize: 11, fontWeight: 'bold', color: '#ffffff', align: 'center' } },
            { id: 'step2-title', kind: 'text', x: 39, y: 58, w: 22, h: 10, text: '{{step2_title}}', style: { fontSize: 14, fontWeight: 'semibold', align: 'center' } },
            { id: 'step2-body', kind: 'text', x: 39, y: 70, w: 22, h: 16, text: '{{step2_body}}', style: { fontSize: 12, fontWeight: 'normal', align: 'center' } },
            { id: 'step3-dot', kind: 'shape', shape: 'circle', x: 78, y: 46, w: 8, h: 8, style: { fill: '{{primary}}', stroke: 'none', strokeWidth: 0 } },
            { id: 'step3-num', kind: 'text', x: 78, y: 48, w: 8, h: 6, text: '03', style: { fontSize: 11, fontWeight: 'bold', color: '#ffffff', align: 'center' } },
            { id: 'step3-title', kind: 'text', x: 73, y: 58, w: 22, h: 10, text: '{{step3_title}}', style: { fontSize: 14, fontWeight: 'semibold', align: 'center' } },
            { id: 'step3-body', kind: 'text', x: 73, y: 70, w: 22, h: 16, text: '{{step3_body}}', style: { fontSize: 12, fontWeight: 'normal', align: 'center' } },
        ],
    },

    // 6. Full-width feature highlight (image left, bullets right)
    featureHighlight: {
        name: 'featureHighlight',
        description: 'Feature with image placeholder left, bulleted benefits right',
        elements: [
            { id: 'image-panel', kind: 'shape', shape: 'roundedRect', x: 4, y: 8, w: 42, h: 82, style: { fill: '{{primary}}15', stroke: '{{primary}}20', strokeWidth: 1 } },
            { id: 'img-label', kind: 'text', x: 4, y: 44, w: 42, h: 10, text: '{{image_description}}', style: { fontSize: 13, fontWeight: 'normal', align: 'center' } },
            { id: 'title', kind: 'text', x: 52, y: 8, w: 44, h: 14, text: '{{title}}', style: { fontSize: 24, fontWeight: 'bold', align: 'left' } },
            { id: 'b1', kind: 'text', x: 52, y: 26, w: 44, h: 10, text: '• {{bullet1}}', style: { fontSize: 14, fontWeight: 'normal', align: 'left' } },
            { id: 'b2', kind: 'text', x: 52, y: 38, w: 44, h: 10, text: '• {{bullet2}}', style: { fontSize: 14, fontWeight: 'normal', align: 'left' } },
            { id: 'b3', kind: 'text', x: 52, y: 50, w: 44, h: 10, text: '• {{bullet3}}', style: { fontSize: 14, fontWeight: 'normal', align: 'left' } },
            { id: 'b4', kind: 'text', x: 52, y: 62, w: 44, h: 10, text: '• {{bullet4}}', style: { fontSize: 14, fontWeight: 'normal', align: 'left' } },
        ],
    },
} as const;

// ─── Slide examples using templates ───────────────────────────

const SLIDE_STRUCTURE_GUIDE = `
SLIDE TYPE REFERENCE (use exact field names):

1. cover → {"id","type":"cover","title":"...","subtitle":"..."}
2. agenda → {"id","type":"agenda","title":"...","bullets":["item1","item2","item3","item4"]}
3. bullets → {"id","type":"bullets","title":"...","bullets":["point 1","point 2","point 3"]}
4. twoColumn → {"id","type":"twoColumn","title":"...","left":["point A","point B"],"right":["point C","point D"]}
5. quote → {"id","type":"quote","quote":"Actual quote text","attribution":"Name, Title"}
6. chart → {"id","type":"chart","title":"...","chartType":"bar"|"line"|"pie","labels":["Q1","Q2","Q3","Q4"],"values":[10,20,30,40],"insights":["Key insight 1","Key insight 2"]}
7. sectionHeader → {"id","type":"sectionHeader","title":"...","subtitle":"..."}
8. imageWithCaption → {"id","type":"imageWithCaption","title":"...","imagePrompt":"detailed description of image to generate","caption":"..."}
9. designerCanvas → SEE CANVAS RULES BELOW
`;

const CANVAS_RULES = `
DESIGNER CANVAS RULES — READ CAREFULLY:
- All x, y, w, h values are PERCENTAGES of slide dimensions (0-100)
- Slide is 16:9 ratio (1280px wide × 720px tall in your mental model)
- DO NOT overlap text elements. Maintain 2% minimum gap between elements
- Total elements per canvas slide: 3-8 elements maximum
- Font sizes: headlines 28-48px, subheadings 16-24px, body 12-16px, captions 10-13px
- NEVER place text outside the bounds: x+w ≤ 98, y+h ≤ 96
- Background shapes should be decorative only (low opacity fills)
- Charts need at least 2 labels and 2 values

VALID CANVAS ELEMENT TYPES:
- text: {id, kind:"text", x, y, w, h, text:"...", style:{fontSize, fontWeight:"normal"|"medium"|"semibold"|"bold", color, align:"left"|"center"|"right"}}
- shape: {id, kind:"shape", shape:"rect"|"roundedRect"|"circle"|"line", x, y, w, h, style:{fill, stroke, strokeWidth, opacity}}
- chart: {id, kind:"chart", x, y, w, h, chartType:"bar"|"line"|"pie", labels:[...], values:[...]}
- image: {id, kind:"image", x, y, w, h, prompt:"detailed image description", fit:"cover"|"contain"}

PROVEN SAFE LAYOUTS — Use these coordinate patterns. DO NOT invent new extreme positions:

Layout A — "Big Headline + Body" (2 elements):
  headline: x:6, y:25, w:88, h:28 (fontSize:44, bold, center)
  body: x:15, y:56, w:70, h:24 (fontSize:16, normal, center)

Layout B — "Title + Left Body + Right Chart" (3 elements):
  title: x:5, y:6, w:90, h:13 (fontSize:26, bold, left)
  body: x:5, y:23, w:40, h:62 (fontSize:15, normal, left)
  chart: x:50, y:20, w:46, h:68 (any chartType)

Layout C — "3 KPI Cards" (7 elements):
  title: x:5, y:6, w:90, h:12 (fontSize:26, bold, left)
  card1-bg: x:4, y:23, w:28, h:58 (roundedRect shape)
  card1-val: x:6, y:32, w:24, h:22 (fontSize:38, bold, center, use primary color)
  card1-lbl: x:6, y:56, w:24, h:12 (fontSize:13, normal, center)
  card2-bg: x:36, y:23, w:28, h:58 (roundedRect shape)
  card2-val: x:38, y:32, w:24, h:22 (fontSize:38, bold, center, use primary color)
  card2-lbl: x:38, y:56, w:24, h:12 (fontSize:13, normal, center)
  card3-bg: x:68, y:23, w:28, h:58 (roundedRect shape)
  card3-val: x:70, y:32, w:24, h:22 (fontSize:38, bold, center, use primary color)
  card3-lbl: x:70, y:56, w:24, h:12 (fontSize:13, normal, center)

Layout D — "Quote + Stat Card" (5 elements):
  quote-mark: x:5, y:10, w:12, h:18 (single char """, fontSize:80, bold, primary color)
  quote: x:5, y:26, w:52, h:38 (fontSize:20, semibold, left)
  attribution: x:5, y:68, w:52, h:10 (fontSize:13, normal, left)
  stat-bg: x:63, y:18, w:32, h:62 (roundedRect, fill with primary color)
  stat-val: x:65, y:30, w:28, h:22 (fontSize:40, bold, center, white color)

Layout E — "Left Image Panel + Right Bullets" (6 elements):
  img-panel: x:4, y:8, w:42, h:82 (roundedRect shape, low opacity fill)
  img-label: x:4, y:44, w:42, h:10 (fontSize:13, normal, center)
  title: x:52, y:8, w:44, h:14 (fontSize:24, bold, left)
  bullet1: x:52, y:26, w:44, h:10 (fontSize:14, normal, left — prefix with "• ")
  bullet2: x:52, y:38, w:44, h:10 (fontSize:14, normal, left — prefix with "• ")
  bullet3: x:52, y:50, w:44, h:10 (fontSize:14, normal, left — prefix with "• ")
`;

export function buildGenerationPrompt(input: GenerateInput): string {
    const theme = themes[input.themeId as ThemeId];

    return `You are an expert presentation architect. Your task is to create a STRUCTURED, VISUALLY POLISHED deck as strict JSON.

TOPIC: ${input.topic}
${input.audience ? `AUDIENCE: ${input.audience}` : ''}
TONE: ${input.tone}
SLIDES: ${input.slideCount} (exactly this many, no more, no less)
THEME: ${theme.name} — ${theme.description}
MODE: ${input.generationMode}
${input.includeSpeakerNotes ? 'SPEAKER NOTES: Include "speakerNotes" (string) on each slide.' : ''}
${input.additionalInstructions ? `EXTRA INSTRUCTIONS: ${input.additionalInstructions}` : ''}

OUTPUT: Return ONLY valid JSON. No markdown. No code fences. No explanation.

JSON STRUCTURE:
{
  "title": "Deck Title",
  "subtitle": "Optional subtitle",
  "themeId": "${input.themeId}",
  "slides": [...]
}

${SLIDE_STRUCTURE_GUIDE}

${input.generationMode === 'advancedLayout' ? CANVAS_RULES : ''}

CONTENT RULES:
1. First slide MUST be "cover" type.
2. Use a variety of slide types — avoid more than 3 consecutive "bullets" slides.
3. If the topic involves numbers, KPIs, growth, costs, revenue, or metrics → include at least 1 "chart" slide with realistic numbers.
${input.generationMode === 'advancedLayout'
            ? '4. Use "designerCanvas" for 40-60% of slides. Use ONLY the proven layouts (A,B,C,D,E) above. Do NOT improvise coordinates.'
            : '4. Prefer "bullets", "twoColumn", "chart", "sectionHeader" slide types for clean structure.'}
5. Write SPECIFIC, INSIGHTFUL content — avoid generic filler text.
6. Each slide id must be a sequential string: "1", "2", "3"...

CRITICAL: Generate exactly ${input.slideCount} slides. Return complete valid JSON only.`;
}

export function buildRegenerateSlidePrompt(
    deckSpec: DeckSpec,
    slideIndex: number,
    instruction?: string
): string {
    const slide = deckSpec.slides[slideIndex];
    const theme = themes[deckSpec.themeId];

    const canvasSection = slide.type === 'designerCanvas' ? `\n${CANVAS_RULES}` : '';

    return `You are an expert presentation designer. Regenerate ONLY this single slide for a deck about "${deckSpec.title}".

CURRENT SLIDE (index ${slideIndex}):
${JSON.stringify(slide, null, 2)}

THEME: ${theme.name}
${instruction ? `USER INSTRUCTION: ${instruction}` : 'Make it more visually striking, specific, and impactful.'}
${canvasSection}

OUTPUT: Return ONLY a valid JSON object for this single slide.
- Keep the same "id" ("${slide.id}") and "type" ("${slide.type}")
- No markdown, no explanation, only the JSON slide object`;
}

export function buildRegenerateAllPrompt(
    deckSpec: DeckSpec,
    instruction?: string
): string {
    return buildGenerationPrompt({
        topic: deckSpec.title,
        tone: 'professional',
        slideCount: deckSpec.slides.length,
        themeId: deckSpec.themeId,
        includeSpeakerNotes: deckSpec.slides.some((s) => s.speakerNotes),
        generationMode: deckSpec.slides.some((s) => s.type === 'designerCanvas')
            ? 'advancedLayout'
            : 'standard',
        additionalInstructions:
            instruction ||
            `Improve upon the previous version with more specific data and stronger visual hierarchy. Previous deck subtitle: ${deckSpec.subtitle || 'none'}`,
    });
}

export function extractJSON(text: string): string {
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
        return cleaned.slice(start, end + 1);
    }
    return cleaned;
}
