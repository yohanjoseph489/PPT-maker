import PptxGenJS from 'pptxgenjs';
import type { DeckSpec, Slide } from '@/lib/schemas/deckspec';
import { getTheme } from '@/lib/themes';
import { getPptxThemeConfig, type PptxThemeConfig } from './themes';

const SLIDE_WIDTH = 13.333;
const SLIDE_HEIGHT = 7.5;
type DesignerCanvasSlide = Extract<Slide, { type: 'designerCanvas' }>;
type CanvasElement = DesignerCanvasSlide['elements'][number];

function safePptColor(input: string | undefined, fallback: string) {
    const value = (input || '').trim().replace('#', '');
    if (/^[0-9a-fA-F]{6}$/.test(value)) return value.toUpperCase();
    if (/^[0-9a-fA-F]{3}$/.test(value)) {
        return value
            .split('')
            .map((ch) => `${ch}${ch}`)
            .join('')
            .toUpperCase();
    }
    return fallback;
}

export async function generatePptx(deckSpec: DeckSpec): Promise<Buffer> {
    const pptx = new PptxGenJS();
    const theme = getTheme(deckSpec.themeId);
    const pptxTheme = getPptxThemeConfig(theme);

    pptx.defineLayout({ name: 'WIDE', width: 13.333, height: 7.5 });
    pptx.layout = 'WIDE';
    pptx.title = deckSpec.title;
    pptx.subject = deckSpec.subtitle || '';
    pptx.author = 'SyncSlides';

    for (const slide of deckSpec.slides) {
        addSlide(pptx, slide, pptxTheme);
    }

    const data = await pptx.write({ outputType: 'nodebuffer' });
    return data as Buffer;
}

function addSlide(
    pptx: PptxGenJS,
    slide: Slide,
    config: PptxThemeConfig
) {
    const pptxSlide = pptx.addSlide();
    pptxSlide.background = { color: config.bgColor };

    // Add speaker notes if present
    if (slide.speakerNotes) {
        pptxSlide.addNotes(slide.speakerNotes);
    }

    switch (slide.type) {
        case 'cover':
            renderCover(pptxSlide, slide, config);
            break;
        case 'agenda':
            renderBulletSlide(pptxSlide, slide.title, slide.bullets, config);
            break;
        case 'bullets':
            renderBulletSlide(pptxSlide, slide.title, slide.bullets, config);
            break;
        case 'twoColumn':
            renderTwoColumn(pptxSlide, slide, config);
            break;
        case 'quote':
            renderQuote(pptxSlide, slide, config);
            break;
        case 'chart':
            renderChart(pptxSlide, slide, config);
            break;
        case 'imageWithCaption':
            renderImageWithCaption(pptxSlide, slide, config);
            break;
        case 'sectionHeader':
            renderSectionHeader(pptxSlide, slide, config);
            break;
        case 'designerCanvas':
            renderDesignerCanvas(pptxSlide, slide, config);
            break;
    }

    // Accent bar at bottom
    pptxSlide.addShape('rect' as PptxGenJS.ShapeType, {
        x: 0,
        y: 7.2,
        w: 13.333,
        h: 0.05,
        fill: { color: config.primaryColor },
    });
}

function renderCover(
    slide: PptxGenJS.Slide,
    data: { title: string; subtitle?: string },
    config: PptxThemeConfig
) {
    // Accent shape
    slide.addShape('rect' as PptxGenJS.ShapeType, {
        x: 0.8,
        y: 2.5,
        w: 0.08,
        h: 1.8,
        fill: { color: config.accentColor },
    });

    slide.addText(data.title, {
        x: 1.2,
        y: 2.2,
        w: 10,
        h: 1.5,
        fontSize: 44,
        fontFace: config.headingFont,
        color: config.titleColor,
        bold: true,
    });

    if (data.subtitle) {
        slide.addText(data.subtitle, {
            x: 1.2,
            y: 3.8,
            w: 10,
            h: 0.8,
            fontSize: 22,
            fontFace: config.bodyFont,
            color: config.secondaryColor,
        });
    }
}

function renderBulletSlide(
    slide: PptxGenJS.Slide,
    title: string,
    bullets: string[],
    config: PptxThemeConfig
) {
    slide.addText(title, {
        x: 0.8,
        y: 0.4,
        w: 11,
        h: 1,
        fontSize: 32,
        fontFace: config.headingFont,
        color: config.titleColor,
        bold: true,
    });

    const bulletItems = bullets.map((b) => ({
        text: b,
        options: {
            fontSize: 18,
            fontFace: config.bodyFont,
            color: config.textColor,
            bullet: { type: 'bullet' as const, color: config.accentColor },
            paraSpaceAfter: 12,
        },
    }));

    slide.addText(bulletItems, {
        x: 1.2,
        y: 1.6,
        w: 10,
        h: 5,
        valign: 'top' as PptxGenJS.VAlign,
    });
}

