'use client';

import type { Slide } from '@/lib/schemas/deckspec';
import type { ThemeDefinition } from '@/lib/themes';

interface SlidePreviewProps {
    slide: Slide;
    theme: ThemeDefinition;
    onRequestEdit?: (field: string) => void;
    /** Scale factor for the preview container (used for thumbnail vs full view). Default: 1 */
    scale?: number;
}

type DesignerCanvasSlide = Extract<Slide, { type: 'designerCanvas' }>;
type CanvasElement = DesignerCanvasSlide['elements'][number];

// ─── Text helpers ─────────────────────────────────────────────

const clamp = (value: string, max = 160) => {
    const clean = value?.trim() || '';
    if (!clean) return '';
    return clean.length > max ? `${clean.slice(0, max - 3)}...` : clean;
};

const sanitizeList = (items: string[] | undefined, maxItems: number, maxChars: number) =>
    (items || []).map((item) => clamp(item, maxChars)).filter(Boolean).slice(0, maxItems);

const toPct = (value: number) => `${Math.max(0, Math.min(100, value))}%`;

// ─── Design tokens ────────────────────────────────────────────

const gap = { xs: '2%', sm: '4%', md: '6%', lg: '8%', xl: '10%' };

// ─── Sub-components ───────────────────────────────────────────

function SlideTitle({ text, headingFont, color, size = 'md', onClick }: {
    text: string; headingFont: string; color: string; size?: 'sm' | 'md' | 'lg'; onClick?: () => void;
}) {
    const sizeMap = { sm: '1.4em', md: '1.8em', lg: '2.4em' };
    return (
        <h2
            style={{ fontFamily: headingFont, color, fontSize: sizeMap[size], fontWeight: 700, lineHeight: 1.15, marginBottom: '0.5em', wordBreak: 'break-word', cursor: onClick ? 'pointer' : 'default' }}
            onClick={onClick}
        >
            {clamp(text || 'Slide Title', 80)}
        </h2>
    );
}

