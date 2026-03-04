import PptxGenJS from 'pptxgenjs';
import type { DeckSpec, Slide } from '@/lib/schemas/deckspec';
import { getTheme } from '@/lib/themes';
import { getPptxThemeConfig, type PptxThemeConfig } from './themes';

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
        case 'imageWithCaption':
            renderImageWithCaption(pptxSlide, slide, config);
            break;
        case 'sectionHeader':
            renderSectionHeader(pptxSlide, slide, config);
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