function renderTwoColumn(
    slide: PptxGenJS.Slide,
    data: { title: string; left: string[]; right: string[] },
    config: PptxThemeConfig
) {
    slide.addText(data.title, {
        x: 0.8,
        y: 0.4,
        w: 11,
        h: 1,
        fontSize: 32,
        fontFace: config.headingFont,
        color: config.titleColor,
        bold: true,
    });

    // Left column
    const leftItems = data.left.map((b) => ({
        text: b,
        options: {
            fontSize: 16,
            fontFace: config.bodyFont,
            color: config.textColor,
            bullet: { type: 'bullet' as const, color: config.accentColor },
            paraSpaceAfter: 10,
        },
    }));

    slide.addText(leftItems, {
        x: 0.8,
        y: 1.8,
        w: 5.5,
        h: 4.8,
        valign: 'top' as PptxGenJS.VAlign,
    });

    // Divider
    slide.addShape('rect' as PptxGenJS.ShapeType, {
        x: 6.55,
        y: 1.8,
        w: 0.02,
        h: 4.5,
        fill: { color: config.borderColor },
    });

    // Right column
    const rightItems = data.right.map((b) => ({
        text: b,
        options: {
            fontSize: 16,
            fontFace: config.bodyFont,
            color: config.textColor,
            bullet: { type: 'bullet' as const, color: config.accentColor },
            paraSpaceAfter: 10,
        },
    }));

    slide.addText(rightItems, {
        x: 7,
        y: 1.8,
        w: 5.5,
        h: 4.8,
        valign: 'top' as PptxGenJS.VAlign,
    });
}

function renderQuote(
    slide: PptxGenJS.Slide,
    data: { quote: string; attribution?: string },
    config: PptxThemeConfig
) {
    // Large quote mark
    slide.addText('\u201C', {
        x: 1,
        y: 1.5,
        w: 1.5,
        h: 1.5,
        fontSize: 96,
        fontFace: config.headingFont,
        color: config.accentColor,
    });

    slide.addText(data.quote, {
        x: 1.5,
        y: 2.5,
        w: 10,
        h: 2.5,
        fontSize: 28,
        fontFace: config.headingFont,
        color: config.titleColor,
        italic: true,
        valign: 'middle' as PptxGenJS.VAlign,
    });

    if (data.attribution) {
        slide.addText(`\u2014 ${data.attribution}`, {
            x: 1.5,
            y: 5.2,
            w: 10,
            h: 0.6,
            fontSize: 18,
            fontFace: config.bodyFont,
            color: config.secondaryColor,
        });
    }
}

function pctX(value: number) {
    return (Math.max(0, Math.min(100, value)) / 100) * SLIDE_WIDTH;
}

function pctY(value: number) {
    return (Math.max(0, Math.min(100, value)) / 100) * SLIDE_HEIGHT;
}