function AccentBar({ color }: { color: string }) {
    return <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${color}, ${color}55)` }} />;
}

// ─── Canvas element renderer ──────────────────────────────────

function CanvasElementView({ element, theme }: { element: CanvasElement; theme: ThemeDefinition }) {
    const { primary, text, textSecondary, surface } = theme.colors;
    const { body } = theme.fonts;

    const baseStyle: React.CSSProperties = {
        position: 'absolute',
        left: toPct(element.x),
        top: toPct(element.y),
        width: toPct(element.w),
        height: toPct(element.h),
        boxSizing: 'border-box',
    };

    if (element.kind === 'text') {
        // Clamp font size to safe range (8-56px)
        const rawFs = element.style?.fontSize;
        const fontSize = rawFs !== undefined ? `${Math.max(8, Math.min(56, rawFs))}px` : '16px';
        const fwMap: Record<string, number> = { bold: 700, semibold: 600, medium: 500, normal: 400 };
        const fontWeight = element.style?.fontWeight ? fwMap[element.style.fontWeight] ?? 400 : 400;

        // Resolve color tokens (e.g. "{{primary}}" patterns passed through)
        const rawColor = element.style?.color || '';
        const resolvedColor = rawColor.startsWith('{{') ? text : (rawColor || text);

        return (
            <div
                key={element.id}
                style={{
                    ...baseStyle,
                    color: resolvedColor,
                    fontSize,
                    fontWeight,
                    textAlign: (element.style?.align as React.CSSProperties['textAlign']) || 'left',
                    fontStyle: element.style?.italic ? 'italic' : 'normal',
                    textDecoration: element.style?.underline ? 'underline' : 'none',
                    fontFamily: element.style?.fontFamily || body,
                    lineHeight: 1.25,
                    overflow: 'hidden',
                    // Prevent text from running outside its box
                    wordBreak: 'break-word',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    // Let it show as many lines as fit the height
                }}
            >
                {element.text}
            </div>
        );
    }

    if (element.kind === 'shape') {
        const rawFill = element.style?.fill || '';
        const rawStroke = element.style?.stroke || '';
        // Resolve color tokens
        const fill = rawFill.startsWith('{{') ? `${primary}15` : (rawFill || `${primary}12`);
        const stroke = rawStroke.startsWith('{{') ? primary : rawStroke;

        const bRadius = element.shape === 'circle'
            ? '9999px'
            : element.shape === 'roundedRect'
                ? '12px'
                : element.shape === 'line'
                    ? '0'
                    : '4px';

        const isLine = element.shape === 'line';

        return (
            <div
                key={element.id}
                style={{
                    ...baseStyle,
                    background: isLine ? 'transparent' : fill,
                    border: `${element.style?.strokeWidth ?? (stroke ? 1 : 0)}px solid ${stroke || 'transparent'}`,
                    borderRadius: bRadius,
                    opacity: element.style?.opacity ?? 1,
                    height: isLine ? '2px' : baseStyle.height,
                    top: isLine ? `calc(${baseStyle.top} + ${parseFloat(String(baseStyle.height)) / 2}%)` : baseStyle.top,
                }}
            />
        );
    }

    if (element.kind === 'image') {
        const hasUrl = !!element.imageUrl?.trim();
        return (
            <div
                key={element.id}
                style={{
                    ...baseStyle,
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: `1px solid ${primary}25`,
                    background: surface,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {hasUrl ? (
                    <img
                        src={element.imageUrl}
                        alt={element.prompt || 'Slide image'}
                        style={{ width: '100%', height: '100%', objectFit: element.fit === 'contain' ? 'contain' : 'cover' }}
                    />
                ) : (
                    <div style={{ padding: '6%', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5em', marginBottom: '4px', opacity: 0.4 }}>🖼</div>
                        <p style={{ color: textSecondary, fontSize: '0.7em', lineHeight: 1.3, wordBreak: 'break-word' }}>
                            {clamp(element.prompt || 'Image placeholder', 100)}
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // Chart element
    if (element.kind === 'chart') {
        const values = element.values?.slice(0, 8) || [];
        const labels = element.labels?.slice(0, 8) || [];
        const maxValue = Math.max(...values, 1);

        if (element.chartType === 'pie') {
            // Simple pie using conic-gradient
            const total = values.reduce((a, b) => a + b, 0);
            let cumulativePct = 0;
            const segments = values.map((v, i) => {
                const pct = (v / total) * 100;
                const colors = [primary, `${primary}88`, `${primary}55`, `${primary}33`];
                const color = colors[i % colors.length];
                const segment = `${color} ${cumulativePct}% ${cumulativePct + pct}%`;
                cumulativePct += pct;
                return segment;
            });

            return (
                <div key={element.id} style={{ ...baseStyle, display: 'flex', flexDirection: 'column', gap: '4%' }}>
                    <div style={{
                        width: '60%', aspectRatio: '1', borderRadius: '50%', alignSelf: 'center',
                        background: `conic-gradient(${segments.join(', ')})`,
                    }} />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px', justifyContent: 'center' }}>
                        {labels.slice(0, 4).map((l, i) => {
                            const colors = [primary, `${primary}88`, `${primary}55`, `${primary}33`];
                            return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.6em', color: textSecondary }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: colors[i % colors.length], flexShrink: 0 }} />
                                    {clamp(l, 12)}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        if (element.chartType === 'line') {
            const pts = values.map((v, i) => {
                const x = values.length > 1 ? (i / (values.length - 1)) * 100 : 50;
                const y = 100 - Math.max((v / maxValue) * 85, 5);
                return `${x},${y}`;
            }).join(' ');

            return (
                <div key={element.id} style={{ ...baseStyle, background: surface, borderRadius: '8px', border: `1px solid ${primary}20`, padding: '8px 8px 12px' }}>
                    <svg viewBox={`0 0 100 100`} preserveAspectRatio="none" style={{ width: '100%', height: '80%' }}>
                        <polyline points={pts} fill="none" stroke={primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        {values.map((v, i) => {
                            const x = values.length > 1 ? (i / (values.length - 1)) * 100 : 50;
                            const y = 100 - Math.max((v / maxValue) * 85, 5);
                            return <circle key={i} cx={x} cy={y} r="3" fill={primary} />;
                        })}
                    </svg>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '2px' }}>
                        {labels.slice(0, 6).map((l, i) => (
                            <span key={i} style={{ fontSize: '0.55em', color: textSecondary, textAlign: 'center', flex: 1 }}>{clamp(l, 8)}</span>
                        ))}
                    </div>
                </div>
            );
        }

        // Bar chart (default)
        return (
            <div key={element.id} style={{ ...baseStyle, background: surface, borderRadius: '8px', border: `1px solid ${primary}20`, padding: '8px 6px 12px' }}>
                <div style={{ height: 'calc(100% - 18px)', display: 'flex', alignItems: 'flex-end', gap: '3%' }}>
                    {values.map((value, i) => (
                        <div key={`${labels[i]}-${i}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', height: '100%', justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: '0.55em', color: textSecondary, lineHeight: 1 }}>{value}</span>
                            <div style={{ width: '100%', borderRadius: '3px 3px 0 0', height: `${Math.max((value / maxValue) * 80, 4)}%`, background: `linear-gradient(180deg, ${primary}, ${primary}cc)` }} />
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '3%', marginTop: '2px' }}>
                    {labels.map((l, i) => (
                        <span key={i} style={{ flex: 1, fontSize: '0.55em', color: textSecondary, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l}</span>
                    ))}
                </div>
            </div>
        );
    }

    return null;
}

