'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ThemeDefinition } from '@/lib/themes';
import {
    clampCanvasBounds,
    clampNumber,
    normalizeCanvasElement,
    type CanvasElement,
    type DesignerCanvasSlide,
} from '@/lib/canvas-editor';
import {
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
    Type, Square, ImagePlus, BarChart3, Minus, Circle, CornerUpLeft,
    Copy, Trash2, BringToFront, SendToBack, ChevronUp, ChevronDown,
    Lock, Unlock,
} from 'lucide-react';

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

type InteractionState =
    | {
        mode: 'drag';
        elementId: string;
        startClientX: number;
        startClientY: number;
        origin: { x: number; y: number; w: number; h: number };
    }
    | {
        mode: 'resize';
        handle: ResizeHandle;
        elementId: string;
        startClientX: number;
        startClientY: number;
        origin: { x: number; y: number; w: number; h: number };
    };

interface DesignerCanvasEditorProps {
    slide: DesignerCanvasSlide;
    theme: ThemeDefinition;
    selectedElementId: string | null;
    onSelectElement: (elementId: string | null) => void;
    onElementsChange: (elements: DesignerCanvasSlide['elements']) => void;
    onDuplicate?: () => void;
    onDelete?: () => void;
    onLayerForward?: () => void;
    onLayerBackward?: () => void;
}

const toPct = (value: number) => `${Math.max(0, Math.min(100, value))}%`;

// Full 8-handle positions
const handlePositionStyles: Record<ResizeHandle, string> = {
    nw: '-left-1.5 -top-1.5 cursor-nwse-resize',
    ne: '-right-1.5 -top-1.5 cursor-nesw-resize',
    sw: '-left-1.5 -bottom-1.5 cursor-nesw-resize',
    se: '-right-1.5 -bottom-1.5 cursor-nwse-resize',
    n: 'left-1/2 -translate-x-1/2 -top-1.5 cursor-ns-resize',
    s: 'left-1/2 -translate-x-1/2 -bottom-1.5 cursor-ns-resize',
    e: 'top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize',
    w: 'top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize',
};

const ALL_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];

