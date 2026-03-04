'use client';

import type { Slide } from '@/lib/schemas/deckspec';
import type { ThemeDefinition } from '@/lib/themes';

interface SlidePreviewProps {
    slide: Slide;
    theme: ThemeDefinition;
    onRequestEdit?: (field: string) => void;
}

type DesignerCanvasSlide = Extract<Slide, { type: 'designerCanvas' }>;
type CanvasElement = DesignerCanvasSlide['elements'][number];

const clamp = (value: string, max = 160) => {
    const clean = value?.trim() || '';
    if (!clean) return '';
    return clean.length > max ? `${clean.slice(0, max - 3)}...` : clean;
};

const sanitizeList = (items: string[] | undefined, maxItems: number, maxChars: number) =>
    (items || [])
        .map((item) => clamp(item, maxChars))
        .filter(Boolean)
        .slice(0, maxItems);

const toPct = (value: number) => `${Math.max(0, Math.min(100, value))}%`;

export default function SlidePreview({ slide, theme, onRequestEdit }: SlidePreviewProps) {
    const bg = theme.colors.background;
    const text = theme.colors.text;
    const secondary = theme.colors.textSecondary;
    const primary = theme.colors.primary;
    const surface = theme.colors.surface;
    const heading = theme.fonts.heading;
    const body = theme.fonts.body;
    const requestEdit = (field: string) => onRequestEdit?.(field);

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
    const mediaPosition = slide.layoutHints?.mediaPosition === 'bottom' ? 'bottom' : 'top';
    const split = slide.layoutHints?.split || '50:50';
    const twoColTemplate = split === '60:40' ? '60% 40%' : split === '40:60' ? '40% 60%' : '1fr 1fr';

    if (slide.type === 'cover') {
        return (
            <div style={containerStyle} className={`flex flex-col justify-center px-[8%] ${align === 'center' ? 'items-center text-center' : ''}`}>
                <h1
                    style={{ fontFamily: heading, color: text }}
                    className={`${titleSize === 'large' ? 'text-5xl lg:text-6xl' : 'text-4xl lg:text-5xl'} font-bold leading-[1.08] mb-3 break-words`}
                    onClick={() => requestEdit('title')}
                >
                    {clamp(slide.title || 'Untitled Slide', 88)}
                </h1>
                {slide.subtitle && (
                    <p style={{ color: secondary }} className="text-xl lg:text-2xl break-words" onClick={() => requestEdit('subtitle')}>
                        {clamp(slide.subtitle, 140)}
                    </p>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: primary, opacity: 0.6 }} />
            </div>
        );
    }

    if (slide.type === 'agenda' || slide.type === 'bullets') {
        const bullets = sanitizeList(slide.bullets, density === 'compact' ? 8 : 6, density === 'compact' ? 95 : 120);
        return (
            <div style={containerStyle} className={`flex flex-col px-[8%] py-[6%] ${align === 'center' ? 'text-center' : ''}`}>
                <h2 style={{ fontFamily: heading }} className="text-2xl lg:text-3xl font-bold mb-6 break-words" onClick={() => requestEdit('title')}>
                    {clamp(slide.title || 'Slide Title', 72)}
                </h2>
                <div className={`${density === 'compact' ? 'space-y-2' : 'space-y-3'} flex-1 overflow-hidden`}>
                    {bullets.map((bullet, i) => (
                        <div key={i} className={`flex items-start gap-3 ${align === 'center' ? 'justify-center' : ''}`}>
                            <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: primary }} />
                            <p className={`${density === 'compact' ? 'text-sm lg:text-base' : 'text-base lg:text-lg'} break-words`} onClick={() => requestEdit('bullets')}>
                                {bullet}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: primary, opacity: 0.6 }} />
            </div>
        );
    }

    if (slide.type === 'twoColumn') {
        const left = sanitizeList(slide.left, 7, 82);
        const right = sanitizeList(slide.right, 7, 82);
        return (
            <div style={containerStyle} className="flex flex-col px-[8%] py-[6%]">
                <h2 style={{ fontFamily: heading }} className="text-2xl lg:text-3xl font-bold mb-6 break-words" onClick={() => requestEdit('title')}>
                    {clamp(slide.title || 'Two Column Slide', 70)}
                </h2>
                <div className="flex-1 grid gap-6 overflow-hidden" style={{ gridTemplateColumns: twoColTemplate }}>
                    <div className="space-y-2">
                        {left.map((item, i) => (
                            <p key={i} className="text-sm lg:text-base break-words" onClick={() => requestEdit('left')}>
                                {item}
                            </p>
                        ))}
                    </div>
                    <div className="space-y-2 pl-6" style={{ borderLeft: `2px solid ${primary}20` }}>
                        {right.map((item, i) => (
                            <p key={i} className="text-sm lg:text-base break-words" onClick={() => requestEdit('right')}>
                                {item}
                            </p>
                        ))}
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: primary, opacity: 0.6 }} />
            </div>
        );
    }

    if (slide.type === 'quote') {
        return (
            <div style={containerStyle} className="flex flex-col items-center justify-center px-[12%] text-center">
                <span style={{ color: primary }} className="text-7xl font-serif leading-none mb-2">
                    &ldquo;
                </span>
                <blockquote style={{ fontFamily: heading }} className="text-xl lg:text-2xl italic leading-relaxed mb-4 break-words" onClick={() => requestEdit('quote')}>
                    {clamp(slide.quote || 'Add a quote.', 180)}
                </blockquote>
                {slide.attribution && (
                    <p style={{ color: secondary }} className="text-base break-words" onClick={() => requestEdit('attribution')}>
                        - {clamp(slide.attribution, 80)}
                    </p>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: primary, opacity: 0.6 }} />
            </div>
        );
    }

    if (slide.type === 'chart') {
        const labels = slide.labels.slice(0, 8);
        const values = slide.values.slice(0, 8);
        const maxValue = Math.max(...values, 1);
        return (
            <div style={containerStyle} className="flex flex-col px-[8%] py-[6%]">
                <h2 style={{ fontFamily: heading }} className="text-2xl lg:text-3xl font-bold mb-4 break-words" onClick={() => requestEdit('title')}>
                    {clamp(slide.title || 'Data Overview', 72)}
                </h2>
                <div className="rounded-lg p-4 flex-1 border" style={{ background: surface, borderColor: `${primary}25` }} onClick={() => requestEdit('values')}>
                    <div className="h-full flex items-end gap-3">
                        {values.map((value, i) => (
                            <div key={`${labels[i]}-${i}`} className="flex-1 flex flex-col items-center gap-2">
                                <div className="text-[11px]" style={{ color: secondary }}>{value}</div>
                                <div className="w-full rounded-t-md" style={{ height: `${Math.max((value / maxValue) * 100, 4)}%`, background: primary }} />
                                <div className="text-[11px] text-center leading-tight break-words" style={{ color: secondary }}>{clamp(labels[i] || `Item ${i + 1}`, 16)}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: primary, opacity: 0.6 }} />
            </div>
        );
    }

    if (slide.type === 'imageWithCaption') {
        const imageUrl = slide.imageUrl?.trim() || '';
        return (
            <div style={containerStyle} className={`flex flex-col px-[8%] py-[6%] ${align === 'center' ? 'text-center' : ''}`}>
                {slide.title && (
                    <h2 style={{ fontFamily: heading }} className="text-xl lg:text-2xl font-bold mb-4 break-words" onClick={() => requestEdit('title')}>
                        {clamp(slide.title, 68)}
                    </h2>
                )}
                <div className={`rounded-lg flex items-center justify-center ${mediaPosition === 'top' ? 'flex-1 order-1' : 'h-[55%] order-2 mt-3'}`} style={{ background: surface, border: `1px solid ${primary}30` }}>
                    {imageUrl ? (
                        <img src={imageUrl} alt={slide.caption || 'Slide image'} className="w-full h-full object-cover rounded-lg" onClick={() => requestEdit('imagePrompt')} />
                    ) : (
                        <p style={{ color: secondary }} className="text-sm italic px-5 text-center break-words" onClick={() => requestEdit('imagePrompt')}>
                            [{clamp(slide.imagePrompt || 'No image prompt yet', 140)}]
                        </p>
                    )}
                </div>
                <p className={`text-sm ${mediaPosition === 'top' ? 'mt-3 order-2' : 'order-1'}`} onClick={() => requestEdit('caption')}>
                    {clamp(slide.caption || 'Add a caption.', 120)}
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: primary, opacity: 0.6 }} />
            </div>
        );
    }

    if (slide.type === 'sectionHeader') {
        return (
            <div style={containerStyle} className={`flex flex-col justify-center px-[8%] ${align === 'center' ? 'items-center text-center' : ''}`}>
                <div className="w-16 h-0.5 mb-6 rounded-full" style={{ background: primary }} />
                <h2 style={{ fontFamily: heading }} className={`${titleSize === 'large' ? 'text-4xl lg:text-5xl' : 'text-3xl lg:text-4xl'} font-bold mb-3 break-words`} onClick={() => requestEdit('title')}>
                    {clamp(slide.title || 'Section Title', 74)}
                </h2>
                {slide.subtitle && (
                    <p style={{ color: secondary }} className="text-lg break-words" onClick={() => requestEdit('subtitle')}>
                        {clamp(slide.subtitle, 120)}
                    </p>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: primary, opacity: 0.6 }} />
            </div>
        );
    }

    if (slide.type === 'designerCanvas') {
        const canvasSlide = slide as DesignerCanvasSlide;
        const renderCanvasElement = (element: CanvasElement) => {
            const baseStyle: React.CSSProperties = {
                position: 'absolute',
                left: toPct(element.x),
                top: toPct(element.y),
                width: toPct(element.w),
                height: toPct(element.h),
            };

            if (element.kind === 'text') {
                return (
                    <div
                        key={element.id}
                        style={{
                            ...baseStyle,
                            color: element.style?.color || text,
                            fontSize: Math.max(10, Math.min(56, element.style?.fontSize || 20)),
                            fontWeight: element.style?.fontWeight === 'bold' ? 700 : element.style?.fontWeight === 'semibold' ? 600 : element.style?.fontWeight === 'medium' ? 500 : 400,
                            textAlign: element.style?.align || 'left',
                            fontStyle: element.style?.italic ? 'italic' : 'normal',
                            lineHeight: 1.2,
                            overflow: 'hidden',
                            wordBreak: 'break-word',
                        }}
                        onClick={() => requestEdit('elements')}
                    >
                        {clamp(element.text, 800)}
                    </div>
                );
            }

            if (element.kind === 'shape') {
                return (
                    <div
                        key={element.id}
                        style={{
                            ...baseStyle,
                            background: element.shape === 'line' ? 'transparent' : element.style?.fill || `${primary}20`,
                            border: `${element.style?.strokeWidth ?? 1}px solid ${element.style?.stroke || `${primary}55`}`,
                            borderRadius: element.shape === 'circle' ? '9999px' : element.shape === 'roundedRect' ? '14px' : '2px',
                            opacity: element.style?.opacity ?? 1,
                            height: element.shape === 'line' ? '2px' : baseStyle.height,
                        }}
                        onClick={() => requestEdit('elements')}
                    />
                );
            }

            if (element.kind === 'image') {
                const hasUrl = !!element.imageUrl?.trim();
                return (
                    <div key={element.id} style={{ ...baseStyle, borderRadius: '12px', overflow: 'hidden', border: `1px solid ${primary}30`, background: surface }} onClick={() => requestEdit('elements')}>
                        {hasUrl ? (
                            <img src={element.imageUrl} alt={element.prompt || 'Canvas image'} className={`w-full h-full ${element.fit === 'contain' ? 'object-contain' : 'object-cover'}`} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center px-2 text-center">
                                <p style={{ color: secondary }} className="text-[11px] leading-snug break-words">
                                    {clamp(element.prompt || 'Image placeholder', 120)}
                                </p>
                            </div>
                        )}
                    </div>
                );
            }

            const values = element.values?.slice(0, 8) || [];
            const labels = element.labels?.slice(0, 8) || [];
            const maxValue = Math.max(...values, 1);
            return (
                <div key={element.id} style={{ ...baseStyle, borderRadius: '12px', border: `1px solid ${primary}30`, background: surface, padding: '8px' }} onClick={() => requestEdit('elements')}>
                    <div className="w-full h-full flex items-end gap-1.5">
                        {values.map((v, i) => (
                            <div key={`${labels[i]}-${i}`} className="flex-1 flex flex-col items-center justify-end gap-1">
                                <div className="w-full rounded-sm" style={{ height: `${Math.max((Math.max(v, 0) / maxValue) * 100, 6)}%`, background: primary, opacity: 0.8 }} />
                                <div className="text-[9px] leading-none text-center break-words" style={{ color: secondary }}>
                                    {clamp(labels[i] || `${i + 1}`, 8)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        };

        return (
            <div style={{ ...containerStyle, background: canvasSlide.background || bg }} className="relative">
                <div className="absolute inset-0" onClick={() => requestEdit('elements')}>
                    {canvasSlide.elements.length > 0 ? (
                        canvasSlide.elements.slice(0, 30).map(renderCanvasElement)
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p style={{ color: secondary }} className="text-sm italic">Add canvas elements in the Properties panel.</p>
                        </div>
                    )}
                </div>
                <div className="absolute top-3 left-4 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide" style={{ background: `${primary}15`, color: text }}>
                    {clamp(canvasSlide.title || 'Visual Canvas', 80)}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: primary, opacity: 0.6 }} />
            </div>
        );
    }

    return (
        <div style={containerStyle} className="flex items-center justify-center">
            <p style={{ color: secondary }}>Unknown slide type</p>
        </div>
    );
}