function renderChart(
    slide: PptxGenJS.Slide,
    data: {
        title: string;
        chartType: 'bar' | 'line' | 'pie';
        labels: string[];
        values: number[];
        insights?: string[];
    },
    config: PptxThemeConfig
) {
    const labels = (data.labels || []).slice(0, 12);
    const values = (data.values || []).slice(0, 12).map((v) => (Number.isFinite(v) ? Number(v) : 0));
    const maxLen = Math.min(labels.length, values.length);
    const finalLabels = labels.slice(0, maxLen);
    const finalValues = values.slice(0, maxLen);
    const insights = (data.insights || []).slice(0, 4);

    slide.addText(data.title, {
        x: 0.8,
        y: 0.4,
        w: 11,
        h: 0.9,
        fontSize: 30,
        fontFace: config.headingFont,
        color: config.titleColor,
        bold: true,
    });

    if (finalLabels.length >= 2) {
        const chartType = (data.chartType === 'line' ? 'line' : data.chartType === 'pie' ? 'pie' : 'bar') as
            | 'bar'
            | 'line'
            | 'pie';

        slide.addChart(
            chartType,
            [
                {
                    name: 'Series 1',
                    labels: finalLabels,
                    values: finalValues,
                },
            ],
            {
                x: 0.8,
                y: 1.45,
                w: 8.0,
                h: 4.9,
                chartColors: [config.primaryColor, config.accentColor, '10B981', 'F59E0B'],
                showLegend: false,
                showValue: data.chartType === 'pie',
                catAxisLabelRotate: finalLabels.some((l) => l.length > 10) ? 25 : 0,
                valAxisTitle: '',
                catAxisTitle: '',
                showTitle: false,
            }
        );
    } else {
        slide.addShape('rect' as PptxGenJS.ShapeType, {
            x: 0.8,
            y: 1.6,
            w: 8,
            h: 4.4,
            fill: { color: config.surfaceColor },
            line: { color: config.borderColor, width: 1 },
        });
        slide.addText('Insufficient chart data (need at least 2 points)', {
            x: 1.2,
            y: 3.4,
            w: 7,
            h: 0.6,
            fontSize: 14,
            fontFace: config.bodyFont,
            color: config.secondaryColor,
            italic: true,
        });
    }

    slide.addShape('roundRect' as PptxGenJS.ShapeType, {
        x: 9.1,
        y: 1.55,
        w: 3.35,
        h: 4.7,
        fill: { color: config.surfaceColor, transparency: 4 },
        line: { color: config.borderColor, width: 1 },
    });

    slide.addText('Key Insights', {
        x: 9.35,
        y: 1.85,
        w: 2.9,
        h: 0.4,
        fontSize: 12,
        fontFace: config.bodyFont,
        color: config.secondaryColor,
        bold: true,
    });

    if (insights.length > 0) {
        const insightItems = insights.map((s) => ({
            text: s,
            options: {
                fontSize: 12,
                fontFace: config.bodyFont,
                color: config.textColor,
                bullet: { type: 'bullet' as const, color: config.accentColor },
                paraSpaceAfter: 8,
            },
        }));

        slide.addText(insightItems, {
            x: 9.35,
            y: 2.3,
            w: 2.9,
            h: 3.8,
            valign: 'top' as PptxGenJS.VAlign,
        });
    } else {
        slide.addText('Add concise observations tied to the data.', {
            x: 9.35,
            y: 2.35,
            w: 2.9,
            h: 1.2,
            fontSize: 12,
            fontFace: config.bodyFont,
            color: config.secondaryColor,
            italic: true,
        });
    }
}

function renderImageWithCaption(
    slide: PptxGenJS.Slide,
    data: { imagePrompt: string; caption: string; title?: string; imageUrl?: string },
    config: PptxThemeConfig
) {
    if (data.title) {
        slide.addText(data.title, {
            x: 0.8,
            y: 0.4,
            w: 11,
            h: 0.8,
            fontSize: 28,
            fontFace: config.headingFont,
            color: config.titleColor,
            bold: true,
        });
    }

    const hasCustomImage = typeof data.imageUrl === 'string' && data.imageUrl.trim().length > 0;
    let imageEmbedded = false;
    if (hasCustomImage) {
        try {
            slide.addImage({
                data: data.imageUrl as string,
                x: 1.5,
                y: 1.5,
                w: 10,
                h: 4,
            });
            imageEmbedded = true;
        } catch {
            // Fallback to placeholder if image embedding fails.
        }
    }

    if (!imageEmbedded) {
        // Placeholder box for image
        slide.addShape('rect' as PptxGenJS.ShapeType, {
            x: 1.5,
            y: 1.5,
            w: 10,
            h: 4,
            fill: { color: config.surfaceColor },
            line: { color: config.borderColor, width: 1 },
            rectRadius: 0.1,
        });

        slide.addText(`[${data.imagePrompt}]`, {
            x: 1.5,
            y: 2.5,
            w: 10,
            h: 2,
            fontSize: 14,
            fontFace: config.bodyFont,
            color: config.secondaryColor,
            align: 'center' as PptxGenJS.HAlign,
            valign: 'middle' as PptxGenJS.VAlign,
            italic: true,
        });
    }

    slide.addText(data.caption, {
        x: 1.5,
        y: 5.8,
        w: 10,
        h: 0.8,
        fontSize: 16,
        fontFace: config.bodyFont,
        color: config.textColor,
        align: 'center' as PptxGenJS.HAlign,
    });
}