// ─── Main component ───────────────────────────────────────────

export default function SlidePreview({ slide, theme, onRequestEdit }: SlidePreviewProps) {
    const { background: bg, text, textSecondary: secondary, primary, surface, border } = theme.colors;
    const { heading, body } = theme.fonts;
    const requestEdit = (field: string) => onRequestEdit?.(field);

    const containerStyle: React.CSSProperties = {
        background: bg,
        color: text,
        fontFamily: body,
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        // Use viewport-relative font sizing so slides scale properly
        fontSize: 'clamp(10px, 1.4vw, 18px)',
    };

    // ─── Cover ───────────────────────────────────────────────────
    if (slide.type === 'cover') {
        return (
            <div style={containerStyle}>
                {/* Decorative accent */}
                <div style={{ position: 'absolute', top: 0, right: 0, width: '35%', height: '100%', background: `linear-gradient(135deg, ${primary}08 0%, ${primary}18 100%)`, clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)' }} />

                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `0 ${gap.xl}`, paddingRight: '40%' }}>
                    <div style={{ width: '40px', height: '3px', background: primary, borderRadius: '2px', marginBottom: '1em' }} />
                    <h1 style={{ fontFamily: heading, color: text, fontSize: '2.8em', fontWeight: 800, lineHeight: 1.08, marginBottom: '0.4em', wordBreak: 'break-word', cursor: 'pointer' }} onClick={() => requestEdit('title')}>
                        {clamp(slide.title || 'Untitled', 72)}
                    </h1>
                    {slide.subtitle && (
                        <p style={{ color: secondary, fontSize: '1.15em', lineHeight: 1.5, wordBreak: 'break-word', cursor: 'pointer' }} onClick={() => requestEdit('subtitle')}>
                            {clamp(slide.subtitle, 120)}
                        </p>
                    )}
                </div>
                <AccentBar color={primary} />
            </div>
        );
    }

    // ─── Agenda / Bullets ─────────────────────────────────────────
    if (slide.type === 'agenda' || slide.type === 'bullets') {
        const bullets = sanitizeList(slide.bullets, 7, 120);
        const isAgenda = slide.type === 'agenda';

        return (
            <div style={{ ...containerStyle, display: 'flex', flexDirection: 'column', padding: `${gap.md} ${gap.lg}` }}>
                <div style={{ marginBottom: '0.8em' }}>
                    <SlideTitle text={slide.title || 'Slide Title'} headingFont={heading} color={text} onClick={() => requestEdit('title')} />
                    <div style={{ width: '36px', height: '3px', background: primary, borderRadius: '2px' }} />
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: isAgenda ? '0.5em' : '0.35em', overflow: 'hidden' }}>
                    {bullets.map((bullet, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6em', cursor: 'pointer' }} onClick={() => requestEdit('bullets')}>
                            {isAgenda ? (
                                <div style={{ minWidth: '1.6em', height: '1.6em', borderRadius: '50%', background: `${primary}18`, border: `1.5px solid ${primary}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65em', fontWeight: 700, color: primary, flexShrink: 0, marginTop: '0.05em' }}>
                                    {i + 1}
                                </div>
                            ) : (
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: primary, flexShrink: 0, marginTop: '0.45em' }} />
                            )}
                            <p style={{ fontSize: '0.95em', lineHeight: 1.5, wordBreak: 'break-word', margin: 0 }}>{bullet}</p>
                        </div>
                    ))}
                </div>
                <AccentBar color={primary} />
            </div>
        );
    }

    // ─── Two Column ───────────────────────────────────────────────
    if (slide.type === 'twoColumn') {
        const left = sanitizeList(slide.left, 6, 90);
        const right = sanitizeList(slide.right, 6, 90);

        return (
            <div style={{ ...containerStyle, display: 'flex', flexDirection: 'column', padding: `${gap.md} ${gap.lg}` }}>
                <SlideTitle text={slide.title || 'Comparison'} headingFont={heading} color={text} onClick={() => requestEdit('title')} />
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5em', overflow: 'hidden' }}>
                    {/* Left column */}
                    <div style={{ padding: '0.8em 1em', background: `${primary}06`, borderRadius: '10px', border: `1px solid ${primary}18` }}>
                        {left.map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: '0.5em', alignItems: 'flex-start', marginBottom: '0.4em', cursor: 'pointer' }} onClick={() => requestEdit('left')}>
                                <span style={{ color: primary, fontSize: '0.7em', marginTop: '0.25em', flexShrink: 0 }}>▶</span>
                                <p style={{ fontSize: '0.85em', lineHeight: 1.45, margin: 0, wordBreak: 'break-word' }}>{item}</p>
                            </div>
                        ))}
                    </div>
                    {/* Right column */}
                    <div style={{ padding: '0.8em 1em', background: `${primary}06`, borderRadius: '10px', border: `1px solid ${primary}18` }}>
                        {right.map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: '0.5em', alignItems: 'flex-start', marginBottom: '0.4em', cursor: 'pointer' }} onClick={() => requestEdit('right')}>
                                <span style={{ color: primary, fontSize: '0.7em', marginTop: '0.25em', flexShrink: 0 }}>▶</span>
                                <p style={{ fontSize: '0.85em', lineHeight: 1.45, margin: 0, wordBreak: 'break-word' }}>{item}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <AccentBar color={primary} />
            </div>
        );
    }

    // ─── Quote ───────────────────────────────────────────────────
    if (slide.type === 'quote') {
        return (
            <div style={{ ...containerStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${gap.md} ${gap.xl}`, textAlign: 'center' }}>
                <div style={{ fontSize: '4em', lineHeight: 0.8, color: primary, fontFamily: 'Georgia, serif', marginBottom: '0.2em', opacity: 0.7 }}>"</div>
                <blockquote
                    style={{ fontFamily: heading, fontSize: '1.25em', fontStyle: 'italic', lineHeight: 1.55, marginBottom: '0.8em', wordBreak: 'break-word', maxWidth: '85%', cursor: 'pointer' }}
                    onClick={() => requestEdit('quote')}
                >
                    {clamp(slide.quote || 'Add a quote.', 200)}
                </blockquote>
                {slide.attribution && (
                    <p style={{ color: secondary, fontSize: '0.85em', fontWeight: 500, cursor: 'pointer' }} onClick={() => requestEdit('attribution')}>
                        — {clamp(slide.attribution, 80)}
                    </p>
                )}
                <AccentBar color={primary} />
            </div>
        );
    }

    // ─── Chart ───────────────────────────────────────────────────
    if (slide.type === 'chart') {
        const labels = slide.labels.slice(0, 8);
        const values = slide.values.slice(0, 8);
        const maxValue = Math.max(...values, 1);
        const insights = (slide.insights || []).slice(0, 3);

        return (
            <div style={{ ...containerStyle, display: 'flex', flexDirection: 'column', padding: `${gap.md} ${gap.lg}` }}>
                <SlideTitle text={slide.title || 'Data Overview'} headingFont={heading} color={text} onClick={() => requestEdit('title')} />

                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: insights.length ? '1fr auto' : '1fr', gap: '1em', minHeight: 0 }}>
                    {/* Chart area */}
                    <div
                        onClick={() => requestEdit('values')}
                        style={{ background: surface, borderRadius: '12px', border: `1px solid ${border}`, padding: '1em', display: 'flex', flexDirection: 'column', cursor: 'pointer', minHeight: 0, overflow: 'hidden' }}
                    >
                        {slide.chartType === 'pie' ? (
                            // Pie chart using conic gradient
                            (() => {
                                const total = values.reduce((a, b) => a + b, 0);
                                let cumulativePct = 0;
                                const segments = values.map((v, i) => {
                                    const pct = (v / total) * 100;
                                    const palette = [primary, `${primary}99`, `${primary}66`, `${primary}44`, `${primary}22`];
                                    const seg = `${palette[i % palette.length]} ${cumulativePct}% ${cumulativePct + pct}%`;
                                    cumulativePct += pct;
                                    return seg;
                                });
                                return (
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5em' }}>
                                        <div style={{ width: '65%', maxHeight: '70%', aspectRatio: '1', borderRadius: '50%', background: `conic-gradient(${segments.join(', ')})` }} />
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 12px', justifyContent: 'center' }}>
                                            {labels.map((l, i) => {
                                                const palette = [primary, `${primary}99`, `${primary}66`, `${primary}44`];
                                                return (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65em', color: secondary }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: palette[i % palette.length], flexShrink: 0 }} />
                                                        {clamp(l, 14)}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()
                        ) : slide.chartType === 'line' ? (
                            (() => {
                                const pts = values.map((v, i) => {
                                    const x = values.length > 1 ? (i / (values.length - 1)) * 100 : 50;
                                    const y = 95 - Math.max((v / maxValue) * 80, 5);
                                    return `${x},${y}`;
                                }).join(' ');
                                return (
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ flex: 1 }}>
                                            <defs>
                                                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={primary} stopOpacity="0.2" />
                                                    <stop offset="100%" stopColor={primary} stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            <polyline points={`${pts} 100,100 0,100`} fill="url(#lineGrad)" />
                                            <polyline points={pts} fill="none" stroke={primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                            {values.map((v, i) => {
                                                const x = values.length > 1 ? (i / (values.length - 1)) * 100 : 50;
                                                const y = 95 - Math.max((v / maxValue) * 80, 5);
                                                return <circle key={i} cx={x} cy={y} r="3.5" fill={primary} />;
                                            })}
                                        </svg>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            {labels.map((l, i) => (
                                                <span key={i} style={{ fontSize: '0.6em', color: secondary, textAlign: 'center', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l}</span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()
                        ) : (
                            // Bar chart
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '3%' }}>
                                    {values.map((value, i) => (
                                        <div key={`${labels[i]}-${i}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', height: '100%', justifyContent: 'flex-end' }}>
                                            <span style={{ fontSize: '0.6em', color: secondary }}>{value}</span>
                                            <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${Math.max((value / maxValue) * 80, 4)}%`, background: `linear-gradient(180deg, ${primary}, ${primary}bb)`, transition: 'height 0.3s ease' }} />
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '3%' }}>
                                    {labels.map((l, i) => (
                                        <span key={i} style={{ flex: 1, fontSize: '0.6em', color: secondary, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clamp(l, 14)}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Insights panel */}
                    {insights.length > 0 && (
                        <div style={{ width: '28%', minWidth: '80px', display: 'flex', flexDirection: 'column', gap: '0.4em' }}>
                            {insights.map((insight, i) => (
                                <div key={i} style={{ padding: '0.5em 0.6em', background: i === 0 ? primary : `${primary}12`, borderRadius: '8px', fontSize: '0.65em', lineHeight: 1.4, color: i === 0 ? (theme.isDark ? text : '#fff') : text, fontWeight: i === 0 ? 600 : 400 }}>
                                    {insight}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <AccentBar color={primary} />
            </div>
        );
    }

    // ─── Image with Caption ───────────────────────────────────────
    if (slide.type === 'imageWithCaption') {
        const imageUrl = slide.imageUrl?.trim() || '';
        return (
            <div style={{ ...containerStyle, display: 'flex', flexDirection: 'column', padding: `${gap.md} ${gap.lg}` }}>
                {slide.title && (
                    <SlideTitle text={slide.title} headingFont={heading} color={text} size="sm" onClick={() => requestEdit('title')} />
                )}
                <div
                    onClick={() => requestEdit('imagePrompt')}
                    style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: `1px solid ${primary}25`, background: surface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '0.5em' }}
                >
                    {imageUrl ? (
                        <img src={imageUrl} alt={slide.caption || 'Slide image'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ textAlign: 'center', padding: '10%' }}>
                            <div style={{ fontSize: '2.5em', marginBottom: '0.3em', opacity: 0.4 }}>🖼</div>
                            <p style={{ color: secondary, fontSize: '0.75em', fontStyle: 'italic', lineHeight: 1.4, wordBreak: 'break-word' }}>
                                {clamp(slide.imagePrompt || 'No image prompt', 140)}
                            </p>
                        </div>
                    )}
                </div>
                <p style={{ fontSize: '0.8em', color: secondary, textAlign: 'center', cursor: 'pointer' }} onClick={() => requestEdit('caption')}>
                    {clamp(slide.caption || 'Caption', 120)}
                </p>
                <AccentBar color={primary} />
            </div>
        );
    }

    // ─── Section Header ───────────────────────────────────────────
    if (slide.type === 'sectionHeader') {
        return (
            <div style={{ ...containerStyle, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `0 ${gap.xl}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6em', marginBottom: '0.8em' }}>
                    <div style={{ width: '4px', height: '2.5em', background: primary, borderRadius: '2px' }} />
                    <div style={{ width: '30px', height: '2px', background: `${primary}55`, borderRadius: '2px' }} />
                </div>
                <h2
                    style={{ fontFamily: heading, color: text, fontSize: '2.6em', fontWeight: 800, lineHeight: 1.1, marginBottom: '0.35em', wordBreak: 'break-word', cursor: 'pointer' }}
                    onClick={() => requestEdit('title')}
                >
                    {clamp(slide.title || 'Section', 60)}
                </h2>
                {slide.subtitle && (
                    <p style={{ color: secondary, fontSize: '1.05em', lineHeight: 1.5, cursor: 'pointer' }} onClick={() => requestEdit('subtitle')}>
                        {clamp(slide.subtitle, 120)}
                    </p>
                )}
                <AccentBar color={primary} />
            </div>
        );
    }

    // ─── Designer Canvas ──────────────────────────────────────────
    if (slide.type === 'designerCanvas') {
        const canvasSlide = slide as DesignerCanvasSlide;
        return (
            <div style={{ ...containerStyle, background: canvasSlide.background || bg }}>
                {/* Render all canvas elements in absolute positioning */}
                <div style={{ position: 'absolute', inset: 0 }} onClick={() => requestEdit('elements')}>
                    {canvasSlide.elements.length > 0 ? (
                        canvasSlide.elements.slice(0, 10).map((element) => (
                            <CanvasElementView key={element.id} element={element} theme={theme} />
                        ))
                    ) : (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p style={{ color: secondary, fontSize: '0.85em', fontStyle: 'italic' }}>Add canvas elements in the Properties panel.</p>
                        </div>
                    )}
                </div>

                {/* Slide type badge */}
                <div style={{
                    position: 'absolute', top: '6px', right: '8px',
                    padding: '2px 8px', borderRadius: '999px',
                    background: `${primary}15`, color: secondary,
                    fontSize: '0.55em', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                    pointerEvents: 'none',
                }}>
                    Canvas
                </div>
                <AccentBar color={primary} />
            </div>
        );
    }

    // ─── Fallback ─────────────────────────────────────────────────
    return (
        <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: secondary }}>Unknown slide type: {(slide as any).type}</p>
        </div>
    );
}
