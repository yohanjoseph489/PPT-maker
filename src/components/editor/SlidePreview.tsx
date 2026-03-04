'use client';

import type { Slide } from '@/lib/schemas/deckspec';
import type { ThemeDefinition } from '@/lib/themes';

interface SlidePreviewProps {
    slide: Slide;
    theme: ThemeDefinition;
}

const clamp = (value: string, max = 160) => {
    const clean = value?.trim() || '';
    if (!clean) return '';
    return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

const sanitizeList = (items: string[] | undefined, maxItems: number, maxChars: number) =>
    (items || [])
        .map((item) => clamp(item, maxChars))
        .filter(Boolean)
        .slice(0, maxItems);

export default function SlidePreview({ slide, theme }: SlidePreviewProps) {
    const bg = theme.colors.background;
    const text = theme.colors.text;
    const secondary = theme.colors.textSecondary;
    const primary = theme.colors.primary;
    const surface = theme.colors.surface;
    const heading = theme.fonts.heading;
    const body = theme.fonts.body;

    const containerStyle: React.CSSProperties = {
        background: bg,
        color: text,
        fontFamily: body,
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
    };

    const align = slide.layoutHints?.align === 'center' ? 'center' : 'left';
    const density = slide.layoutHints?.density === 'compact' ? 'compact' : 'comfortable';
    const titleSize = slide.layoutHints?.titleSize === 'large' ? 'large' : 'regular';
    const quoteEmphasis = slide.layoutHints?.emphasis === 'large' ? 'large' : 'standard';
    const mediaPosition = slide.layoutHints?.mediaPosition === 'bottom' ? 'bottom' : 'top';
    const split = slide.layoutHints?.split || '50:50';
    const twoColTemplate = split === '60:40' ? '60% 40%' : split === '40:60' ? '40% 60%' : '1fr 1fr';

    switch (slide.type) {
        case 'cover': {
            const title = clamp(slide.title || 'Untitled Slide', 88);
            const subtitle = clamp(slide.subtitle || '', 140);
            return (
                <div
                    style={containerStyle}
                    className={`flex flex-col justify-center px-[8%] ${align === 'center' ? 'items-center text-center' : ''}`}
                >
                    {align === 'left' && (
                        <div className="absolute left-[6%] top-[35%] w-1 h-[20%] rounded-full" style={{ background: primary }} />
                    )}
                    <h1
                        style={{ fontFamily: heading, color: text }}
                        className={`${titleSize === 'large' ? 'text-5xl lg:text-6xl' : 'text-4xl lg:text-5xl'} font-bold leading-[1.08] mb-3 ${align === 'left' ? 'pl-6' : ''} break-words`}
                    >
                        {title}
                    </h1>
                    {subtitle && (
                        <p style={{ color: secondary }} className={`text-xl lg:text-2xl ${align === 'left' ? 'pl-6' : ''} break-words`}>
                            {subtitle}
                        </p>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${primary}, transparent)` }} />
                </div>
            );
        }

        case 'agenda':
        case 'bullets': {
            const title = clamp(slide.title || 'Slide Title', 72);
            const bullets = sanitizeList(slide.bullets, density === 'compact' ? 8 : 6, density === 'compact' ? 95 : 120);
            return (
                <div style={containerStyle} className={`flex flex-col px-[8%] py-[6%] ${align === 'center' ? 'text-center' : ''}`}>
                    <h2 style={{ fontFamily: heading }} className="text-2xl lg:text-3xl font-bold mb-6 break-words">
                        {title}
                    </h2>
                    <div className={`${density === 'compact' ? 'space-y-2' : 'space-y-3'} flex-1 overflow-hidden`}>
                        {bullets.length > 0 ? (
                            bullets.map((bullet, i) => (
                                <div key={i} className={`flex items-start gap-3 ${align === 'center' ? 'justify-center' : ''}`}>
                                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: primary }} />
                                    <p
                                        style={{ color: text }}
                                        className={`${density === 'compact' ? 'text-sm lg:text-base' : 'text-base lg:text-lg'} leading-relaxed ${align === 'center' ? 'max-w-[85%]' : ''} break-words`}
                                    >
                                        {bullet}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: secondary }} className="italic text-base">
                                Add bullet points in the Properties panel.
                            </p>
                        )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: primary, opacity: 0.6 }} />
                </div>
            );
        }

        case 'twoColumn': {
            const title = clamp(slide.title || 'Two Column Slide', 70);
            const left = sanitizeList(slide.left, 7, 82);
            const right = sanitizeList(slide.right, 7, 82);

            return (
                <div style={containerStyle} className={`flex flex-col px-[8%] py-[6%] ${align === 'center' ? 'text-center' : ''}`}>
                    <h2 style={{ fontFamily: heading }} className="text-2xl lg:text-3xl font-bold mb-6 break-words">
                        {title}
                    </h2>
                    <div className="flex-1 grid gap-6 overflow-hidden" style={{ gridTemplateColumns: twoColTemplate }}>
                        <div className="space-y-2">
                            {left.length > 0 ? (
                                left.map((item, i) => (
                                    <div key={i} className={`flex items-start gap-2 ${align === 'center' ? 'justify-center' : ''}`}>
                                        <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: primary }} />
                                        <p style={{ color: text }} className="text-sm lg:text-base break-words">
                                            {item}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: secondary }} className="italic text-sm">
                                    Left column content
                                </p>
                            )}
                        </div>
                        <div className="space-y-2 pl-6" style={{ borderLeft: `2px solid ${primary}20` }}>
                            {right.length > 0 ? (
                                right.map((item, i) => (
                                    <div key={i} className={`flex items-start gap-2 ${align === 'center' ? 'justify-center' : ''}`}>
                                        <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: primary, opacity: 0.7 }} />
                                        <p style={{ color: text }} className="text-sm lg:text-base break-words">
                                            {item}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: secondary }} className="italic text-sm">
                                    Right column content
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: primary, opacity: 0.6 }} />
                </div>
            );
        }

        case 'quote': {
            const quote = clamp(slide.quote || 'Add a quote to this slide.', quoteEmphasis === 'large' ? 210 : 180);
            const attribution = clamp(slide.attribution || '', 80);
            return (
                <div style={containerStyle} className="flex flex-col items-center justify-center px-[12%] text-center">
                    <span style={{ color: primary }} className="text-7xl font-serif leading-none mb-2">
                        &ldquo;
                    </span>
                    <blockquote
                        style={{ fontFamily: heading, color: text }}
                        className={`${quoteEmphasis === 'large' ? 'text-2xl lg:text-3xl' : 'text-xl lg:text-2xl'} italic leading-relaxed mb-4 break-words`}
                    >
                        {quote}
                    </blockquote>
                    {attribution && <p style={{ color: secondary }} className="text-base break-words">— {attribution}</p>}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: primary, opacity: 0.6 }} />
                </div>
            );
        }

        case 'imageWithCaption': {
            const title = clamp(slide.title || '', 68);
            const prompt = clamp(slide.imagePrompt || 'No image prompt yet', 140);
            const caption = clamp(slide.caption || 'Add a caption in the Properties panel.', 120);

            return (
                <div style={containerStyle} className={`flex flex-col px-[8%] py-[6%] ${align === 'center' ? 'text-center' : ''}`}>
                    {title && (
                        <h2 style={{ fontFamily: heading }} className="text-xl lg:text-2xl font-bold mb-4 break-words">
                            {title}
                        </h2>
                    )}
                    <div
                        className={`rounded-lg flex items-center justify-center ${mediaPosition === 'top' ? 'flex-1 order-1' : 'h-[55%] order-2 mt-3'}`}
                        style={{ background: surface, border: `1px solid ${primary}30` }}
                    >
                        <div className="text-center px-5">
                            <p style={{ color: secondary }} className="text-sm italic break-words">
                                [{prompt}]
                            </p>
                            <p style={{ color: secondary, opacity: 0.8 }} className="text-[11px] mt-1">
                                Image placeholder
                            </p>
                        </div>
                    </div>
                    <p
                        style={{ color: text }}
                        className={`text-sm ${align === 'center' ? 'text-center' : ''} ${mediaPosition === 'top' ? 'mt-3 order-2' : 'order-1'} break-words`}
                    >
                        {caption}
                    </p>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: primary, opacity: 0.6 }} />
                </div>
            );
        }

        case 'sectionHeader': {
            const title = clamp(slide.title || 'Section Title', 74);
            const subtitle = clamp(slide.subtitle || '', 120);
            return (
                <div
                    style={containerStyle}
                    className={`flex flex-col justify-center px-[8%] ${align === 'center' ? 'items-center text-center' : ''}`}
                >
                    <div className="w-16 h-0.5 mb-6 rounded-full" style={{ background: primary }} />
                    <h2
                        style={{ fontFamily: heading }}
                        className={`${titleSize === 'large' ? 'text-4xl lg:text-5xl' : 'text-3xl lg:text-4xl'} font-bold ${align === 'center' ? 'text-center' : ''} mb-3 break-words`}
                    >
                        {title}
                    </h2>
                    {subtitle && (
                        <p style={{ color: secondary }} className="text-lg break-words">
                            {subtitle}
                        </p>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: primary, opacity: 0.6 }} />
                </div>
            );
        }

        default:
            return (
                <div style={containerStyle} className="flex items-center justify-center">
                    <p style={{ color: secondary }}>Unknown slide type</p>
                </div>
            );
    }
}