function renderSectionHeader(
    slide: PptxGenJS.Slide,
    data: { title: string; subtitle?: string },
    config: PptxThemeConfig
) {
    // Accent bar
    slide.addShape('rect' as PptxGenJS.ShapeType, {
        x: 5.8,
        y: 2.8,
        w: 1.7,
        h: 0.06,
        fill: { color: config.accentColor },
    });

    slide.addText(data.title, {
        x: 1,
        y: 2.8,
        w: 11,
        h: 1.5,
        fontSize: 40,
        fontFace: config.headingFont,
        color: config.titleColor,
        bold: true,
        align: 'center' as PptxGenJS.HAlign,
        valign: 'middle' as PptxGenJS.VAlign,
    });

    if (data.subtitle) {
        slide.addText(data.subtitle, {
            x: 2,
            y: 4.3,
            w: 9,
            h: 0.8,
            fontSize: 20,
            fontFace: config.bodyFont,
            color: config.secondaryColor,
            align: 'center' as PptxGenJS.HAlign,
        });
    }
}

function renderDesignerCanvas(
    slide: PptxGenJS.Slide,
    data: DesignerCanvasSlide,
    config: PptxThemeConfig
) {
    if (data.background) {
        slide.background = { color: safePptColor(data.background, config.bgColor) };
    }

    for (const element of data.elements.slice(0, 30)) {
        renderCanvasElement(slide, element, config);
    }
}

function renderCanvasElement(
    slide: PptxGenJS.Slide,
    element: CanvasElement,
    config: PptxThemeConfig
) {
    const x = pctX(element.x);
    const y = pctY(element.y);
    const w = pctX(element.w);
    const h = pctY(element.h);

    if (element.kind === 'text') {
        slide.addText(element.text, {
            x,
            y,
            w,
            h,
            fontSize: Math.max(10, Math.min(60, element.style?.fontSize || 20)),
            fontFace: config.bodyFont,
            color: safePptColor(element.style?.color, config.textColor),
            bold: element.style?.fontWeight === 'bold' || element.style?.fontWeight === 'semibold',
            italic: element.style?.italic || false,
            align: (element.style?.align || 'left') as PptxGenJS.HAlign,
            valign: 'top' as PptxGenJS.VAlign,
            margin: 1,
        });
        return;
    }

    if (element.kind === 'shape') {
        const shapeType =
            element.shape === 'circle'
                ? ('ellipse' as PptxGenJS.ShapeType)
                : element.shape === 'roundedRect'
                  ? ('roundRect' as PptxGenJS.ShapeType)
                  : ('rect' as PptxGenJS.ShapeType);

        slide.addShape(shapeType, {
            x,
            y,
            w,
            h: element.shape === 'line' ? 0.03 : h,
            fill: { color: safePptColor(element.style?.fill, config.surfaceColor), transparency: element.style?.opacity ? (1 - element.style.opacity) * 100 : 0 },
            line: {
                color: safePptColor(element.style?.stroke, config.borderColor),
                width: element.style?.strokeWidth || 1,
            },
        });
        return;
    }

    if (element.kind === 'image') {
        if (element.imageUrl) {
            try {
                slide.addImage({
                    data: element.imageUrl,
                    x,
                    y,
                    w,
                    h,
                });
                return;
            } catch {
                // Fallback placeholder below
            }
        }

        slide.addShape('rect' as PptxGenJS.ShapeType, {
            x,
            y,
            w,
            h,
            fill: { color: config.surfaceColor },
            line: { color: config.borderColor, width: 1 },
        });
        slide.addText(`[${element.prompt || 'Image'}]`, {
            x,
            y,
            w,
            h,
            fontSize: 11,
            fontFace: config.bodyFont,
            color: config.secondaryColor,
            italic: true,
            align: 'center' as PptxGenJS.HAlign,
            valign: 'middle' as PptxGenJS.VAlign,
        });
        return;
    }

    const labels = element.labels.slice(0, 12);
    const values = element.values.slice(0, 12);
    const len = Math.min(labels.length, values.length);
    if (len < 2) {
        slide.addShape('rect' as PptxGenJS.ShapeType, {
            x,
            y,
            w,
            h,
            fill: { color: config.surfaceColor },
            line: { color: config.borderColor, width: 1 },
        });
        return;
    }

    const chartType = (element.chartType === 'line' ? 'line' : element.chartType === 'pie' ? 'pie' : 'bar') as
        | 'bar'
        | 'line'
        | 'pie';

    slide.addChart(
        chartType,
        [
            {
                name: 'Series 1',
                labels: labels.slice(0, len),
                values: values.slice(0, len),
            },
        ],
        {
            x,
            y,
            w,
            h,
            chartColors: [config.primaryColor, config.accentColor, '10B981', 'F59E0B'],
            showLegend: false,
            showTitle: false,
            showValue: element.chartType === 'pie',
        }
    );
}
