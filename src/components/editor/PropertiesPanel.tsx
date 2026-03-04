'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Loader2, Type, Palette, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useDeckStore } from '@/lib/store';
import { themes, THEME_IDS } from '@/lib/themes';
import type { Slide } from '@/lib/schemas/deckspec';

export default function PropertiesPanel() {
    const {
        deckSpec,
        selectedSlideIndex,
        updateSlide,
        setTheme,
        setTitle,
        setSubtitle,
        setDeckSpec,
    } = useDeckStore();

    const [regenInstruction, setRegenInstruction] = useState('');
    const [isRegenerating, setIsRegenerating] = useState(false);

    const currentSlide = deckSpec?.slides[selectedSlideIndex];

    const readApiError = async (res: Response, fallback: string) => {
        try {
            const data = await res.json();
            if (data?.error && typeof data.error === 'string') return data.error;
            return fallback;
        } catch {
            return fallback;
        }
    };

    const handleSlideUpdate = useCallback(
        (updates: Partial<Slide>) => {
            updateSlide(selectedSlideIndex, updates);
        },
        [selectedSlideIndex, updateSlide]
    );

    const updateLayoutHint = useCallback(
        (key: string, value: string) => {
            const hints = { ...(currentSlide?.layoutHints || {}) };
            hints[key] = value;
            handleSlideUpdate({ layoutHints: hints } as Partial<Slide>);
        },
        [currentSlide?.layoutHints, handleSlideUpdate]
    );

    const handleRegenerateSlide = useCallback(async () => {
        if (!deckSpec) return;

        setIsRegenerating(true);
        try {
            const res = await fetch('/api/regenerate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deckSpec,
                    slideIndex: selectedSlideIndex,
                    instruction: regenInstruction.trim() || undefined,
                }),
            });

            if (!res.ok) {
                const message = await readApiError(res, 'Failed to regenerate slide.');
                throw new Error(message);
            }
            const data = await res.json();
            setDeckSpec(data.deckSpec);
            setRegenInstruction('');
            toast.success('Slide regenerated!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to regenerate slide.');
        } finally {
            setIsRegenerating(false);
        }
    }, [deckSpec, selectedSlideIndex, regenInstruction, setDeckSpec]);

    if (!deckSpec || !currentSlide) return null;

    return (
        <aside className="w-[320px] border-l border-[#0000000d] flex flex-col flex-shrink-0 bg-white overflow-y-auto">
            <div className="p-4 space-y-6">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <Type className="w-3.5 h-3.5" />
                        Deck Meta
                    </Label>
                    <div className="space-y-1">
                        <Label className="text-xs">Deck Title</Label>
                        <Input
                            value={deckSpec.title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-xs bg-white border-[#0000001a] focus:border-[#34c759] h-8"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Deck Subtitle</Label>
                        <Input
                            value={deckSpec.subtitle || ''}
                            onChange={(e) => setSubtitle(e.target.value)}
                            placeholder="Optional deck subtitle"
                            className="text-xs bg-white border-[#0000001a] focus:border-[#34c759] h-8"
                        />
                    </div>
                </div>

                <div className="h-px bg-[#0000000a]" />

                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <Palette className="w-3.5 h-3.5" />
                        Theme
                    </Label>
                    <div className="grid grid-cols-3 gap-1.5">
                        {THEME_IDS.map((id) => {
                            const t = themes[id];
                            return (
                                <button
                                    key={id}
                                    onClick={() => setTheme(id)}
                                    title={t.name}
                                    className={`rounded-lg overflow-hidden border transition-all ${deckSpec.themeId === id
                                        ? 'border-[#34c759] ring-2 ring-[#34c759]/20'
                                        : 'border-[#0000001a] hover:border-black/20 hover:bg-[#f4f7f4]'
                                        }`}
                                >
                                    <div className="aspect-video flex items-end p-1" style={{ background: t.colors.background }}>
                                        <div className="h-0.5 w-full rounded-full" style={{ background: t.colors.primary }} />
                                    </div>
                                    <p className="text-[9px] py-0.5 text-center text-muted-foreground truncate">{t.name}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="h-px bg-[#0000000a]" />

                <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <Type className="w-3.5 h-3.5" />
                        Slide Content
                    </Label>

                    <div className="text-xs text-muted-foreground bg-[#f4f7f4] rounded-lg px-3 py-1.5 border border-[#0000000a]">
                        Type: <span className="text-foreground font-semibold">{currentSlide.type}</span>
                    </div>

                    {'title' in currentSlide && (
                        <div className="space-y-1">
                            <Label className="text-xs">Title</Label>
                            <Input
                                value={(currentSlide as { title: string }).title}
                                onChange={(e) => handleSlideUpdate({ title: e.target.value } as Partial<Slide>)}
                                className="text-xs bg-white border-[#0000001a] focus:border-[#34c759] h-8"
                            />
                        </div>
                    )}

                    {'subtitle' in currentSlide && currentSlide.subtitle !== undefined && (
                        <div className="space-y-1">
                            <Label className="text-xs">Subtitle</Label>
                            <Input
                                value={(currentSlide as { subtitle: string }).subtitle || ''}
                                onChange={(e) => handleSlideUpdate({ subtitle: e.target.value } as Partial<Slide>)}
                                className="text-xs bg-white border-[#0000001a] focus:border-[#34c759] h-8"
                            />
                        </div>
                    )}

                    {'bullets' in currentSlide && (
                        <div className="space-y-1">
                            <Label className="text-xs">Bullets (one per line)</Label>
                            <Textarea
                                value={(currentSlide as { bullets: string[] }).bullets.join('\n')}
                                onChange={(e) => handleSlideUpdate({ bullets: e.target.value.split('\n') } as Partial<Slide>)}
                                className="text-xs bg-white border-[#0000001a] focus:border-[#34c759] min-h-[100px] resize-none"
                            />
                        </div>
                    )}

                    {'quote' in currentSlide && (
                        <div className="space-y-1">
                            <Label className="text-xs">Quote</Label>
                            <Textarea
                                value={(currentSlide as { quote: string }).quote}
                                onChange={(e) => handleSlideUpdate({ quote: e.target.value } as Partial<Slide>)}
                                className="text-xs bg-white border-[#0000001a] focus:border-[#34c759] min-h-[80px] resize-none"
                            />
                        </div>
                    )}

                    {'attribution' in currentSlide && (
                        <div className="space-y-1">
                            <Label className="text-xs">Attribution</Label>
                            <Input
                                value={(currentSlide as { attribution?: string }).attribution || ''}
                                onChange={(e) => handleSlideUpdate({ attribution: e.target.value } as Partial<Slide>)}
                                className="text-xs bg-white border-[#0000001a] focus:border-[#34c759] h-8"
                            />
                        </div>
                    )}

                    {'left' in currentSlide && (
                        <>
                            <div className="space-y-1">
                                <Label className="text-xs">Left Column (one per line)</Label>
                                <Textarea
                                    value={(currentSlide as { left: string[] }).left.join('\n')}
                                    onChange={(e) => handleSlideUpdate({ left: e.target.value.split('\n') } as Partial<Slide>)}
                                    className="text-xs bg-white border-[#0000001a] focus:border-[#34c759] min-h-[80px] resize-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Right Column (one per line)</Label>
                                <Textarea
                                    value={(currentSlide as { right: string[] }).right.join('\n')}
                                    onChange={(e) => handleSlideUpdate({ right: e.target.value.split('\n') } as Partial<Slide>)}
                                    className="text-xs bg-white border-[#0000001a] focus:border-[#34c759] min-h-[80px] resize-none"
                                />
                            </div>
                        </>
                    )}

                    {'caption' in currentSlide && (
                        <div className="space-y-1">
                            <Label className="text-xs">Caption</Label>
                            <Input
                                value={(currentSlide as { caption: string }).caption}
                                onChange={(e) => handleSlideUpdate({ caption: e.target.value } as Partial<Slide>)}
                                className="text-xs bg-white border-[#0000001a] focus:border-[#34c759] h-8"
                            />
                        </div>
                    )}

                    {'imagePrompt' in currentSlide && (
                        <div className="space-y-1">
                            <Label className="text-xs">Image Prompt</Label>
                            <Textarea
                                value={(currentSlide as { imagePrompt: string }).imagePrompt}
                                onChange={(e) => handleSlideUpdate({ imagePrompt: e.target.value } as Partial<Slide>)}
                                className="text-xs bg-white border-[#0000001a] focus:border-[#34c759] min-h-[60px] resize-none"
                            />
                        </div>
                    )}

                    <div className="space-y-1">
                        <Label className="text-xs">Speaker Notes</Label>
                        <Textarea
                            value={currentSlide.speakerNotes || ''}
                            onChange={(e) => handleSlideUpdate({ speakerNotes: e.target.value })}
                            placeholder="Add speaker notes..."
                            className="text-xs bg-white border-[#0000001a] focus:border-[#34c759] min-h-[60px] resize-none"
                        />
                    </div>
                </div>

                <div className="h-px bg-[#0000000a]" />

                <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        Layout
                    </Label>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Text Alignment</Label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {['left', 'center'].map((value) => (
                                <button
                                    key={value}
                                    onClick={() => updateLayoutHint('align', value)}
                                    className={`h-8 rounded-md border text-xs font-medium capitalize ${currentSlide.layoutHints?.align === value
                                        ? 'border-[#34c759]/40 bg-[#34c759]/10 text-[#1d1d1f]'
                                        : 'border-[#0000001a] bg-white text-muted-foreground hover:bg-[#f4f7f4]'
                                        }`}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>
                    </div>

                    {(currentSlide.type === 'agenda' || currentSlide.type === 'bullets') && (
                        <div className="space-y-1.5">
                            <Label className="text-xs">Content Density</Label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {['comfortable', 'compact'].map((value) => (
                                    <button
                                        key={value}
                                        onClick={() => updateLayoutHint('density', value)}
                                        className={`h-8 rounded-md border text-xs font-medium capitalize ${currentSlide.layoutHints?.density === value
                                            ? 'border-[#34c759]/40 bg-[#34c759]/10 text-[#1d1d1f]'
                                            : 'border-[#0000001a] bg-white text-muted-foreground hover:bg-[#f4f7f4]'
                                            }`}
                                    >
                                        {value}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentSlide.type === 'twoColumn' && (
                        <div className="space-y-1.5">
                            <Label className="text-xs">Column Split</Label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {['50:50', '60:40', '40:60'].map((value) => (
                                    <button
                                        key={value}
                                        onClick={() => updateLayoutHint('split', value)}
                                        className={`h-8 rounded-md border text-xs font-medium ${currentSlide.layoutHints?.split === value
                                            ? 'border-[#34c759]/40 bg-[#34c759]/10 text-[#1d1d1f]'
                                            : 'border-[#0000001a] bg-white text-muted-foreground hover:bg-[#f4f7f4]'
                                            }`}
                                    >
                                        {value}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {(currentSlide.type === 'cover' || currentSlide.type === 'sectionHeader') && (
                        <div className="space-y-1.5">
                            <Label className="text-xs">Title Size</Label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {['regular', 'large'].map((value) => (
                                    <button
                                        key={value}
                                        onClick={() => updateLayoutHint('titleSize', value)}
                                        className={`h-8 rounded-md border text-xs font-medium capitalize ${currentSlide.layoutHints?.titleSize === value
                                            ? 'border-[#34c759]/40 bg-[#34c759]/10 text-[#1d1d1f]'
                                            : 'border-[#0000001a] bg-white text-muted-foreground hover:bg-[#f4f7f4]'
                                            }`}
                                    >
                                        {value}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentSlide.type === 'quote' && (
                        <div className="space-y-1.5">
                            <Label className="text-xs">Quote Emphasis</Label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {['standard', 'large'].map((value) => (
                                    <button
                                        key={value}
                                        onClick={() => updateLayoutHint('emphasis', value)}
                                        className={`h-8 rounded-md border text-xs font-medium capitalize ${currentSlide.layoutHints?.emphasis === value
                                            ? 'border-[#34c759]/40 bg-[#34c759]/10 text-[#1d1d1f]'
                                            : 'border-[#0000001a] bg-white text-muted-foreground hover:bg-[#f4f7f4]'
                                            }`}
                                    >
                                        {value}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentSlide.type === 'imageWithCaption' && (
                        <div className="space-y-1.5">
                            <Label className="text-xs">Media Position</Label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {['top', 'bottom'].map((value) => (
                                    <button
                                        key={value}
                                        onClick={() => updateLayoutHint('mediaPosition', value)}
                                        className={`h-8 rounded-md border text-xs font-medium capitalize ${currentSlide.layoutHints?.mediaPosition === value
                                            ? 'border-[#34c759]/40 bg-[#34c759]/10 text-[#1d1d1f]'
                                            : 'border-[#0000001a] bg-white text-muted-foreground hover:bg-[#f4f7f4]'
                                            }`}
                                    >
                                        {value}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-px bg-[#0000000a]" />

                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <RefreshCw className="w-3.5 h-3.5" />
                        Regenerate Slide
                    </Label>
                    <Textarea
                        value={regenInstruction}
                        onChange={(e) => setRegenInstruction(e.target.value)}
                        placeholder="e.g., Make it more punchy, add statistics, simplify..."
                        className="text-xs bg-white border-[#0000001a] focus:border-[#34c759] min-h-[60px] resize-none"
                        maxLength={500}
                    />
                    <Button
                        size="sm"
                        onClick={handleRegenerateSlide}
                        disabled={isRegenerating}
                        className="w-full bg-[#34c759] hover:bg-[#28a745] text-white text-xs border-0 shadow-sm transition-all rounded-lg h-9 font-medium"
                        variant="default"
                    >
                        {isRegenerating ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                Regenerating...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                Regenerate This Slide
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </aside>
    );
}
