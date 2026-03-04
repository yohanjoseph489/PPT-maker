'use client';

import { useEffect, useCallback, useMemo, useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import { CSS } from '@dnd-kit/utilities';
import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import {
    ArrowLeft,
    Download,
    RefreshCw,
    Loader2,
    Plus,
    Trash2,
    ChevronUp,
    ChevronDown,
    ZoomIn,
    ZoomOut,
    Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDeckStore } from '@/lib/store';
import SlidePreview from '@/components/editor/SlidePreview';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import { themes } from '@/lib/themes';
import { generateId } from '@/lib/utils';
import type { Slide } from '@/lib/schemas/deckspec';

interface SlideThumbnailProps {
    slide: Slide;
    index: number;
    total: number;
    isSelected: boolean;
    onSelect: (index: number) => void;
    theme: (typeof themes)[keyof typeof themes];
}

const SlideThumbnail = memo(function SlideThumbnail({ slide, index, total, isSelected, onSelect, theme }: SlideThumbnailProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id });

    return (
        <motion.button
            ref={setNodeRef}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
            onClick={() => onSelect(index)}
            aria-label={`Slide ${index + 1} of ${total}: ${'title' in slide ? (slide as { title: string }).title : slide.type}`}
            aria-selected={isSelected}
            {...attributes}
            {...listeners}
            className={`w-full touch-none cursor-grab active:cursor-grabbing text-left rounded-lg overflow-hidden border transition-all duration-200 bg-white ${
                isDragging
                    ? 'border-[#34c759] ring-2 ring-[#34c759]/30 shadow-md opacity-80'
                    : isSelected
                      ? 'border-[#34c759] ring-2 ring-[#34c759]/20 shadow-sm'
                      : 'border-[#0000000d] hover:border-[#0000001a] hover:shadow-sm'
            }`}
        >
            <div className="aspect-video p-2 flex flex-col justify-between" style={{ background: theme.colors.background }}>
                <p className="text-[6px] font-medium truncate leading-tight" style={{ color: theme.colors.text }}>
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
                <p className="text-[10px] text-zinc-500 font-medium">
                    {index + 1}. {slide.type}
                </p>
            </div>
        </motion.button>
    );
});

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
    const [zoom, setZoom] = useState(100);
    const [isExporting, setIsExporting] = useState(false);

    const readApiError = async (res: Response, fallback: string) => {
        try {
            const data = await res.json();
            if (data?.error && typeof data.error === 'string') return data.error;
            return fallback;
        } catch {
            return fallback;
        }
    };

    const parseFilename = (header: string | null, fallbackTitle: string) => {
        if (header) {
            const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
            if (utf8Match?.[1]) {
                return decodeURIComponent(utf8Match[1]);
            }
            const basicMatch = header.match(/filename=\"?([^\";]+)\"?/i);
            if (basicMatch?.[1]) {
                return basicMatch[1];
            }
        }
        return `${fallbackTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pptx`;
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    );
    const slideIds = useMemo(() => deckSpec?.slides.map((s) => s.id) ?? [], [deckSpec?.slides]);

    useEffect(() => {
        if (!deckSpec) {
            router.push('/create');
        }
    }, [deckSpec, router]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                toast.success('Deck saved to browser.');
                return;
            }

            if (!deckSpec) return;
            const target = e.target as HTMLElement | null;
            const tag = target?.tagName?.toLowerCase();
            const isTypingField =
                tag === 'input' ||
                tag === 'textarea' ||
                tag === 'select' ||
                target?.isContentEditable;

            if (isTypingField) return;

            if (e.key === 'ArrowUp' && selectedSlideIndex > 0) {
                e.preventDefault();
                selectSlide(selectedSlideIndex - 1);
            } else if (e.key === 'ArrowDown' && selectedSlideIndex < deckSpec.slides.length - 1) {
                e.preventDefault();
                selectSlide(selectedSlideIndex + 1);
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [deckSpec, selectedSlideIndex, selectSlide]);

    const handleExport = useCallback(async () => {
        if (!deckSpec || isExporting) return;

        setIsExporting(true);
        toast.info('Generating PPTX...');
        try {
            const res = await fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deckSpec }),
            });

            if (!res.ok) {
                const message = await readApiError(res, 'Failed to export PPTX. Please try again.');
                throw new Error(message);
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const contentDisposition = res.headers.get('content-disposition');
            const filename = parseFilename(contentDisposition, deckSpec.title);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('PPTX downloaded!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to export PPTX. Please try again.');
        } finally {
            setIsExporting(false);
        }
    }, [deckSpec, isExporting]);

    const handleRegenerateAll = useCallback(async () => {
        if (!deckSpec) return;

        setGenerating(true);
        try {
            const res = await fetch('/api/regenerate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deckSpec }),
            });

            if (!res.ok) {
                const message = await readApiError(res, 'Failed to regenerate deck. Please try again.');
                throw new Error(message);
            }
            const data = await res.json();
            setDeckSpec(data.deckSpec);
            toast.success('Deck regenerated!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to regenerate. Please try again.');
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

    const zoomOut = () => setZoom((z) => Math.max(60, z - 10));
    const zoomIn = () => setZoom((z) => Math.min(140, z + 10));
    const resetZoom = () => setZoom(100);

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            if (!deckSpec) return;
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            const fromIndex = deckSpec.slides.findIndex((s) => s.id === active.id);
            const toIndex = deckSpec.slides.findIndex((s) => s.id === over.id);
            if (fromIndex === -1 || toIndex === -1) return;

            reorderSlides(fromIndex, toIndex);
        },
        [deckSpec, reorderSlides]
    );

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
            <header className="h-14 border-b border-[#0000000d] bg-white flex items-center justify-between px-4 flex-shrink-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link
                        href="/create"
                        aria-label="Back to create page"
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
                        aria-label="Regenerate entire deck"
                        aria-busy={isGenerating}
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
                        disabled={isExporting}
                        aria-label="Download presentation as PPTX"
                        aria-busy={isExporting}
                        className="bg-[#34c759] hover:bg-[#28a745] text-white border-0 shadow-sm transition-all duration-300 rounded-lg text-xs font-semibold px-4"
                    >
                        {isExporting ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        {isExporting ? 'Exporting...' : 'Download PPTX'}
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <aside className="w-[200px] border-r border-[#0000000d] flex flex-col flex-shrink-0 bg-[#f4f7f4]">
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={slideIds} strategy={verticalListSortingStrategy}>
                                <div role="listbox" aria-label="Slides list">
                                    <AnimatePresence mode="popLayout">
                                        {deckSpec.slides.map((slide, i) => (
                                            <SlideThumbnail
                                                key={slide.id}
                                                slide={slide}
                                                index={i}
                                                total={deckSpec.slides.length}
                                                isSelected={selectedSlideIndex === i}
                                                onSelect={selectSlide}
                                                theme={theme}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>

                    <div className="border-t border-[#0000000d] bg-white p-2 flex gap-1 flex-shrink-0 justify-around">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleAddSlide} title="Add slide" aria-label="Add slide">
                            <Plus className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleMoveSlide('up')}
                            disabled={selectedSlideIndex === 0}
                            title="Move up"
                            aria-label="Move selected slide up"
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
                            aria-label="Move selected slide down"
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
                            aria-label="Delete selected slide"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </aside>

                <div className="flex-1 flex flex-col bg-[#e5e7eb]/50">
                    <div className="h-11 border-b border-[#0000000d] bg-white/75 backdrop-blur-sm px-4 flex items-center justify-between">
                        <div className="text-xs text-zinc-600 font-medium">
                            Preview · Slide {selectedSlideIndex + 1} · {currentSlide.type}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={zoomOut}
                                title="Zoom out"
                                aria-label="Zoom out"
                            >
                                <ZoomOut className="w-3.5 h-3.5" />
                            </Button>
                            <button
                                onClick={resetZoom}
                                className="h-7 min-w-[52px] px-2 rounded-md border border-[#00000014] bg-white text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50"
                                title="Reset zoom"
                                aria-label="Reset zoom"
                            >
                                {zoom}%
                            </button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={zoomIn}
                                title="Zoom in"
                                aria-label="Zoom in"
                            >
                                <ZoomIn className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={resetZoom}
                                title="Fit to 100%"
                                aria-label="Fit preview to 100%"
                            >
                                <Maximize2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-8 [background-image:radial-gradient(circle_at_1px_1px,rgba(17,24,39,0.08)_1px,transparent_0)] [background-size:18px_18px]">
                        <div className="mx-auto w-fit pt-2">
                            <motion.div
                                key={currentSlide.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                style={{
                                    transform: `scale(${zoom / 100})`,
                                    transformOrigin: 'top center',
                                }}
                                className="w-[960px] aspect-video rounded-xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] ring-1 ring-black/5 bg-white"
                            >
                                <SlidePreview slide={currentSlide} theme={theme} />
                            </motion.div>
                        </div>
                    </div>
                </div>

                <PropertiesPanel />
            </div>

            <footer className="h-8 border-t border-[#0000000d] bg-white flex items-center justify-between px-4 text-[10px] text-zinc-500 flex-shrink-0 font-medium z-10">
                <span>
                    Slide {selectedSlideIndex + 1} of {deckSpec.slides.length} · {deckSpec.themeId}
                </span>
                <span className="flex items-center gap-3">
                    <span>Ctrl/Cmd+S Save</span>
                    <span>Ctrl/Cmd+Enter Generate</span>
                </span>
            </footer>
        </div>
    );
}
