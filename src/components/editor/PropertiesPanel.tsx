'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
    RefreshCw,
    Loader2,
    Type,
    Palette,
    SlidersHorizontal,
    Upload,
    X,
    Layers,
    Plus,
    Square,
    ImagePlus,
    BarChart3,
    Copy,
    Trash2,
    BringToFront,
    SendToBack,
    ChevronUp,
    ChevronDown,
    MoveHorizontal,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Circle,
    Minus,
    CornerUpLeft,
    Lock,
    Unlock,
    LayoutGrid,
    Sliders,
    Monitor,
    Sparkles,
    ChevronRight,
    ChevronLeft,
    type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDeckStore } from '@/lib/store';
import { themes, THEME_IDS } from '@/lib/themes';
import type { Slide } from '@/lib/schemas/deckspec';
import {
    FONT_FAMILY_OPTIONS,
    clampCanvasBounds,
    type CanvasElement,
    type CanvasElementKind,
    type LayerDirection,
} from '@/lib/canvas-editor';

interface PropertiesPanelProps {
    selectedCanvasElementId: string | null;
    onSelectCanvasElement: (elementId: string | null) => void;
    onAddCanvasElement: (kind: CanvasElementKind) => void;
    onDuplicateCanvasElement: () => void;
    onDeleteCanvasElement: () => void;
    onMoveCanvasElementLayer: (direction: LayerDirection) => void;
    onUpdateSelectedCanvasElement: (updater: (element: CanvasElement) => CanvasElement) => void;
}

type PanelTab = 'element' | 'slide' | 'design';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const parseNumber = (raw: string, fallback: number, min: number, max: number) => {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return fallback;
    return clamp(parsed, min, max);
};

const colorValue = (input: string | undefined, fallback: string) =>
    /^#[0-9a-f]{6}$/i.test((input || '').trim()) ? (input as string) : fallback;

// Mini color swatch picker
const COLOR_SWATCHES = [
    '#ffffff', '#000000', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
    '#f8fafc', '#1e293b', '#fca5a5', '#fed7aa', '#fef08a',
    '#bbf7d0', '#bfdbfe', '#ddd6fe', '#fbcfe8', '#99f6e4',
];

