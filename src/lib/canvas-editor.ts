import { generateId } from '@/lib/utils';
import type { Slide } from '@/lib/schemas/deckspec';
import type { ThemeDefinition } from '@/lib/themes';

export type DesignerCanvasSlide = Extract<Slide, { type: 'designerCanvas' }>;
export type CanvasElement = DesignerCanvasSlide['elements'][number];
export type CanvasElementKind = CanvasElement['kind'];
export type CanvasTextElement = Extract<CanvasElement, { kind: 'text' }>;
export type CanvasShapeElement = Extract<CanvasElement, { kind: 'shape' }>;
export type CanvasImageElement = Extract<CanvasElement, { kind: 'image' }>;
export type CanvasChartElement = Extract<CanvasElement, { kind: 'chart' }>;
export type LayerDirection = 'forward' | 'backward' | 'front' | 'back';

export const FONT_FAMILY_OPTIONS = [
    'Inter',
    'Poppins',
    'Montserrat',
    'Lato',
    'Merriweather',
    'Roboto Slab',
    'Space Grotesk',
] as const;

const MIN_SIZE = 2;

export const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const clampCanvasBounds = (x: number, y: number, w: number, h: number) => {
    const width = clampNumber(w, MIN_SIZE, 100);
    const height = clampNumber(h, MIN_SIZE, 100);
    const clampedX = clampNumber(x, 0, 100 - width);
    const clampedY = clampNumber(y, 0, 100 - height);
    return { x: clampedX, y: clampedY, w: width, h: height };
};

export const normalizeCanvasElement = <T extends CanvasElement>(element: T): T => {
    const bounds = clampCanvasBounds(element.x, element.y, element.w, element.h);
    return { ...element, ...bounds };
};

export const moveElementLayer = (
    elements: DesignerCanvasSlide['elements'],
    elementId: string,
    direction: LayerDirection
) => {
    const index = elements.findIndex((element) => element.id === elementId);
    if (index < 0) return elements;

    let targetIndex = index;
    if (direction === 'forward') targetIndex = Math.min(elements.length - 1, index + 1);
    if (direction === 'backward') targetIndex = Math.max(0, index - 1);
    if (direction === 'front') targetIndex = elements.length - 1;
    if (direction === 'back') targetIndex = 0;
    if (targetIndex === index) return elements;

    const next = [...elements];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    return next;
};

export const createCanvasElement = (
    kind: CanvasElementKind,
    theme: ThemeDefinition,
    index: number
): CanvasElement => {
    const offset = index * 2;
    if (kind === 'text') {
        return {
            id: generateId(),
            kind: 'text',
            text: 'Double-click to edit text',
            x: clampNumber(10 + offset, 2, 74),
            y: clampNumber(12 + offset, 2, 82),
            w: 28,
            h: 14,
            style: {
                color: theme.colors.text,
                fontSize: 30,
                fontWeight: 'medium',
                align: 'left',
                italic: false,
                underline: false,
                fontFamily: theme.fonts.body,
            },
        };
    }

    if (kind === 'shape') {
        return {
            id: generateId(),
            kind: 'shape',
            shape: 'roundedRect',
            x: clampNumber(18 + offset, 2, 84),
            y: clampNumber(20 + offset, 2, 82),
            w: 24,
            h: 16,
            style: {
                fill: `${theme.colors.primary}26`,
                stroke: `${theme.colors.primary}A6`,
                strokeWidth: 1,
                opacity: 1,
            },
        };
    }

    if (kind === 'image') {
        return {
            id: generateId(),
            kind: 'image',
            prompt: 'Image placeholder',
            x: clampNumber(22 + offset, 2, 78),
            y: clampNumber(16 + offset, 2, 76),
            w: 30,
            h: 24,
            fit: 'cover',
        };
    }

    return {
        id: generateId(),
        kind: 'chart',
        chartType: 'bar',
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        values: [15, 22, 30, 28],
        x: clampNumber(24 + offset, 2, 74),
        y: clampNumber(18 + offset, 2, 74),
        w: 32,
        h: 24,
    };
};

export const duplicateCanvasElement = (element: CanvasElement): CanvasElement =>
    normalizeCanvasElement({
        ...element,
        id: generateId(),
        x: element.x + 2.5,
        y: element.y + 2.5,
    });