// Floating context toolbar
function ContextToolbar({
    element,
    stageRect,
    elementRect,
    onStyleUpdate,
    onDuplicate,
    onDelete,
    onLayerForward,
    onLayerBackward,
}: {
    element: CanvasElement;
    stageRect: DOMRect | null;
    elementRect: { x: number; y: number; w: number; h: number };
    onStyleUpdate: (updates: Record<string, unknown>) => void;
    onDuplicate?: () => void;
    onDelete?: () => void;
    onLayerForward?: () => void;
    onLayerBackward?: () => void;
}) {
    if (!stageRect) return null;

    // Position toolbar above element
    const leftPct = elementRect.x + elementRect.w / 2;

    const toolbarStyle: React.CSSProperties = {
        left: `${leftPct}%`,
        transform: 'translateX(-50%)',
        bottom: `${100 - elementRect.y + 1}%`,
    };

    // Only text and shape elements have style - safely extract it
    const rawStyle = (element.kind === 'text' || element.kind === 'shape') && element.style ? element.style : {};
    const style = rawStyle as {
        color?: string; fontSize?: number; fontWeight?: string; align?: string;
        italic?: boolean; underline?: boolean; strikethrough?: boolean;
        background?: string; fill?: string; stroke?: string; bold?: boolean;
    };

    const ToolBtn = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
        <button
            onClick={onClick}
            title={title}
            onPointerDown={(e) => e.stopPropagation()}
            className={`h-7 w-7 flex items-center justify-center rounded-md transition-all text-[11px] ${active
                ? 'bg-white/25 text-white'
                : 'text-white/80 hover:bg-white/15 hover:text-white'
                }`}
        >
            {children}
        </button>
    );

    const Divider = () => <div className="w-px h-5 bg-white/20 mx-0.5" />;

    return (
        <div
            className="absolute z-50 flex items-center gap-0.5 px-1.5 py-1 rounded-xl shadow-2xl"
            style={{
                ...toolbarStyle,
                background: 'rgba(15, 15, 30, 0.92)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.12)',
            }}
            onPointerDown={(e) => e.stopPropagation()}
        >
            {element.kind === 'text' && (
                <>
                    <ToolBtn onClick={() => onStyleUpdate({ bold: !style.bold, fontWeight: !style.bold ? 'bold' : 'regular' })} active={!!(style.fontWeight === 'bold')} title="Bold (Ctrl+B)">
                        <Bold size={12} />
                    </ToolBtn>
                    <ToolBtn onClick={() => onStyleUpdate({ italic: !style.italic })} active={!!style.italic} title="Italic (Ctrl+I)">
                        <Italic size={12} />
                    </ToolBtn>
                    <ToolBtn onClick={() => onStyleUpdate({ underline: !style.underline })} active={!!style.underline} title="Underline (Ctrl+U)">
                        <Underline size={12} />
                    </ToolBtn>
                    <Divider />
                    <ToolBtn onClick={() => onStyleUpdate({ align: 'left' })} active={style.align === 'left' || !style.align} title="Align Left">
                        <AlignLeft size={12} />
                    </ToolBtn>
                    <ToolBtn onClick={() => onStyleUpdate({ align: 'center' })} active={style.align === 'center'} title="Align Center">
                        <AlignCenter size={12} />
                    </ToolBtn>
                    <ToolBtn onClick={() => onStyleUpdate({ align: 'right' })} active={style.align === 'right'} title="Align Right">
                        <AlignRight size={12} />
                    </ToolBtn>
                    <Divider />
                </>
            )}
            <ToolBtn onClick={() => onDuplicate?.()} title="Duplicate (Ctrl+D)">
                <Copy size={12} />
            </ToolBtn>
            <ToolBtn onClick={() => onLayerForward?.()} title="Bring Forward">
                <ChevronUp size={12} />
            </ToolBtn>
            <ToolBtn onClick={() => onLayerBackward?.()} title="Send Backward">
                <ChevronDown size={12} />
            </ToolBtn>
            <Divider />
            <ToolBtn onClick={() => onDelete?.()} title="Delete (Del)">
                <Trash2 size={12} className="text-red-400" />
            </ToolBtn>
        </div>
    );
}

// Snap lines component
function SnapLines({ lines }: { lines: Array<{ type: 'h' | 'v'; position: number }> }) {
    return (
        <>
            {lines.map((line, i) => (
                line.type === 'h' ? (
                    <div
                        key={i}
                        className="absolute left-0 right-0 pointer-events-none"
                        style={{ top: `${line.position}%`, height: '1px', background: 'rgba(99,102,241,0.7)' }}
                    />
                ) : (
                    <div
                        key={i}
                        className="absolute top-0 bottom-0 pointer-events-none"
                        style={{ left: `${line.position}%`, width: '1px', background: 'rgba(99,102,241,0.7)' }}
                    />
                )
            ))}
        </>
    );
}