function ColorPicker({ value, onChange, label }: { value: string; onChange: (c: string) => void; label: string }) {
    const [open, setOpen] = useState(false);
    const [hex, setHex] = useState(value || '#000000');

    useEffect(() => {
        setHex(value || '#000000');
    }, [value]);

    return (
        <div className="relative">
            <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1 block">{label}</Label>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 w-full h-8 px-2 rounded-md border border-zinc-200 hover:border-zinc-300 bg-white transition-colors"
                title={value}
            >
                <span className="w-4 h-4 rounded-sm border border-black/10 flex-shrink-0" style={{ background: hex }} />
                <span className="text-[11px] font-mono text-zinc-600 flex-1 text-left">{hex.toUpperCase()}</span>
            </button>
            {open && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-zinc-200 rounded-xl shadow-2xl p-3 w-[200px]">
                    <div className="grid grid-cols-5 gap-1.5 mb-2.5">
                        {COLOR_SWATCHES.map((sw) => (
                            <button
                                key={sw}
                                onClick={() => { onChange(sw); setHex(sw); setOpen(false); }}
                                className="w-7 h-7 rounded-md border-2 transition-transform hover:scale-110"
                                style={{
                                    background: sw,
                                    borderColor: sw === value ? '#6366f1' : 'rgba(0,0,0,0.1)',
                                }}
                                title={sw}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={hex}
                            onChange={(e) => setHex(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                        />
                        <input
                            type="text"
                            value={hex}
                            maxLength={7}
                            onChange={(e) => {
                                const v = e.target.value;
                                setHex(v);
                                if (/^#[0-9a-f]{6}$/i.test(v)) onChange(v);
                            }}
                            className="flex-1 h-7 text-[11px] font-mono border border-zinc-200 rounded px-2 outline-none focus:border-indigo-400"
                        />
                        <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-700"><X size={12} /></button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Section wrapper
function Section({ title, icon: Icon, children, defaultOpen = true }: { title: string; icon?: LucideIcon; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-zinc-100 last:border-0">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    {Icon && <Icon size={12} className="text-zinc-400" />}
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{title}</span>
                </div>
                {open ? <ChevronDown size={12} className="text-zinc-400" /> : <ChevronRight size={12} className="text-zinc-400" />}
            </button>
            {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
        </div>
    );
}

// Number input with label
function NumInput({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
    const [raw, setRaw] = useState(String(Math.round(value)));
    useEffect(() => setRaw(String(Math.round(value))), [value]);
    return (
        <div className="flex flex-col gap-1">
            <Label className="text-[9px] uppercase tracking-wide text-zinc-400">{label}</Label>
            <input
                type="number"
                value={raw}
                min={min}
                max={max}
                step={step}
                onChange={(e) => setRaw(e.target.value)}
                onBlur={() => onChange(parseNumber(raw, value, min, max))}
                onKeyDown={(e) => e.key === 'Enter' && onChange(parseNumber(raw, value, min, max))}
                className="h-7 w-full rounded-md border border-zinc-200 bg-white px-2 text-[11px] font-mono text-zinc-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition"
            />
        </div>
    );
}

// Toggle button group
function ToggleGroup({ options, value, onChange }: { options: { value: string; icon: React.ReactNode; label: string }[]; value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex gap-0.5 bg-zinc-100 rounded-lg p-0.5">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    title={opt.label}
                    className={`flex-1 h-7 flex items-center justify-center rounded-md text-xs transition-all ${value === opt.value ? 'bg-white shadow text-zinc-800 font-medium' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                    {opt.icon}
                </button>
            ))}
        </div>
    );
}

export default function PropertiesPanel({
    selectedCanvasElementId,
    onSelectCanvasElement,
    onAddCanvasElement,
    onDuplicateCanvasElement,
    onDeleteCanvasElement,
    onMoveCanvasElementLayer,
    onUpdateSelectedCanvasElement,
}: PropertiesPanelProps) {
    const {
        deckSpec,
        selectedSlideIndex,
        updateSlide,
        setTheme,
        setTitle,
        setSubtitle,
        setDeckSpec,
        activeEditField,
        setActiveEditField,
        pushHistory,
    } = useDeckStore();

    const [activeTab, setActiveTab] = useState<PanelTab>('element');
    const [regenInstruction, setRegenInstruction] = useState('');
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [imageDataInput, setImageDataInput] = useState('');

    const currentSlide = deckSpec?.slides[selectedSlideIndex];
    const currentTheme = deckSpec ? themes[deckSpec.themeId] : null;
    const currentCanvasSlide = currentSlide?.type === 'designerCanvas' ? currentSlide : null;
    const selectedCanvasElement =
        currentCanvasSlide?.elements.find((element) => element.id === selectedCanvasElementId) || null;

    const titleInputRef = useRef<HTMLInputElement>(null);
    const subtitleInputRef = useRef<HTMLInputElement>(null);
    const bulletsTextareaRef = useRef<HTMLTextAreaElement>(null);
    const quoteTextareaRef = useRef<HTMLTextAreaElement>(null);
    const attributionInputRef = useRef<HTMLInputElement>(null);
    const leftTextareaRef = useRef<HTMLTextAreaElement>(null);
    const rightTextareaRef = useRef<HTMLTextAreaElement>(null);
    const captionInputRef = useRef<HTMLInputElement>(null);
    const imagePromptTextareaRef = useRef<HTMLTextAreaElement>(null);
    const chartLabelsTextareaRef = useRef<HTMLTextAreaElement>(null);
    const chartValuesTextareaRef = useRef<HTMLTextAreaElement>(null);
    const imageUploadInputRef = useRef<HTMLInputElement>(null);
    const canvasImageUploadRef = useRef<HTMLInputElement>(null);

    const fontFamilyOptions = useMemo(() => {
        const base = new Set<string>(FONT_FAMILY_OPTIONS);
        if (deckSpec) {
            base.add(themes[deckSpec.themeId].fonts.body);
            base.add(themes[deckSpec.themeId].fonts.heading);
        }
        if (selectedCanvasElement?.kind === 'text' && selectedCanvasElement.style?.fontFamily?.trim()) {
            base.add(selectedCanvasElement.style.fontFamily.trim());
        }
        return [...base];
    }, [deckSpec, selectedCanvasElement]);

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
            toast.success('Slide regenerated.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to regenerate slide.');
        } finally {
            setIsRegenerating(false);
        }
    }, [deckSpec, regenInstruction, selectedSlideIndex, setDeckSpec]);

    const handleImageUpload = useCallback(
        (file: File) => {
            if (!file.type.startsWith('image/')) { toast.error('Please upload a valid image file.'); return; }
            if (file.size > 8 * 1024 * 1024) { toast.error('Image size must be under 8MB.'); return; }
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = typeof reader.result === 'string' ? reader.result : '';
                if (!dataUrl) { toast.error('Failed to read image file.'); return; }
                handleSlideUpdate({ imageUrl: dataUrl } as Partial<Slide>);
                toast.success('Image uploaded.');
            };
            reader.onerror = () => toast.error('Could not process image.');
            reader.readAsDataURL(file);
        },
        [handleSlideUpdate]
    );

    const handleCanvasImageUpload = useCallback(
        (file: File) => {
            if (!selectedCanvasElement || selectedCanvasElement.kind !== 'image') return;
            if (!file.type.startsWith('image/')) { toast.error('Please upload a valid image file.'); return; }
            if (file.size > 8 * 1024 * 1024) { toast.error('Image size must be under 8MB.'); return; }
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = typeof reader.result === 'string' ? reader.result : '';
                if (!dataUrl) { toast.error('Failed to read image file.'); return; }
                onUpdateSelectedCanvasElement((element) =>
                    element.kind === 'image' ? { ...element, imageUrl: dataUrl } : element
                );
                setImageDataInput(dataUrl);
                toast.success('Element image updated.');
            };
            reader.onerror = () => toast.error('Could not process image.');
            reader.readAsDataURL(file);
        },
        [onUpdateSelectedCanvasElement, selectedCanvasElement]
    );

    const updateSelectedElementBounds = useCallback(
        (field: 'x' | 'y' | 'w' | 'h', value: number) => {
            if (!selectedCanvasElement) return;
            onUpdateSelectedCanvasElement((element) => {
                let x = element.x, y = element.y, w = element.w, h = element.h;
                if (field === 'x') x = value;
                if (field === 'y') y = value;
                if (field === 'w') w = value;
                if (field === 'h') h = value;
                return { ...element, ...clampCanvasBounds(x, y, w, h) };
            });
        },
        [onUpdateSelectedCanvasElement, selectedCanvasElement]
    );

    const updateTextStyle = useCallback(
        (updates: Record<string, unknown>) => {
            onUpdateSelectedCanvasElement((element) =>
                element.kind === 'text' ? { ...element, style: { ...element.style, ...updates } } : element
            );
        },
        [onUpdateSelectedCanvasElement]
    );

    const updateShapeStyle = useCallback(
        (updates: Record<string, unknown>) => {
            onUpdateSelectedCanvasElement((element) =>
                element.kind === 'shape' ? { ...element, style: { ...element.style, ...updates } } : element
            );
        },
        [onUpdateSelectedCanvasElement]
    );

    useEffect(() => {
        if (selectedCanvasElement?.kind === 'image') {
            setImageDataInput(selectedCanvasElement.imageUrl || '');
            return;
        }
        setImageDataInput('');
    }, [selectedCanvasElement]);

    useEffect(() => {
        if (!activeEditField) return;
        const refMap: Record<string, React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>> = {
            title: titleInputRef,
            subtitle: subtitleInputRef,
            bullets: bulletsTextareaRef,
            quote: quoteTextareaRef,
            attribution: attributionInputRef,
            left: leftTextareaRef,
            right: rightTextareaRef,
            caption: captionInputRef,
            imagePrompt: imagePromptTextareaRef,
            labels: chartLabelsTextareaRef,
            values: chartValuesTextareaRef,
        };
        const target = refMap[activeEditField]?.current;
        if (target) {
            target.focus();
            if ('select' in target && typeof target.select === 'function') target.select();
        }
        setActiveEditField(null);
    }, [activeEditField, selectedSlideIndex, setActiveEditField]);

    if (!deckSpec || !currentSlide) return null;

    const isCanvas = currentSlide.type === 'designerCanvas';

    // --- Tab Bar ---
    const tabs: { id: PanelTab; label: string; icon: LucideIcon }[] = [
        { id: 'element', label: 'Element', icon: Sliders },
        { id: 'slide', label: 'Slide', icon: Monitor },
        { id: 'design', label: 'Design', icon: Palette },
    ];

    return (
        <aside className="w-[280px] flex-shrink-0 border-l border-zinc-200 bg-white flex flex-col overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-zinc-100 bg-zinc-50/80">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-all border-b-2 ${activeTab === tab.id
                            ? 'text-indigo-600 border-indigo-500 bg-white'
                            : 'text-zinc-500 border-transparent hover:text-zinc-700 hover:bg-white/60'
                            }`}
                    >
                        <tab.icon size={12} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto">

                {/* ═══ ELEMENT TAB ═══ */}
                {activeTab === 'element' && (
                    <div>
                        {/* Add element buttons (for canvas slides) */}
                        {isCanvas && (
                            <Section title="Add Element" icon={Plus} defaultOpen={!selectedCanvasElement}>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { kind: 'text' as CanvasElementKind, icon: Type, label: 'Text' },
                                        { kind: 'shape' as CanvasElementKind, icon: Square, label: 'Shape' },
                                        { kind: 'image' as CanvasElementKind, icon: ImagePlus, label: 'Image' },
                                        { kind: 'chart' as CanvasElementKind, icon: BarChart3, label: 'Chart' },
                                    ].map(({ kind, icon: Icon, label }) => (
                                        <button
                                            key={kind}
                                            onClick={() => onAddCanvasElement(kind)}
                                            className="flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 border-dashed border-zinc-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-zinc-500 hover:text-indigo-600 transition-all group"
                                        >
                                            <Icon size={18} className="transition-transform group-hover:scale-110" />
                                            <span className="text-[11px] font-medium">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </Section>
                        )}

                        {/* Selected element controls */}
                        {isCanvas && selectedCanvasElement ? (
                            <>
                                {/* Element actions */}
                                <Section title="Actions" icon={Layers}>
                                    <div className="grid grid-cols-4 gap-1">
                                        {[
                                            { action: () => onDuplicateCanvasElement(), icon: Copy, label: 'Duplicate', title: 'Duplicate (Ctrl+D)' },
                                            { action: () => onDeleteCanvasElement(), icon: Trash2, label: 'Delete', title: 'Delete (Del)' },
                                            { action: () => onMoveCanvasElementLayer('front'), icon: BringToFront, label: 'Front', title: 'Bring to Front' },
                                            { action: () => onMoveCanvasElementLayer('back'), icon: SendToBack, label: 'Back', title: 'Send to Back' },
                                        ].map(({ action, icon: Icon, label, title }) => (
                                            <button
                                                key={label}
                                                onClick={action}
                                                title={title}
                                                className="flex flex-col items-center gap-1 py-2 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-600 transition-all text-[10px]"
                                            >
                                                <Icon size={14} />
                                                <span>{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                        <button
                                            onClick={() => onMoveCanvasElementLayer('forward')}
                                            className="flex items-center justify-center gap-1.5 h-7 rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-600 text-[11px] transition-colors"
                                        >
                                            <ChevronUp size={12} /> Forward
                                        </button>
                                        <button
                                            onClick={() => onMoveCanvasElementLayer('backward')}
                                            className="flex items-center justify-center gap-1.5 h-7 rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-600 text-[11px] transition-colors"
                                        >
                                            <ChevronDown size={12} /> Backward
                                        </button>
                                    </div>
                                </Section>

                                {/* Position & Size */}
                                <Section title="Position & Size" icon={MoveHorizontal}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <NumInput label="X %" value={selectedCanvasElement.x} min={0} max={98} onChange={(v) => updateSelectedElementBounds('x', v)} />
                                        <NumInput label="Y %" value={selectedCanvasElement.y} min={0} max={98} onChange={(v) => updateSelectedElementBounds('y', v)} />
                                        <NumInput label="W %" value={selectedCanvasElement.w} min={2} max={100} onChange={(v) => updateSelectedElementBounds('w', v)} />
                                        <NumInput label="H %" value={selectedCanvasElement.h} min={2} max={100} onChange={(v) => updateSelectedElementBounds('h', v)} />
                                    </div>
                                </Section>

                                {/* Text element controls */}
                                {selectedCanvasElement.kind === 'text' && (
                                    <>
                                        <Section title="Typography" icon={Type}>
                                            {/* Font family */}
                                            <div>
                                                <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1 block">Font</Label>
                                                <Select
                                                    value={selectedCanvasElement.style?.fontFamily || currentTheme?.fonts.body || 'Inter'}
                                                    onValueChange={(v) => updateTextStyle({ fontFamily: v })}
                                                >
                                                    <SelectTrigger className="h-8 text-[12px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {fontFamilyOptions.map((f) => (
                                                            <SelectItem key={f} value={f} className="text-[12px]" style={{ fontFamily: f }}>
                                                                {f}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Font size */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <Label className="text-[10px] uppercase tracking-wide text-zinc-400">Size</Label>
                                                    <span className="text-[11px] font-mono text-zinc-600">
                                                        {selectedCanvasElement.style?.fontSize ?? 24}px
                                                    </span>
                                                </div>
                                                <Slider
                                                    min={8}
                                                    max={96}
                                                    step={1}
                                                    value={[selectedCanvasElement.style?.fontSize ?? 24]}
                                                    onValueChange={([v]) => updateTextStyle({ fontSize: v })}
                                                    className="mt-1"
                                                />
                                            </div>

                                            {/* Font weight */}
                                            <div>
                                                <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1 block">Weight</Label>
                                                <ToggleGroup
                                                    value={selectedCanvasElement.style?.fontWeight || 'regular'}
                                                    onChange={(v) => updateTextStyle({ fontWeight: v })}
                                                    options={[
                                                        { value: 'regular', icon: <span className="text-[11px] font-normal">Aa</span>, label: 'Regular' },
                                                        { value: 'medium', icon: <span className="text-[11px] font-medium">Aa</span>, label: 'Medium' },
                                                        { value: 'semibold', icon: <span className="text-[11px] font-semibold">Aa</span>, label: 'Semibold' },
                                                        { value: 'bold', icon: <span className="text-[11px] font-bold">Aa</span>, label: 'Bold' },
                                                    ]}
                                                />
                                            </div>

                                            {/* Style toggles */}
                                            <div>
                                                <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1 block">Style</Label>
                                                <div className="flex gap-1">
                                                    {[
                                                        { key: 'italic', icon: <Italic size={13} />, label: 'Italic' },
                                                        { key: 'underline', icon: <Underline size={13} />, label: 'Underline' },
                                                        { key: 'strikethrough', icon: <Strikethrough size={13} />, label: 'Strikethrough' },
                                                    ].map(({ key, icon, label }) => {
                                                        const active = !!(selectedCanvasElement.style as Record<string, unknown>)?.[key];
                                                        return (
                                                            <button
                                                                key={key}
                                                                onClick={() => updateTextStyle({ [key]: !active })}
                                                                title={label}
                                                                className={`flex-1 h-8 flex items-center justify-center rounded-md border transition-all ${active
                                                                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                                                                    : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                                                                    }`}
                                                            >
                                                                {icon}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Text align */}
                                            <div>
                                                <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1 block">Alignment</Label>
                                                <ToggleGroup
                                                    value={selectedCanvasElement.style?.align || 'left'}
                                                    onChange={(v) => updateTextStyle({ align: v })}
                                                    options={[
                                                        { value: 'left', icon: <AlignLeft size={13} />, label: 'Left' },
                                                        { value: 'center', icon: <AlignCenter size={13} />, label: 'Center' },
                                                        { value: 'right', icon: <AlignRight size={13} />, label: 'Right' },
                                                    ]}
                                                />
                                            </div>

                                            {/* Text color */}
                                            <ColorPicker
                                                label="Text Color"
                                                value={colorValue(selectedCanvasElement.style?.color, currentTheme?.colors.text || '#000000')}
                                                onChange={(c) => updateTextStyle({ color: c })}
                                            />

                                            {/* Background color for text box */}
                                            <ColorPicker
                                                label="Background"
                                                value={colorValue(selectedCanvasElement.style?.background as string, 'transparent')}
                                                onChange={(c) => updateTextStyle({ background: c === 'transparent' ? undefined : c })}
                                            />
                                        </Section>
                                    </>
                                )}

                                {/* Shape controls */}
                                {selectedCanvasElement.kind === 'shape' && (
                                    <Section title="Shape Style" icon={Square}>
                                        <div>
                                            <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1 block">Shape Type</Label>
                                            <ToggleGroup
                                                value={selectedCanvasElement.shape}
                                                onChange={(v) => onUpdateSelectedCanvasElement((el) => el.kind === 'shape' ? { ...el, shape: v as typeof el.shape } : el)}
                                                options={[
                                                    { value: 'rect', icon: <Square size={13} />, label: 'Rectangle' },
                                                    { value: 'roundedRect', icon: <CornerUpLeft size={13} />, label: 'Rounded' },
                                                    { value: 'circle', icon: <Circle size={13} />, label: 'Circle' },
                                                    { value: 'line', icon: <Minus size={13} />, label: 'Line' },
                                                ]}
                                            />
                                        </div>

                                        <ColorPicker
                                            label="Fill Color"
                                            value={colorValue(selectedCanvasElement.style?.fill, `${currentTheme?.colors.primary}33` || '#e0e7ff')}
                                            onChange={(c) => updateShapeStyle({ fill: c })}
                                        />

                                        <ColorPicker
                                            label="Border Color"
                                            value={colorValue(selectedCanvasElement.style?.stroke, currentTheme?.colors.primary || '#6366f1')}
                                            onChange={(c) => updateShapeStyle({ stroke: c })}
                                        />

                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <Label className="text-[10px] uppercase tracking-wide text-zinc-400">Border Width</Label>
                                                <span className="text-[11px] font-mono text-zinc-600">
                                                    {selectedCanvasElement.style?.strokeWidth ?? 1}px
                                                </span>
                                            </div>
                                            <Slider
                                                min={0}
                                                max={12}
                                                step={1}
                                                value={[selectedCanvasElement.style?.strokeWidth ?? 1]}
                                                onValueChange={([v]) => updateShapeStyle({ strokeWidth: v })}
                                            />
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <Label className="text-[10px] uppercase tracking-wide text-zinc-400">Opacity</Label>
                                                <span className="text-[11px] font-mono text-zinc-600">
                                                    {Math.round((selectedCanvasElement.style?.opacity ?? 1) * 100)}%
                                                </span>
                                            </div>
                                            <Slider
                                                min={0}
                                                max={1}
                                                step={0.01}
                                                value={[selectedCanvasElement.style?.opacity ?? 1]}
                                                onValueChange={([v]) => updateShapeStyle({ opacity: v })}
                                            />
                                        </div>
                                    </Section>
                                )}

                                {/* Image controls */}
                                {selectedCanvasElement.kind === 'image' && (
                                    <Section title="Image" icon={ImagePlus}>
                                        <input
                                            ref={canvasImageUploadRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleCanvasImageUpload(file);
                                                e.target.value = '';
                                            }}
                                        />
                                        <button
                                            onClick={() => canvasImageUploadRef.current?.click()}
                                            className="w-full h-10 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 hover:border-indigo-400 hover:bg-indigo-50/50 text-zinc-500 hover:text-indigo-600 text-[12px] font-medium transition-all"
                                        >
                                            <Upload size={14} /> Upload Image
                                        </button>

                                        <div>
                                            <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1 block">Fit Mode</Label>
                                            <ToggleGroup
                                                value={selectedCanvasElement.fit || 'cover'}
                                                onChange={(v) => onUpdateSelectedCanvasElement((el) => el.kind === 'image' ? { ...el, fit: v as 'cover' | 'contain' } : el)}
                                                options={[
                                                    { value: 'cover', icon: <span className="text-[10px]">Cover</span>, label: 'Cover' },
                                                    { value: 'contain', icon: <span className="text-[10px]">Contain</span>, label: 'Contain' },
                                                ]}
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1 block">Alt / Prompt</Label>
                                            <Input
                                                value={selectedCanvasElement.prompt || ''}
                                                onChange={(e) => onUpdateSelectedCanvasElement((el) => el.kind === 'image' ? { ...el, prompt: e.target.value } : el)}
                                                placeholder="Describe the image..."
                                                className="h-8 text-[12px]"
                                            />
                                        </div>

                                        {imageDataInput && (
                                            <button
                                                onClick={() => { onUpdateSelectedCanvasElement((el) => el.kind === 'image' ? { ...el, imageUrl: undefined } : el); setImageDataInput(''); }}
                                                className="w-full h-8 flex items-center justify-center gap-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-[11px] transition-colors"
                                            >
                                                <X size={12} /> Remove Image
                                            </button>
                                        )}
                                    </Section>
                                )}

                                {/* Chart controls */}
                                {selectedCanvasElement.kind === 'chart' && (
                                    <Section title="Chart Data" icon={BarChart3}>
                                        <div>
                                            <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1 block">Chart Type</Label>
                                            <Select
                                                value={selectedCanvasElement.chartType || 'bar'}
                                                onValueChange={(v) => onUpdateSelectedCanvasElement((el) => el.kind === 'chart' ? { ...el, chartType: v as typeof el.chartType } : el)}
                                            >
                                                <SelectTrigger className="h-8 text-[12px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="bar" className="text-[12px]">Bar Chart</SelectItem>
                                                    <SelectItem value="line" className="text-[12px]">Line Chart</SelectItem>
                                                    <SelectItem value="pie" className="text-[12px]">Pie Chart</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1 block">Labels (comma-separated)</Label>
                                            <Input
                                                value={(selectedCanvasElement.labels || []).join(', ')}
                                                onChange={(e) => onUpdateSelectedCanvasElement((el) => el.kind === 'chart' ? { ...el, labels: e.target.value.split(',').map(s => s.trim()) } : el)}
                                                className="h-8 text-[12px]"
                                                placeholder="Q1, Q2, Q3, Q4"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1 block">Values (comma-separated)</Label>
                                            <Input
                                                value={(selectedCanvasElement.values || []).join(', ')}
                                                onChange={(e) => {
                                                    const vals = e.target.value.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
                                                    onUpdateSelectedCanvasElement((el) => el.kind === 'chart' ? { ...el, values: vals } : el);
                                                }}
                                                className="h-8 text-[12px]"
                                                placeholder="15, 22, 30, 28"
                                            />
                                        </div>
                                    </Section>
                                )}
                            </>
                        ) : isCanvas && !selectedCanvasElement ? (
                            <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
                                    <Layers size={20} className="text-zinc-400" />
                                </div>
                                <p className="text-[12px] text-zinc-500 leading-relaxed">
                                    Click an element on the canvas to select and edit it, or add a new element above.
                                </p>
                            </div>
                        ) : (
                            /* Non-canvas slide content editing */
                            <div className="px-4 py-3 space-y-4">
                                {/* Title */}
                                {'title' in currentSlide && (
                                    <div>
                                        <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1.5 block">Title</Label>
                                        <Input
                                            ref={titleInputRef}
                                            value={'title' in currentSlide ? (currentSlide.title || '') : ''}
                                            onChange={(e) => handleSlideUpdate({ title: e.target.value } as Partial<Slide>)}
                                            placeholder="Slide title..."
                                            className="text-[13px]"
                                        />
                                    </div>
                                )}

                                {/* Subtitle */}
                                {'subtitle' in currentSlide && (
                                    <div>
                                        <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1.5 block">Subtitle</Label>
                                        <Input
                                            ref={subtitleInputRef}
                                            value={'subtitle' in currentSlide ? ((currentSlide.subtitle as string) || '') : ''}
                                            onChange={(e) => handleSlideUpdate({ subtitle: e.target.value } as Partial<Slide>)}
                                            placeholder="Subtitle..."
                                            className="text-[13px]"
                                        />
                                    </div>
                                )}

                                {/* Bullets */}
                                {'bullets' in currentSlide && (
                                    <div>
                                        <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1.5 block">Bullet Points (one per line)</Label>
                                        <Textarea
                                            ref={bulletsTextareaRef}
                                            value={('bullets' in currentSlide ? currentSlide.bullets as string[] : []).join('\n')}
                                            onChange={(e) => handleSlideUpdate({ bullets: e.target.value.split('\n') } as Partial<Slide>)}
                                            rows={5}
                                            className="text-[12px] resize-none"
                                            placeholder="• First bullet&#10;• Second bullet"
                                        />
                                    </div>
                                )}

                                {/* Quote */}
                                {'quote' in currentSlide && (
                                    <div>
                                        <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1.5 block">Quote</Label>
                                        <Textarea
                                            ref={quoteTextareaRef}
                                            value={('quote' in currentSlide ? currentSlide.quote as string : '') || ''}
                                            onChange={(e) => handleSlideUpdate({ quote: e.target.value } as Partial<Slide>)}
                                            rows={3}
                                            className="text-[12px] resize-none italic"
                                        />
                                        <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1.5 mt-2 block">Attribution</Label>
                                        <Input
                                            ref={attributionInputRef}
                                            value={('attribution' in currentSlide ? currentSlide.attribution as string : '') || ''}
                                            onChange={(e) => handleSlideUpdate({ attribution: e.target.value } as Partial<Slide>)}
                                            placeholder="— Author Name"
                                            className="text-[12px]"
                                        />
                                    </div>
                                )}

                                {/* Two column */}
                                {'left' in currentSlide && (
                                    <div className="space-y-3">
                                        <div>
                                            <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1.5 block">Left Column (one per line)</Label>
                                            <Textarea
                                                ref={leftTextareaRef}
                                                value={('left' in currentSlide ? currentSlide.left as string[] : []).join('\n')}
                                                onChange={(e) => handleSlideUpdate({ left: e.target.value.split('\n') } as Partial<Slide>)}
                                                rows={4}
                                                className="text-[12px] resize-none"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1.5 block">Right Column (one per line)</Label>
                                            <Textarea
                                                ref={rightTextareaRef}
                                                value={('right' in currentSlide ? currentSlide.right as string[] : []).join('\n')}
                                                onChange={(e) => handleSlideUpdate({ right: e.target.value.split('\n') } as Partial<Slide>)}
                                                rows={4}
                                                className="text-[12px] resize-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Image caption slide */}
                                {'caption' in currentSlide && (
                                    <div className="space-y-3">
                                        <div>
                                            <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1.5 block">Caption</Label>
                                            <Input
                                                ref={captionInputRef}
                                                value={('caption' in currentSlide ? currentSlide.caption as string : '') || ''}
                                                onChange={(e) => handleSlideUpdate({ caption: e.target.value } as Partial<Slide>)}
                                                className="text-[12px]"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1.5 block">Image Prompt</Label>
                                            <Textarea
                                                ref={imagePromptTextareaRef}
                                                value={('imagePrompt' in currentSlide ? currentSlide.imagePrompt as string : '') || ''}
                                                onChange={(e) => handleSlideUpdate({ imagePrompt: e.target.value } as Partial<Slide>)}
                                                rows={2}
                                                className="text-[12px] resize-none"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1.5 block">Upload Image</Label>
                                            <input ref={imageUploadInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }} />
                                            <button onClick={() => imageUploadInputRef.current?.click()} className="w-full h-9 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-200 hover:border-indigo-400 hover:bg-indigo-50 text-[12px] text-zinc-500 hover:text-indigo-600 transition-all">
                                                <Upload size={13} /> Upload Image
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ SLIDE TAB ═══ */}
                {activeTab === 'slide' && (
                    <div>
                        {/* AI Regenerate */}
                        <Section title="AI Regenerate" icon={Sparkles}>
                            <Textarea
                                value={regenInstruction}
                                onChange={(e) => setRegenInstruction(e.target.value)}
                                placeholder="Optional: describe changes for this slide..."
                                rows={3}
                                className="text-[12px] resize-none"
                            />
                            <button
                                onClick={handleRegenerateSlide}
                                disabled={isRegenerating}
                                className="w-full h-9 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white text-[12px] font-semibold transition-all disabled:opacity-60 shadow-sm"
                            >
                                {isRegenerating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                                {isRegenerating ? 'Regenerating…' : 'Regenerate Slide'}
                            </button>
                        </Section>

                        {/* Layout hints */}
                        {currentSlide && 'layoutHints' in currentSlide && (
                            <Section title="Layout" icon={LayoutGrid}>
                                <div>
                                    <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1 block">Text Alignment</Label>
                                    <ToggleGroup
                                        value={(currentSlide.layoutHints as Record<string, string>)?.align || 'left'}
                                        onChange={(v) => updateLayoutHint('align', v)}
                                        options={[
                                            { value: 'left', icon: <AlignLeft size={13} />, label: 'Left' },
                                            { value: 'center', icon: <AlignCenter size={13} />, label: 'Center' },
                                        ]}
                                    />
                                </div>
                                <div>
                                    <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1 block">Density</Label>
                                    <ToggleGroup
                                        value={(currentSlide.layoutHints as Record<string, string>)?.density || 'comfortable'}
                                        onChange={(v) => updateLayoutHint('density', v)}
                                        options={[
                                            { value: 'comfortable', icon: <span className="text-[10px]">Spacious</span>, label: 'Comfortable' },
                                            { value: 'compact', icon: <span className="text-[10px]">Compact</span>, label: 'Compact' },
                                        ]}
                                    />
                                </div>
                            </Section>
                        )}

                        {/* Canvas background */}
                        {isCanvas && (
                            <Section title="Background" icon={Palette}>
                                <ColorPicker
                                    label="Slide Background"
                                    value={colorValue(currentCanvasSlide?.background, currentTheme?.colors.background || '#ffffff')}
                                    onChange={(c) => handleSlideUpdate({ background: c } as Partial<Slide>)}
                                />
                                <button
                                    onClick={() => handleSlideUpdate({ background: currentTheme?.colors.background } as Partial<Slide>)}
                                    className="w-full h-8 text-[11px] text-zinc-500 hover:text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                                >
                                    Reset to Theme Default
                                </button>
                            </Section>
                        )}
                    </div>
                )}

                {/* ═══ DESIGN TAB ═══ */}
                {activeTab === 'design' && (
                    <div>
                        <Section title="Theme" icon={Palette}>
                            <div className="space-y-2">
                                {THEME_IDS.map((themeId) => {
                                    const th = themes[themeId];
                                    const isActive = deckSpec.themeId === themeId;
                                    return (
                                        <button
                                            key={themeId}
                                            onClick={() => setTheme(themeId)}
                                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all text-left ${isActive
                                                ? 'border-indigo-400 bg-indigo-50/50 shadow-sm'
                                                : 'border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50'
                                                }`}
                                        >
                                            {/* Color palette preview */}
                                            <div className="flex gap-0.5 flex-shrink-0">
                                                {[th.colors.background, th.colors.primary, th.colors.accent, th.colors.text].map((c, i) => (
                                                    <div key={i} className="w-3 h-8 rounded-sm border border-black/10" style={{ background: c }} />
                                                ))}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[12px] font-semibold text-zinc-800">{th.name}</div>
                                                <div className="text-[10px] text-zinc-400 truncate">{th.description}</div>
                                            </div>
                                            {isActive && (
                                                <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </Section>

                        <Section title="Presentation Info" icon={Monitor}>
                            <div>
                                <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1.5 block">Deck Title</Label>
                                <Input
                                    value={deckSpec.title || ''}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="text-[12px]"
                                    placeholder="My Presentation"
                                />
                            </div>
                            {deckSpec.subtitle !== undefined && (
                                <div>
                                    <Label className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1.5 block">Subtitle</Label>
                                    <Input
                                        value={deckSpec.subtitle || ''}
                                        onChange={(e) => setSubtitle(e.target.value)}
                                        className="text-[12px]"
                                        placeholder="Tagline or subtitle..."
                                    />
                                </div>
                            )}
                        </Section>
                    </div>
                )}
            </div>
        </aside>
    );
}
