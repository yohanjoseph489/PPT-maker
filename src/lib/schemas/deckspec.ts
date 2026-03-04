import { z } from 'zod';
import { THEME_IDS } from '@/lib/themes';

const MAX_PROMPT_WORDS = 500;
const SOFT_MAX_PROMPT_CHARS = 4000;

function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

const PromptTextSchema = z
    .string()
    .trim()
    .min(1, 'Prompt is required')
    .max(SOFT_MAX_PROMPT_CHARS, `Prompt must be ${SOFT_MAX_PROMPT_CHARS} characters or fewer`)
    .refine((value) => countWords(value) <= MAX_PROMPT_WORDS, {
        message: `Prompt must be ${MAX_PROMPT_WORDS} words or fewer`,
    });

// ─── Slide Types ───────────────────────────────────────────

export const SlideTypeEnum = z.enum([
    'cover',
    'agenda',
    'bullets',
    'twoColumn',
    'quote',
    'chart',
    'imageWithCaption',
    'sectionHeader',
    'designerCanvas',
]);

export type SlideType = z.infer<typeof SlideTypeEnum>;

// ─── Individual Slide Schemas ──────────────────────────────

const BaseSlideFields = {
    id: z.string(),
    speakerNotes: z.string().optional(),
    layoutHints: z.record(z.string(), z.string()).optional(),
};

export const CoverSlideSchema = z.object({
    ...BaseSlideFields,
    type: z.literal('cover'),
    title: z.string(),
    subtitle: z.string().optional(),
    imagePrompt: z.string().optional(),
});

export const AgendaSlideSchema = z.object({
    ...BaseSlideFields,
    type: z.literal('agenda'),
    title: z.string(),
    bullets: z.array(z.string()),
});

export const BulletsSlideSchema = z.object({
    ...BaseSlideFields,
    type: z.literal('bullets'),
    title: z.string(),
    bullets: z.array(z.string()),
});

export const TwoColumnSlideSchema = z.object({
    ...BaseSlideFields,
    type: z.literal('twoColumn'),
    title: z.string(),
    left: z.array(z.string()),
    right: z.array(z.string()),
});

export const QuoteSlideSchema = z.object({
    ...BaseSlideFields,
    type: z.literal('quote'),
    quote: z.string(),
    attribution: z.string().optional(),
});

export const ChartSlideSchema = z.object({
    ...BaseSlideFields,
    type: z.literal('chart'),
    title: z.string(),
    chartType: z.enum(['bar', 'line', 'pie']).default('bar'),
    labels: z.array(z.string()).min(2).max(12),
    values: z.array(z.number()).min(2).max(12),
    insights: z.array(z.string()).max(4).optional(),
});

export const ImageWithCaptionSlideSchema = z.object({
    ...BaseSlideFields,
    type: z.literal('imageWithCaption'),
    imagePrompt: z.string(),
    caption: z.string(),
    title: z.string().optional(),
    imageUrl: z.string().optional(),
});

export const SectionHeaderSlideSchema = z.object({
    ...BaseSlideFields,
    type: z.literal('sectionHeader'),
    title: z.string(),
    subtitle: z.string().optional(),
});

const CanvasElementBase = z.object({
    id: z.string(),
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    w: z.number().min(1).max(100),
    h: z.number().min(1).max(100),
});

const CanvasTextElementSchema = CanvasElementBase.extend({
    kind: z.literal('text'),
    text: z.string(),
    style: z
        .object({
            color: z.string().optional(),
            fontSize: z.number().min(8).max(120).optional(),
            fontWeight: z.enum(['normal', 'medium', 'semibold', 'bold']).optional(),
            align: z.enum(['left', 'center', 'right']).optional(),
            italic: z.boolean().optional(),
            underline: z.boolean().optional(),
            strikethrough: z.boolean().optional(),
            fontFamily: z.string().max(100).optional(),
            background: z.string().optional(),
        })
        .optional(),
});

const CanvasShapeElementSchema = CanvasElementBase.extend({
    kind: z.literal('shape'),
    shape: z.enum(['rect', 'roundedRect', 'circle', 'line']),
    style: z
        .object({
            fill: z.string().optional(),
            stroke: z.string().optional(),
            strokeWidth: z.number().min(0).max(20).optional(),
            opacity: z.number().min(0).max(1).optional(),
        })
        .optional(),
});

const CanvasImageElementSchema = CanvasElementBase.extend({
    kind: z.literal('image'),
    imageUrl: z.string().optional(),
    prompt: z.string().optional(),
    fit: z.enum(['cover', 'contain']).optional(),
});

const CanvasChartElementSchema = CanvasElementBase.extend({
    kind: z.literal('chart'),
    chartType: z.enum(['bar', 'line', 'pie']).default('bar'),
    labels: z.array(z.string()).min(2).max(12),
    values: z.array(z.number()).min(2).max(12),
});

export const CanvasElementSchema = z.discriminatedUnion('kind', [
    CanvasTextElementSchema,
    CanvasShapeElementSchema,
    CanvasImageElementSchema,
    CanvasChartElementSchema,
]);

export const DesignerCanvasSlideSchema = z.object({
    ...BaseSlideFields,
    type: z.literal('designerCanvas'),
    title: z.string(),
    background: z.string().optional(),
    elements: z.array(CanvasElementSchema).min(1).max(30),
});

// ─── Discriminated Union ───────────────────────────────────

export const SlideSchema = z.discriminatedUnion('type', [
    CoverSlideSchema,
    AgendaSlideSchema,
    BulletsSlideSchema,
    TwoColumnSlideSchema,
    QuoteSlideSchema,
    ChartSlideSchema,
    ImageWithCaptionSlideSchema,
    SectionHeaderSlideSchema,
    DesignerCanvasSlideSchema,
]);

export type Slide = z.infer<typeof SlideSchema>;

// ─── DeckSpec ──────────────────────────────────────────────

export const DeckSpecSchema = z.object({
    title: z.string().min(1, 'Deck title is required'),
    subtitle: z.string().optional(),
    themeId: z.enum(THEME_IDS),
    brandColor: z.string().optional(),
    fontPair: z.tuple([z.string(), z.string()]).optional(),
    slides: z.array(SlideSchema).min(1, 'At least one slide is required').max(30),
});

export type DeckSpec = z.infer<typeof DeckSpecSchema>;

// ─── Generation Input ──────────────────────────────────────

export const GenerateInputSchema = z.object({
    topic: PromptTextSchema,
    audience: z.string().max(200).optional(),
    tone: z.enum(['professional', 'casual', 'academic', 'creative', 'persuasive']).default('professional'),
    slideCount: z.number().int().min(3).max(20).default(8),
    themeId: z.enum(THEME_IDS).default('minimal'),
    generationMode: z.enum(['standard', 'advancedLayout']).default('standard'),
    includeSpeakerNotes: z.boolean().default(false),
    brandColor: z.string().optional(),
    additionalInstructions: PromptTextSchema.optional(),
});

export type GenerateInput = z.infer<typeof GenerateInputSchema>;

// ─── Regeneration Input ────────────────────────────────────

export const RegenerateInputSchema = z.object({
    deckSpec: DeckSpecSchema,
    slideIndex: z.number().int().min(0).optional(),
    instruction: PromptTextSchema.optional(),
});

export type RegenerateInput = z.infer<typeof RegenerateInputSchema>;
