'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import {
    ArrowLeft,
    Download,
    RefreshCw,
    Loader2,
    Plus,
    Trash2,
    ChevronUp,
    ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDeckStore } from '@/lib/store';
import SlidePreview from '@/components/editor/SlidePreview';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import { themes } from '@/lib/themes';
import { generateId } from '@/lib/utils';
import type { Slide } from '@/lib/schemas/deckspec';

export default function EditorPage() {
    const router = useRouter();
    const {
        deckSpec,
        selectedSlideIndex,
        selectSlide,
        reorderSlides,
        removeSlide,
        addSlide,
        isGenerating,
        setGenerating,
        setDeckSpec,
    } = useDeckStore();

    // Redirect if no deck
    useEffect(() => {
        if (!deckSpec) {
            router.push('/create');
        }
    }, [deckSpec, router]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                toast.success('Deck saved to browser.');
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    const handleExport = useCallback(async () => {
        if (!deckSpec) return;

        toast.info('Generating PPTX...');
        try {
            const res = await fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deckSpec }),
            });

            if (!res.ok) throw new Error('Export failed');

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${deckSpec.title.replace(/[^a-zA-Z0-9]/g, '_')}.pptx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('PPTX downloaded!');
        } catch {
            toast.error('Failed to export PPTX. Please try again.');
        }
    }, [deckSpec]);

    const handleRegenerateAll = useCallback(async () => {
        if (!deckSpec) return;

        setGenerating(true);
        try {
            const res = await fetch('/api/regenerate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deckSpec }),
            });

            if (!res.ok) throw new Error('Regeneration failed');
            const data = await res.json();
            setDeckSpec(data.deckSpec);
            toast.success('Deck regenerated!');
        } catch {
            toast.error('Failed to regenerate. Please try again.');
        } finally {
            setGenerating(false);
        }
    }, [deckSpec, setDeckSpec, setGenerating]);

    const handleAddSlide = () => {
        if (!deckSpec) return;
        const newSlide: Slide = {
            id: generateId(),
            type: 'bullets',
            title: 'New Slide',
            bullets: ['Click to edit this bullet point'],
        };
        addSlide(newSlide);
        toast.success('Slide added.');
    };

    const handleMoveSlide = (direction: 'up' | 'down') => {
        if (!deckSpec) return;
        const newIndex = direction === 'up' ? selectedSlideIndex - 1 : selectedSlideIndex + 1;
        if (newIndex < 0 || newIndex >= deckSpec.slides.length) return;
        reorderSlides(selectedSlideIndex, newIndex);
    };

    if (!deckSpec) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const currentSlide = deckSpec.slides[selectedSlideIndex];
    const theme = themes[deckSpec.themeId];

    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden">
            {/* ─── Top Bar ─────────────────────────────── */}
            <header className="h-14 border-b border-[#0000000d] bg-white flex items-center justify-between px-4 flex-shrink-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link
                        href="/create"
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div className="w-px h-5 bg-white/10" />
                    <h1 className="text-sm font-semibold truncate max-w-[300px]">{deckSpec.title}</h1>
                    <span className="text-xs text-[#86868b] bg-[#f4f7f4] px-2 py-0.5 rounded-full border border-[#0000000d] font-medium">
                        {deckSpec.slides.length} slides
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerateAll}
                        disabled={isGenerating}
                        className="bg-white border-[#0000001a] hover:bg-[#f4f7f4] text-xs font-medium text-[#1d1d1f]"
                    >
                        {isGenerating ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Regenerate All
                    </Button>

                    <Button
                        size="sm"
                        onClick={handleExport}
                        className="bg-[#34c759] hover:bg-[#28a745] text-white border-0 shadow-sm transition-all duration-300 rounded-lg text-xs font-semibold px-4"
                    >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Download PPTX
                    </Button>
                </div>
            </header>

            {/* ─── Main Area ───────────────────────────── */}
            <div className="flex-1 flex overflow-hidden">
                {/* ─── Left: Slide Thumbnails ────────────── */}
                <aside className="w-[200px] border-r border-[#0000000d] flex flex-col flex-shrink-0 bg-[#f4f7f4]">
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        <AnimatePresence mode="popLayout">
                            {deckSpec.slides.map((slide, i) => (
                                <motion.button
                                    key={slide.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    onClick={() => selectSlide(i)}
                                    className={`w-full text-left rounded-lg overflow-hidden border transition-all duration-200 bg-white ${selectedSlideIndex === i
                                        ? 'border-[#34c759] ring-2 ring-[#34c759]/20 shadow-sm'
                                        : 'border-[#0000000d] hover:border-[#0000001a] hover:shadow-sm'
                                        }`}
                                >
                                    <div
                                        className="aspect-video p-2 flex flex-col justify-between"
                                        style={{ background: theme.colors.background }}
                                    >
                                        <p
                                            className="text-[6px] font-medium truncate leading-tight"
                                            style={{ color: theme.colors.text }}
                                        >
                                            {'title' in slide ? (slide as { title: string }).title : slide.type}
                                        </p>
                                        <div className="flex gap-0.5 mt-auto">
                                            {[...Array(3)].map((_, j) => (
                                                <div
                                                    key={j}
                                                    className="h-[2px] flex-1 rounded-full"
                                                    style={{ background: theme.colors.text, opacity: 0.15 }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="px-2 py-1 bg-[#f4f7f4] border-t border-[#0000000a]">
                                        <p className="text-[10px] text-zinc-500 font-medium">{i + 1}. {slide.type}</p>
                                    </div>
                                </motion.button>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Thumbnail controls */}
                    <div className="border-t border-[#0000000d] bg-white p-2 flex gap-1 flex-shrink-0 justify-around">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleAddSlide}
                            title="Add slide"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleMoveSlide('up')}
                            disabled={selectedSlideIndex === 0}
                            title="Move up"
                        >
                            <ChevronUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleMoveSlide('down')}
                            disabled={selectedSlideIndex === deckSpec.slides.length - 1}
                            title="Move down"
                        >
                            <ChevronDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => {
                                removeSlide(selectedSlideIndex);
                                toast.info('Slide removed.');
                            }}
                            disabled={deckSpec.slides.length <= 1}
                            title="Delete slide"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </aside>

                {/* ─── Center: Slide Preview ─────────────── */}
                <div className="flex-1 flex items-center justify-center p-8 bg-[#e5e7eb]/50">
                    <motion.div
                        key={currentSlide.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] ring-1 ring-black/5"
                    >
                        <SlidePreview slide={currentSlide} theme={theme} />
                    </motion.div>
                </div>

                {/* ─── Right: Properties Panel ───────────── */}
                <PropertiesPanel />
            </div>

            {/* ─── Status Bar ──────────────────────────── */}
            <footer className="h-8 border-t border-[#0000000d] bg-white flex items-center justify-between px-4 text-[10px] text-zinc-500 flex-shrink-0 font-medium z-10">
                <span>
                    Slide {selectedSlideIndex + 1} of {deckSpec.slides.length} · {deckSpec.themeId}
                </span>
                <span className="flex items-center gap-3">
                    <span>⌘+S Save</span>
                    <span>⌘+Enter Generate</span>
                </span>
            </footer>
        </div>
    );
}