export default function DesignerCanvasEditor({
    slide,
    theme,
    selectedElementId,
    onSelectElement,
    onElementsChange,
    onDuplicate,
    onDelete,
    onLayerForward,
    onLayerBackward,
}: DesignerCanvasEditorProps) {
    const stageRef = useRef<HTMLDivElement>(null);
    const [interaction, setInteraction] = useState<InteractionState | null>(null);
    const [editingTextId, setEditingTextId] = useState<string | null>(null);
    const [textDraft, setTextDraft] = useState('');
    const [snapLines, setSnapLines] = useState<Array<{ type: 'h' | 'v'; position: number }>>([]);
    const [isDragging, setIsDragging] = useState(false);

    const selectedElement = useMemo(
        () => slide.elements.find((element) => element.id === selectedElementId) || null,
        [slide.elements, selectedElementId]
    );

    // Get stage rect for toolbar positioning
    const [stageRect, setStageRect] = useState<DOMRect | null>(null);
    useEffect(() => {
        const update = () => {
            if (stageRef.current) setStageRect(stageRef.current.getBoundingClientRect());
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    useEffect(() => {
        if (selectedElementId && !slide.elements.some((element) => element.id === selectedElementId)) {
            onSelectElement(null);
        }
    }, [onSelectElement, selectedElementId, slide.elements]);

    useEffect(() => {
        if (editingTextId && !slide.elements.some((element) => element.id === editingTextId && element.kind === 'text')) {
            setEditingTextId(null);
            setTextDraft('');
        }
    }, [editingTextId, slide.elements]);

    const updateElementById = useCallback(
        (elementId: string, updater: (element: CanvasElement) => CanvasElement) => {
            const next = slide.elements.map((element) => {
                if (element.id !== elementId) return element;
                return normalizeCanvasElement(updater(element));
            });
            onElementsChange(next);
        },
        [onElementsChange, slide.elements]
    );

    // Update style on selected element (for context toolbar)
    const updateSelectedStyle = useCallback(
        (updates: Record<string, unknown>) => {
            if (!selectedElementId) return;
            updateElementById(selectedElementId, (el) => {
                if (el.kind === 'text') return { ...el, style: { ...el.style, ...updates } };
                if (el.kind === 'shape') return { ...el, style: { ...el.style, ...updates } };
                return el;
            });
        },
        [selectedElementId, updateElementById]
    );

    const beginDrag = useCallback(
        (event: React.PointerEvent, element: CanvasElement) => {
            if (event.button !== 0) return;
            event.stopPropagation();
            onSelectElement(element.id);
            setIsDragging(true);
            setInteraction({
                mode: 'drag',
                elementId: element.id,
                startClientX: event.clientX,
                startClientY: event.clientY,
                origin: { x: element.x, y: element.y, w: element.w, h: element.h },
            });
        },
        [onSelectElement]
    );

    const beginResize = useCallback(
        (event: React.PointerEvent, element: CanvasElement, handle: ResizeHandle) => {
            if (event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            onSelectElement(element.id);
            setInteraction({
                mode: 'resize',
                handle,
                elementId: element.id,
                startClientX: event.clientX,
                startClientY: event.clientY,
                origin: { x: element.x, y: element.y, w: element.w, h: element.h },
            });
        },
        [onSelectElement]
    );

    const commitTextDraft = useCallback(() => {
        if (!editingTextId) return;
        const draft = textDraft;
        updateElementById(editingTextId, (element) =>
            element.kind === 'text' ? { ...element, text: draft } : element
        );
        setEditingTextId(null);
        setTextDraft('');
    }, [editingTextId, textDraft, updateElementById]);

    // Compute snap lines while dragging
    const computeSnapLines = useCallback(
        (movingId: string, x: number, y: number, w: number, h: number) => {
            const SNAP_THRESHOLD = 2;
            const others = slide.elements.filter((el) => el.id !== movingId);
            const candidatePoints = [0, 50, 100]; // center and edges of canvas
            others.forEach((el) => {
                candidatePoints.push(el.x, el.x + el.w / 2, el.x + el.w);
                candidatePoints.push(el.y, el.y + el.h / 2, el.y + el.h);
            });

            const lines: Array<{ type: 'h' | 'v'; position: number }> = [];
            const movingPoints = {
                left: x, centerX: x + w / 2, right: x + w,
                top: y, centerY: y + h / 2, bottom: y + h,
            };

            // Check horizontal snaps (y axis)
            [movingPoints.top, movingPoints.centerY, movingPoints.bottom].forEach((mp) => {
                candidatePoints.forEach((cp) => {
                    if (Math.abs(mp - cp) < SNAP_THRESHOLD) {
                        lines.push({ type: 'h', position: cp });
                    }
                });
            });

            // Check vertical snaps (x axis)
            [movingPoints.left, movingPoints.centerX, movingPoints.right].forEach((mp) => {
                candidatePoints.forEach((cp) => {
                    if (Math.abs(mp - cp) < SNAP_THRESHOLD) {
                        lines.push({ type: 'v', position: cp });
                    }
                });
            });

            setSnapLines([...new Map(lines.map(l => [`${l.type}-${l.position}`, l])).values()]);
        },
        [slide.elements]
    );

    useEffect(() => {
        if (!interaction) {
            setSnapLines([]);
            setIsDragging(false);
            return;
        }

        const handlePointerMove = (event: PointerEvent) => {
            const stage = stageRef.current;
            if (!stage) return;
            const rect = stage.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            const deltaX = ((event.clientX - interaction.startClientX) / rect.width) * 100;
            const deltaY = ((event.clientY - interaction.startClientY) / rect.height) * 100;

            updateElementById(interaction.elementId, (element) => {
                if (interaction.mode === 'drag') {
                    const next = clampCanvasBounds(
                        interaction.origin.x + deltaX,
                        interaction.origin.y + deltaY,
                        interaction.origin.w,
                        interaction.origin.h
                    );
                    computeSnapLines(interaction.elementId, next.x, next.y, next.w, next.h);
                    return { ...element, ...next };
                }

                let left = interaction.origin.x;
                let right = interaction.origin.x + interaction.origin.w;
                let top = interaction.origin.y;
                let bottom = interaction.origin.y + interaction.origin.h;

                if (interaction.handle.includes('w')) left += deltaX;
                if (interaction.handle.includes('e')) right += deltaX;
                if (interaction.handle.includes('n')) top += deltaY;
                if (interaction.handle.includes('s')) bottom += deltaY;

                left = clampNumber(left, 0, 100);
                right = clampNumber(right, 0, 100);
                top = clampNumber(top, 0, 100);
                bottom = clampNumber(bottom, 0, 100);

                const minSize = 2;
                if (right - left < minSize) {
                    if (interaction.handle.includes('w')) left = Math.max(0, right - minSize);
                    else right = Math.min(100, left + minSize);
                }
                if (bottom - top < minSize) {
                    if (interaction.handle.includes('n')) top = Math.max(0, bottom - minSize);
                    else bottom = Math.min(100, top + minSize);
                }

                return { ...element, x: left, y: top, w: right - left, h: bottom - top };
            });
        };

        const endInteraction = () => {
            setInteraction(null);
            setSnapLines([]);
            setIsDragging(false);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', endInteraction);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', endInteraction);
        };
    }, [interaction, updateElementById, computeSnapLines]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (editingTextId) return;
            if (!selectedElementId) return;
            const el = stageRef.current;
            if (!el) return;

            const NUDGE = e.shiftKey ? 5 : 0.5;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                updateElementById(selectedElementId, (el) => ({ ...el, ...clampCanvasBounds(el.x - NUDGE, el.y, el.w, el.h) }));
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                updateElementById(selectedElementId, (el) => ({ ...el, ...clampCanvasBounds(el.x + NUDGE, el.y, el.w, el.h) }));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                updateElementById(selectedElementId, (el) => ({ ...el, ...clampCanvasBounds(el.x, el.y - NUDGE, el.w, el.h) }));
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                updateElementById(selectedElementId, (el) => ({ ...el, ...clampCanvasBounds(el.x, el.y + NUDGE, el.w, el.h) }));
            } else if ((e.key === 'Delete' || e.key === 'Backspace') && !editingTextId) {
                e.preventDefault();
                onDelete?.();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                onDuplicate?.();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                updateSelectedStyle({ fontWeight: 'bold' });
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                updateSelectedStyle({ italic: true });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedElementId, editingTextId, updateElementById, onDelete, onDuplicate, updateSelectedStyle]);

    const renderElement = (element: CanvasElement) => {
        const isSelected = element.id === selectedElementId;
        const isEditingText = element.id === editingTextId && element.kind === 'text';

        const baseStyle: React.CSSProperties = {
            left: toPct(element.x),
            top: toPct(element.y),
            width: toPct(element.w),
            height: toPct(element.h),
        };

        const selectionRing = isSelected
            ? 'outline outline-2 outline-offset-0 outline-[#6366f1]'
            : '';

        if (element.kind === 'text') {
            const style = element.style || {};
            return (
                <div
                    key={element.id}
                    className={`absolute group select-none cursor-move ${selectionRing}`}
                    style={baseStyle}
                    onPointerDown={(event) => beginDrag(event, element)}
                    onDoubleClick={(event) => {
                        event.stopPropagation();
                        onSelectElement(element.id);
                        setEditingTextId(element.id);
                        setTextDraft(element.text);
                    }}
                >
                    {isEditingText ? (
                        <textarea
                            autoFocus
                            value={textDraft}
                            onChange={(event) => setTextDraft(event.target.value)}
                            onBlur={commitTextDraft}
                            onKeyDown={(event) => {
                                if (event.key === 'Escape') {
                                    event.preventDefault();
                                    setEditingTextId(null);
                                    setTextDraft('');
                                }
                                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                                    event.preventDefault();
                                    commitTextDraft();
                                }
                            }}
                            className="w-full h-full rounded-sm border-2 border-[#6366f1]/60 bg-white/95 px-2 py-1 text-[12px] leading-snug outline-none resize-none"
                            style={{
                                color: style.color || theme.colors.text,
                                fontFamily: style.fontFamily || theme.fonts.body,
                                fontSize: clampNumber(style.fontSize || 24, 8, 96),
                                fontWeight: style.fontWeight === 'bold' ? 700 : style.fontWeight === 'semibold' ? 600 : style.fontWeight === 'medium' ? 500 : 400,
                                fontStyle: style.italic ? 'italic' : 'normal',
                                textDecoration: style.underline ? 'underline' : 'none',
                                textAlign: (style.align as React.CSSProperties['textAlign']) || 'left',
                            }}
                        />
                    ) : (
                        <div
                            className="w-full h-full overflow-hidden px-1 py-0.5 whitespace-pre-wrap break-words cursor-text"
                            style={{
                                color: style.color || theme.colors.text,
                                fontFamily: style.fontFamily || theme.fonts.body,
                                fontSize: clampNumber(style.fontSize || 24, 8, 96),
                                fontWeight: style.fontWeight === 'bold' ? 700 : style.fontWeight === 'semibold' ? 600 : style.fontWeight === 'medium' ? 500 : 400,
                                fontStyle: style.italic ? 'italic' : 'normal',
                                textDecoration: [style.underline ? 'underline' : '', style.strikethrough ? 'line-through' : ''].filter(Boolean).join(' ') || 'none',
                                textAlign: (style.align as React.CSSProperties['textAlign']) || 'left',
                                background: (style.background as string) || 'transparent',
                                lineHeight: 1.25,
                            }}
                        >
                            {element.text || <span className="text-zinc-400 italic text-[0.85em]">Double-click to edit</span>}
                        </div>
                    )}

                    {/* Hover outline when not selected */}
                    {!isSelected && !isEditingText && (
                        <div className="absolute inset-0 border border-dashed border-zinc-300/0 group-hover:border-zinc-400/60 pointer-events-none rounded-[2px] transition-colors" />
                    )}

                    {/* Selection handles */}
                    {isSelected && !isEditingText && (
                        <>
                            <div className="absolute inset-0 pointer-events-none" />
                            {ALL_HANDLES.map((handle) => (
                                <button
                                    key={handle}
                                    type="button"
                                    className={`absolute w-2.5 h-2.5 rounded-sm border-2 border-white bg-[#6366f1] shadow-md ${handlePositionStyles[handle]}`}
                                    style={{ touchAction: 'none' }}
                                    onPointerDown={(event) => beginResize(event, element, handle)}
                                    aria-label={`Resize ${handle}`}
                                />
                            ))}
                        </>
                    )}
                </div>
            );
        }

        if (element.kind === 'shape') {
            const style = element.style || {};
            return (
                <div
                    key={element.id}
                    className={`absolute group cursor-move ${selectionRing}`}
                    style={baseStyle}
                    onPointerDown={(event) => beginDrag(event, element)}
                >
                    <div
                        className="w-full h-full"
                        style={{
                            background: element.shape === 'line' ? 'transparent' : style.fill || `${theme.colors.primary}20`,
                            border: `${style.strokeWidth ?? 1}px solid ${style.stroke || `${theme.colors.primary}80`}`,
                            borderRadius: element.shape === 'circle' ? '9999px' : element.shape === 'roundedRect' ? '14px' : '2px',
                            opacity: style.opacity ?? 1,
                            height: element.shape === 'line' ? '2px' : '100%',
                            marginTop: element.shape === 'line' ? 'calc(50% - 1px)' : 0,
                        }}
                    />
                    {!isSelected && (
                        <div className="absolute inset-0 border border-dashed border-transparent group-hover:border-zinc-400/40 pointer-events-none rounded-[2px] transition-colors" />
                    )}
                    {isSelected && (
                        <>
                            {ALL_HANDLES.map((handle) => (
                                <button
                                    key={handle}
                                    type="button"
                                    className={`absolute w-2.5 h-2.5 rounded-sm border-2 border-white bg-[#6366f1] shadow-md ${handlePositionStyles[handle]}`}
                                    style={{ touchAction: 'none' }}
                                    onPointerDown={(event) => beginResize(event, element, handle)}
                                    aria-label={`Resize ${handle}`}
                                />
                            ))}
                        </>
                    )}
                </div>
            );
        }

        if (element.kind === 'image') {
            const hasImage = !!element.imageUrl?.trim();
            return (
                <div
                    key={element.id}
                    className={`absolute overflow-hidden cursor-move group ${selectionRing}`}
                    style={{
                        ...baseStyle,
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #6366f1' : `1px solid ${theme.colors.primary}30`,
                        background: theme.colors.surface,
                    }}
                    onPointerDown={(event) => beginDrag(event, element)}
                >
                    {hasImage ? (
                        <img
                            src={element.imageUrl}
                            alt={element.prompt || 'Canvas image'}
                            className={`w-full h-full ${element.fit === 'contain' ? 'object-contain' : 'object-cover'}`}
                            draggable={false}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 gap-1.5">
                            <ImagePlus size={20} className="text-zinc-400" />
                            <p className="text-[10px] text-center leading-snug text-zinc-400 break-words">
                                {element.prompt || 'Image placeholder'}
                            </p>
                        </div>
                    )}
                    {!isSelected && (
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-zinc-400/40 pointer-events-none rounded-lg transition-colors" />
                    )}
                    {isSelected && (
                        <>
                            {ALL_HANDLES.map((handle) => (
                                <button
                                    key={handle}
                                    type="button"
                                    className={`absolute w-2.5 h-2.5 rounded-sm border-2 border-white bg-[#6366f1] shadow-md ${handlePositionStyles[handle]}`}
                                    style={{ touchAction: 'none' }}
                                    onPointerDown={(event) => beginResize(event, element, handle)}
                                    aria-label={`Resize ${handle}`}
                                />
                            ))}
                        </>
                    )}
                </div>
            );
        }

        // Chart
        const values = element.values?.slice(0, 8) || [];
        const labels = element.labels?.slice(0, 8) || [];
        const maxValue = Math.max(...values, 1);

        return (
            <div
                key={element.id}
                className={`absolute rounded-xl border cursor-move group ${selectionRing}`}
                style={{
                    ...baseStyle,
                    borderColor: isSelected ? '#6366f1' : `${theme.colors.primary}30`,
                    background: theme.colors.surface,
                    padding: '8px',
                }}
                onPointerDown={(event) => beginDrag(event, element)}
            >
                <div className="w-full h-full flex items-end gap-1.5">
                    {values.map((value, index) => (
                        <div key={`${labels[index]}-${index}`} className="flex-1 flex flex-col items-center justify-end gap-1">
                            <div
                                className="w-full rounded-sm transition-all"
                                style={{
                                    height: `${Math.max((Math.max(value, 0) / maxValue) * 100, 6)}%`,
                                    background: theme.colors.primary,
                                    opacity: 0.85,
                                }}
                            />
                            <div className="text-[9px] leading-none text-center break-words" style={{ color: theme.colors.textSecondary }}>
                                {(labels[index] || `${index + 1}`).slice(0, 8)}
                            </div>
                        </div>
                    ))}
                </div>
                {!isSelected && (
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-zinc-400/40 pointer-events-none rounded-xl transition-colors" />
                )}
                {isSelected && (
                    <>
                        {ALL_HANDLES.map((handle) => (
                            <button
                                key={handle}
                                type="button"
                                className={`absolute w-2.5 h-2.5 rounded-sm border-2 border-white bg-[#6366f1] shadow-md ${handlePositionStyles[handle]}`}
                                style={{ touchAction: 'none' }}
                                onPointerDown={(event) => beginResize(event, element, handle)}
                                aria-label={`Resize ${handle}`}
                            />
                        ))}
                    </>
                )}
            </div>
        );
    };

    return (
        <div
            ref={stageRef}
            className="relative w-full h-full overflow-hidden"
            style={{ background: slide.background || theme.colors.background }}
            onPointerDown={(event) => {
                if (event.button !== 0) return;
                if (event.currentTarget === event.target) {
                    onSelectElement(null);
                    if (editingTextId) {
                        commitTextDraft();
                    }
                }
            }}
        >
            {/* Canvas grid (subtle dot grid) */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                }}
            />

            {/* Snap lines */}
            <SnapLines lines={snapLines} />

            {/* Elements */}
            {slide.elements.length > 0 ? (
                slide.elements.slice(0, 50).map(renderElement)
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-60">
                    <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-zinc-300 flex items-center justify-center">
                        <Type size={24} className="text-zinc-300" />
                    </div>
                    <p className="text-sm text-zinc-400">
                        Add elements from the panel →
                    </p>
                </div>
            )}

            {/* Floating context toolbar above selected element */}
            {selectedElement && !editingTextId && !isDragging && (
                <ContextToolbar
                    element={selectedElement}
                    stageRect={stageRect}
                    elementRect={{ x: selectedElement.x, y: selectedElement.y, w: selectedElement.w, h: selectedElement.h }}
                    onStyleUpdate={updateSelectedStyle}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                    onLayerForward={onLayerForward}
                    onLayerBackward={onLayerBackward}
                />
            )}

            {/* Element type badge */}
            {selectedElement && (
                <div
                    className="absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide flex items-center gap-1.5"
                    style={{
                        background: 'rgba(99,102,241,0.12)',
                        color: '#6366f1',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(99,102,241,0.2)',
                    }}
                >
                    {selectedElement.kind === 'text' && <Type size={10} />}
                    {selectedElement.kind === 'shape' && <Square size={10} />}
                    {selectedElement.kind === 'image' && <ImagePlus size={10} />}
                    {selectedElement.kind === 'chart' && <BarChart3 size={10} />}
                    {selectedElement.kind}
                </div>
            )}

            {/* Double-click hint on text */}
            {selectedElement?.kind === 'text' && !editingTextId && (
                <div className="absolute bottom-3 right-3 rounded-full px-2.5 py-1 text-[9px] text-zinc-400 bg-black/5">
                    Double-click to edit text
                </div>
            )}
        </div>
    );
}
