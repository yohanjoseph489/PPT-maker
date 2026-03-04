'use client';

import type { Slide } from '@/lib/schemas/deckspec';
import type { ThemeDefinition } from '@/lib/themes';

interface SlidePreviewProps {
    slide: Slide;
    theme: ThemeDefinition;
}

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

    switch (slide.type) {
        case 'cover':
            return (
                <div style={containerStyle} className="flex flex-col justify-center px-[8%]">
                    {/* Accent bar */}
                    <div
                        className="absolute left-[6%] top-[35%] w-1 h-[20%] rounded-full"
                        style={{ background: primary }}
                    />
                    <h1
                        style={{ fontFamily: heading, color: text }}
                        className="text-4xl lg:text-5xl font-bold leading-tight mb-3 pl-6"
                    >
                        {slide.title}
                    </h1>
                    {slide.subtitle && (
                        <p
                            style={{ color: secondary }}
                            className="text-xl lg:text-2xl pl-6"
                        >
                            {slide.subtitle}
                        </p>
                    )}
                    {/* Bottom accent */}
                    <div
                        className="absolute bottom-0 left-0 right-0 h-1"
                        style={{ background: `linear-gradient(90deg, ${primary}, transparent)` }}
                    />
                </div>
            );

        case 'agenda':
        case 'bullets':
            return (
                <div style={containerStyle} className="flex flex-col px-[8%] py-[6%]">
                    <h2
                        style={{ fontFamily: heading }}
                        className="text-2xl lg:text-3xl font-bold mb-6"
                    >
                        {slide.title}
                    </h2>
                    <div className="space-y-3 flex-1">
                        {slide.bullets.map((bullet, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div
                                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                    style={{ background: primary }}
                                />
                                <p style={{ color: text }} className="text-base lg:text-lg leading-relaxed">
                                    {bullet}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ background: primary, opacity: 0.6 }}
                    />
                </div>
            );

        case 'twoColumn':
            return (
                <div style={containerStyle} className="flex flex-col px-[8%] py-[6%]">
                    <h2
                        style={{ fontFamily: heading }}
                        className="text-2xl lg:text-3xl font-bold mb-6"
                    >
                        {slide.title}
                    </h2>
                    <div className="flex-1 grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            {slide.left.map((item, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <div
                                        className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                                        style={{ background: primary }}
                                    />
                                    <p style={{ color: text }} className="text-sm lg:text-base">{item}</p>
                                </div>
                            ))}
                        </div>
                        <div
                            className="space-y-2 pl-6"
                            style={{ borderLeft: `2px solid ${primary}20` }}
                        >
                            {slide.right.map((item, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <div
                                        className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                                        style={{ background: primary, opacity: 0.7 }}
                                    />
                                    <p style={{ color: text }} className="text-sm lg:text-base">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ background: primary, opacity: 0.6 }}
                    />
                </div>
            );

        case 'quote':
            return (
                <div style={containerStyle} className="flex flex-col items-center justify-center px-[12%] text-center">
                    <span
                        style={{ color: primary }}
                        className="text-7xl font-serif leading-none mb-2"
                    >
                        &ldquo;
                    </span>
                    <blockquote
                        style={{ fontFamily: heading, color: text }}
                        className="text-xl lg:text-2xl italic leading-relaxed mb-4"
                    >
                        {slide.quote}
                    </blockquote>
                    {slide.attribution && (
                        <p style={{ color: secondary }} className="text-base">
                            — {slide.attribution}
                        </p>
                    )}
                    <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ background: primary, opacity: 0.6 }}
                    />
                </div>
            );

        case 'imageWithCaption':
            return (
                <div style={containerStyle} className="flex flex-col px-[8%] py-[6%]">
                    {slide.title && (
                        <h2
                            style={{ fontFamily: heading }}
                            className="text-xl lg:text-2xl font-bold mb-4"
                        >
                            {slide.title}
                        </h2>
                    )}
                    <div
                        className="flex-1 rounded-lg flex items-center justify-center"
                        style={{
                            background: surface,
                            border: `1px solid ${primary}30`,
                        }}
                    >
                        <p style={{ color: secondary }} className="text-sm italic px-4 text-center">
                            [{slide.imagePrompt}]
                        </p>
                    </div>
                    <p
                        style={{ color: text }}
                        className="text-center text-sm mt-3"
                    >
                        {slide.caption}
                    </p>
                    <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ background: primary, opacity: 0.6 }}
                    />
                </div>
            );

        case 'sectionHeader':
            return (
                <div style={containerStyle} className="flex flex-col items-center justify-center px-[8%]">
                    <div
                        className="w-16 h-0.5 mb-6 rounded-full"
                        style={{ background: primary }}
                    />
                    <h2
                        style={{ fontFamily: heading }}
                        className="text-3xl lg:text-4xl font-bold text-center mb-3"
                    >
                        {slide.title}
                    </h2>
                    {slide.subtitle && (
                        <p
                            style={{ color: secondary }}
                            className="text-lg text-center"
                        >
                            {slide.subtitle}
                        </p>
                    )}
                    <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ background: primary, opacity: 0.6 }}
                    />
                </div>
            );

        default:
            return (
                <div style={containerStyle} className="flex items-center justify-center">
                    <p style={{ color: secondary }}>Unknown slide type</p>
                </div>
            );
    }
}
