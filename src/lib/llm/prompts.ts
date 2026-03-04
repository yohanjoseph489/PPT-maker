import type { GenerateInput, DeckSpec, SlideType } from '@/lib/schemas/deckspec';
import { themes, type ThemeId } from '@/lib/themes';

const SLIDE_TYPE_EXAMPLES: Record<SlideType, string> = {
    cover: '{"id":"1","type":"cover","title":"Title Here","subtitle":"Subtitle Here"}',
    agenda: '{"id":"2","type":"agenda","title":"Agenda","bullets":["Item 1","Item 2","Item 3"]}',
    bullets: '{"id":"3","type":"bullets","title":"Key Points","bullets":["Point 1","Point 2","Point 3"]}',
    twoColumn: '{"id":"4","type":"twoColumn","title":"Comparison","left":["Left 1","Left 2"],"right":["Right 1","Right 2"]}',
    quote: '{"id":"5","type":"quote","quote":"A great quote here","attribution":"Author Name"}',
    imageWithCaption: '{"id":"6","type":"imageWithCaption","imagePrompt":"description of image","caption":"Caption text"}',
    sectionHeader: '{"id":"7","type":"sectionHeader","title":"Section Title","subtitle":"Section subtitle"}',
};

export function buildGenerationPrompt(input: GenerateInput): string {
    const theme = themes[input.themeId as ThemeId];
    const slideTypes = Object.keys(SLIDE_TYPE_EXAMPLES).join(', ');

    return `You are a professional presentation designer. Create a presentation deck as a JSON object.

TOPIC: ${input.topic}
${input.audience ? `AUDIENCE: ${input.audience}` : ''}
TONE: ${input.tone}
NUMBER OF SLIDES: ${input.slideCount}
THEME: ${theme.name} (${theme.description})
${input.includeSpeakerNotes ? 'INCLUDE SPEAKER NOTES for each slide.' : ''}
${input.additionalInstructions ? `ADDITIONAL INSTRUCTIONS: ${input.additionalInstructions}` : ''}

OUTPUT REQUIREMENTS:
1. Return ONLY valid JSON—no markdown, no explanation, no code fences.
2. The JSON must match this exact structure:
{
  "title": "Deck Title",
  "subtitle": "Optional subtitle",
  "themeId": "${input.themeId}",
  "slides": [...]
}
3. Each slide MUST have a unique "id" (use sequential numbers as strings: "1", "2", etc.).
4. Available slide types: ${slideTypes}
5. The FIRST slide MUST be type "cover".
6. Use a variety of slide types for visual interest.
7. Each slide type structure:
${Object.values(SLIDE_TYPE_EXAMPLES).join('\n')}

${input.includeSpeakerNotes ? '8. Add "speakerNotes" field (string) to each slide.' : ''}

Create exactly ${input.slideCount} slides. Make the content insightful, specific, and presentation-worthy. Use concrete examples and data points where appropriate.`;
}

export function buildRegenerateSlidePrompt(
    deckSpec: DeckSpec,
    slideIndex: number,
    instruction?: string
): string {
    const slide = deckSpec.slides[slideIndex];
    const theme = themes[deckSpec.themeId];

    return `You are a professional presentation designer. Regenerate ONLY this single slide for a presentation about "${deckSpec.title}".

CURRENT SLIDE (index ${slideIndex}):
${JSON.stringify(slide, null, 2)}

DECK THEME: ${theme.name}
${instruction ? `USER INSTRUCTION: ${instruction}` : 'Make it better, more impactful, and more specific.'}

OUTPUT: Return ONLY a valid JSON object for this single slide. Keep the same "id" ("${slide.id}") and "type" ("${slide.type}").
No markdown, no explanation, only the JSON slide object.`;
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
        additionalInstructions: instruction || `Improve upon the previous version. Previous subtitle: ${deckSpec.subtitle || 'none'}`,
    });
}

export function extractJSON(text: string): string {
    // Strip markdown code fences if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    // Try to find JSON object
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
        return cleaned.slice(start, end + 1);
    }
    return cleaned;
}
