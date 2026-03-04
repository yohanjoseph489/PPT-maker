import { create } from 'zustand';
import type { DeckSpec, Slide } from '@/lib/schemas/deckspec';
import type { ThemeId } from '@/lib/themes';

interface DeckStore {
    // State
    deckSpec: DeckSpec | null;
    selectedSlideIndex: number;
    isGenerating: boolean;
    generationProgress: string;
    reduce3D: boolean;
    disable3D: boolean;

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

    // Preferences
    setReduce3D: (reduce: boolean) => void;
    setDisable3D: (disable: boolean) => void;
}

export const useDeckStore = create<DeckStore>((set) => ({
    // Initial state
    deckSpec: null,
    selectedSlideIndex: 0,
    isGenerating: false,
    generationProgress: '',
    reduce3D: false,
    disable3D: false,

    // Deck actions
    setDeckSpec: (spec) => set({ deckSpec: spec, selectedSlideIndex: 0 }),
    clearDeck: () => set({ deckSpec: null, selectedSlideIndex: 0 }),

    // Slide actions
    selectSlide: (index) => set({ selectedSlideIndex: index }),

    updateSlide: (index, updates) =>
        set((state) => {
            if (!state.deckSpec) return state;
            const slides = [...state.deckSpec.slides];
            slides[index] = { ...slides[index], ...updates } as Slide;
            return { deckSpec: { ...state.deckSpec, slides } };
        }),

    reorderSlides: (fromIndex, toIndex) =>
        set((state) => {
            if (!state.deckSpec) return state;
            const slides = [...state.deckSpec.slides];
            const [moved] = slides.splice(fromIndex, 1);
            slides.splice(toIndex, 0, moved);
            return {
                deckSpec: { ...state.deckSpec, slides },
                selectedSlideIndex: toIndex,
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

    // Preferences
    setReduce3D: (reduce) => set({ reduce3D: reduce }),
    setDisable3D: (disable) => set({ disable3D: disable }),
}));
