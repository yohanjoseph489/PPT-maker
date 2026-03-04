import { create } from 'zustand';
import type { DeckSpec, Slide } from '@/lib/schemas/deckspec';
import type { ThemeId } from '@/lib/themes';

const MAX_HISTORY = 50;

interface DeckStore {
    // State
    deckSpec: DeckSpec | null;
    selectedSlideIndex: number;
    isGenerating: boolean;
    generationProgress: string;
    activeEditField: string | null;
    reduce3D: boolean;
    disable3D: boolean;

    // Undo/Redo history
    history: DeckSpec[];
    historyIndex: number;

    // Deck actions
    setDeckSpec: (spec: DeckSpec) => void;
    clearDeck: () => void;

    // Slide actions
    selectSlide: (index: number) => void;
    updateSlide: (index: number, updates: Partial<Slide>) => void;
    reorderSlides: (fromIndex: number, toIndex: number) => void;
    addSlide: (slide: Slide, atIndex?: number) => void;
    removeSlide: (index: number) => void;

    // Theme
    setTheme: (themeId: ThemeId) => void;
    setTitle: (title: string) => void;
    setSubtitle: (subtitle: string) => void;

    // Generation state
    setGenerating: (generating: boolean) => void;
    setProgress: (progress: string) => void;
    setActiveEditField: (field: string | null) => void;

    // Preferences
    setReduce3D: (reduce: boolean) => void;
    setDisable3D: (disable: boolean) => void;

    // Undo/Redo
    undo: () => void;
    redo: () => void;
    pushHistory: (spec: DeckSpec) => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
}

export const useDeckStore = create<DeckStore>((set, get) => ({
    // Initial state
    deckSpec: null,
    selectedSlideIndex: 0,
    isGenerating: false,
    generationProgress: '',
    activeEditField: null,
    reduce3D: false,
    disable3D: false,
    history: [],
    historyIndex: -1,

    // Push to history
    pushHistory: (spec) => {
        const { history, historyIndex } = get();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(spec)));
        if (newHistory.length > MAX_HISTORY) newHistory.shift();
        set({ history: newHistory, historyIndex: Math.min(newHistory.length - 1, MAX_HISTORY - 1) });
    },

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex <= 0) return;
        const prev = history[historyIndex - 1];
        set({ deckSpec: prev, historyIndex: historyIndex - 1 });
    },

    redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex >= history.length - 1) return;
        const next = history[historyIndex + 1];
        set({ deckSpec: next, historyIndex: historyIndex + 1 });
    },

    // Deck actions
    setDeckSpec: (spec) => {
        get().pushHistory(spec);
        set({ deckSpec: spec, selectedSlideIndex: 0 });
    },
    clearDeck: () => set({ deckSpec: null, selectedSlideIndex: 0, history: [], historyIndex: -1 }),

    // Slide actions
    selectSlide: (index) => set({ selectedSlideIndex: index }),

    updateSlide: (index, updates) =>
        set((state) => {
            if (!state.deckSpec) return state;
            const slides = [...state.deckSpec.slides];
            slides[index] = { ...slides[index], ...updates } as Slide;
            const newSpec = { ...state.deckSpec, slides };
            // Push history for significant updates (not called on every keystroke in canvas drag)
            return { deckSpec: newSpec };
        }),

    reorderSlides: (fromIndex, toIndex) =>
        set((state) => {
            if (!state.deckSpec) return state;
            const slides = [...state.deckSpec.slides];
            const [moved] = slides.splice(fromIndex, 1);
            slides.splice(toIndex, 0, moved);
            let nextSelected = state.selectedSlideIndex;

            if (state.selectedSlideIndex === fromIndex) {
                nextSelected = toIndex;
            } else if (fromIndex < state.selectedSlideIndex && toIndex >= state.selectedSlideIndex) {
                nextSelected = state.selectedSlideIndex - 1;
            } else if (fromIndex > state.selectedSlideIndex && toIndex <= state.selectedSlideIndex) {
                nextSelected = state.selectedSlideIndex + 1;
            }

            return {
                deckSpec: { ...state.deckSpec, slides },
                selectedSlideIndex: nextSelected,
            };
        }),

    addSlide: (slide, atIndex) =>
        set((state) => {
            if (!state.deckSpec) return state;
            const slides = [...state.deckSpec.slides];
            const insertAt = atIndex ?? slides.length;
            slides.splice(insertAt, 0, slide);
            return {
                deckSpec: { ...state.deckSpec, slides },
                selectedSlideIndex: insertAt,
            };
        }),

    removeSlide: (index) =>
        set((state) => {
            if (!state.deckSpec || state.deckSpec.slides.length <= 1) return state;
            const slides = state.deckSpec.slides.filter((_, i) => i !== index);
            return {
                deckSpec: { ...state.deckSpec, slides },
                selectedSlideIndex: Math.min(state.selectedSlideIndex, slides.length - 1),
            };
        }),

    // Theme
    setTheme: (themeId) =>
        set((state) => {
            if (!state.deckSpec) return state;
            return { deckSpec: { ...state.deckSpec, themeId } };
        }),

    setTitle: (title) =>
        set((state) => {
            if (!state.deckSpec) return state;
            return { deckSpec: { ...state.deckSpec, title } };
        }),

    setSubtitle: (subtitle) =>
        set((state) => {
            if (!state.deckSpec) return state;
            return { deckSpec: { ...state.deckSpec, subtitle } };
        }),

    // Generation
    setGenerating: (generating) => set({ isGenerating: generating }),
    setProgress: (progress) => set({ generationProgress: progress }),
    setActiveEditField: (field) => set({ activeEditField: field }),

    // Preferences
    setReduce3D: (reduce) => set({ reduce3D: reduce }),
    setDisable3D: (disable) => set({ disable3D: disable }),
}));
