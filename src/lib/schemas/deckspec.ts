import { z } from 'zod';
import { THEME_IDS } from '@/lib/themes';

// ─── Slide Types ───────────────────────────────────────────

export const SlideTypeEnum = z.enum([
    'cover',
    'agenda',
    'bullets',
    'twoColumn',
    'quote',
    'imageWithCaption',
    'sectionHeader',
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

// ─── Discriminated Union ───────────────────────────────────

export const SlideSchema = z.discriminatedUnion('type', [
    CoverSlideSchema,
    AgendaSlideSchema,
    BulletsSlideSchema,
    TwoColumnSlideSchema,
    QuoteSlideSchema,
    ImageWithCaptionSlideSchema,
    SectionHeaderSlideSchema,
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
    topic: z.string().min(1, 'Topic is required').max(500),
    audience: z.string().max(200).optional(),
    tone: z.enum(['professional', 'casual', 'academic', 'creative', 'persuasive']).default('professional'),
    slideCount: z.number().int().min(3).max(20).default(8),
    themeId: z.enum(THEME_IDS).default('minimal'),
    includeSpeakerNotes: z.boolean().default(false),
    brandColor: z.string().optional(),
    additionalInstructions: z.string().max(500).optional(),
});

export type GenerateInput = z.infer<typeof GenerateInputSchema>;

// ─── Regeneration Input ────────────────────────────────────

export const RegenerateInputSchema = z.object({
    deckSpec: DeckSpecSchema,
    slideIndex: z.number().int().min(0).optional(),
    instruction: z.string().max(500).optional(),
});

export type RegenerateInput = z.infer<typeof RegenerateInputSchema>;
