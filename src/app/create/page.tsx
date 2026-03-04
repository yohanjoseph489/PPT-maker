'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
    Plus,
    Home,
    Inbox,
    Layers,
    Folder,
    Wrench,
    Mic,
    CornerDownLeft,
    Sparkles,
    Presentation,
    PieChart,
    FileText,
    PenTool,
    MessageSquare,
    Image as ImageIcon,
    Music,
    Video,
    Layout,
    Loader2,
    X,
    HardDrive,
    Cloud,
} from 'lucide-react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { useDeckStore } from '@/lib/store';
import { themes, THEME_IDS, type ThemeId } from '@/lib/themes';
import { DeckSpecSchema, type DeckSpec } from '@/lib/schemas/deckspec';
import { z } from 'zod';

const DOCK_ITEMS = [
    { id: 'custom', label: 'Custom Deck', icon: Sparkles, color: 'text-zinc-500' },
    { id: 'pitch', label: 'Pitch Deck', icon: Presentation, color: 'text-zinc-500' },
    { id: 'sales', label: 'Sales Deck', icon: PieChart, color: 'text-zinc-500' },
    { id: 'report', label: 'Report', icon: FileText, color: 'text-zinc-500' },
    { id: 'creative', label: 'Creative', icon: PenTool, color: 'text-zinc-500' },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare, color: 'text-zinc-500' },
];

export default function CreatePage() {
    const router = useRouter();
    const { setDeckSpec, setGenerating, isGenerating, setProgress } = useDeckStore();

    const [topic, setTopic] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Speech-to-Text State
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Attachment State
    const [showAttachments, setShowAttachments] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Advanced Settings State
    const [audience, setAudience] = useState('');
    const [tone, setTone] = useState<string>('professional');
    const [slideCount, setSlideCount] = useState(8);
    const [themeId, setThemeId] = useState<ThemeId>('corporate');
    const [generationMode, setGenerationMode] = useState<'standard' | 'advancedLayout'>('advancedLayout');
    const [includeSpeakerNotes, setIncludeSpeakerNotes] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;

                recognition.onresult = (event: any) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        }
                    }
                    if (finalTranscript) {
                        setTopic(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + finalTranscript);
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    setIsListening(false);
                    if (event.error !== 'no-speech') {
                        toast.error(`Microphone error: ${event.error}`);
                    }
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current = recognition;
            }
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            toast.success("Stopped listening");
        } else {
            if (!recognitionRef.current) {
                toast.error("Speech recognition is not supported in this browser.");
                return;
            }
            try {
                recognitionRef.current.start();
                setIsListening(true);
                toast.info("Listening...");
            } catch (error) {
                console.error(error);
            }
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [topic]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachedFile(e.target.files[0]);
            setShowAttachments(false);
            toast.success(`Attached ${e.target.files[0].name}`);
        }
    };

    const handleDriveClick = () => {
        setShowAttachments(false);
        toast.info("Connecting to Google Drive...");
        setTimeout(() => {
            const mockFile = new File(["mock content"], "Q3_Report_Data.pdf", { type: "application/pdf" });
            setAttachedFile(mockFile);
            toast.success("Imported Q3_Report_Data.pdf from Google Drive");
        }, 1500);
    };

    const { object, submit, isLoading } = useObject({
        api: '/api/generate',
        schema: z.object({ deckSpec: DeckSpecSchema }),
        onFinish: ({ object, error }: { object?: any, error?: Error }) => {
            if (error) {
                console.error('Generation finish error:', error);
                toast.error('Failed to generate presentation. Please try again.');
                setGenerating(false);
            } else if (object?.deckSpec) {
                const deck = object.deckSpec as DeckSpec;
                setDeckSpec(deck);
                toast.success('Deck generated successfully!');
                router.push('/editor/new');
                // Don't setGenerating(false) here immediately, let it transition smoothly
            }
        },
        onError: (error: Error) => {
            console.error('Generation request error:', error);
            toast.error('Failed to generate presentation. Please try again.');
            setGenerating(false);
        }
    });

    const handleGenerate = () => {
        if (!topic.trim()) {
            toast.error('Please enter a topic for your presentation.');
            return;
        }

        setGenerating(true);
        setProgress('Crafting your presentation...');
        setShowSettings(false);

        submit({
            topic: topic.trim(),
            audience: audience.trim() || undefined,
            tone,
            slideCount,
            themeId,
            generationMode,
            includeSpeakerNotes,
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleGenerate();
        }
    };

    return (
        <main className="flex h-screen w-full bg-[#f4f7f4] text-[#1d1d1f] font-sans overflow-hidden">
            {/* ─── LEFT SIDEBAR ─────────────────────────────────────────── */}
            <aside className="w-[72px] h-full flex flex-col items-center py-6 bg-white/60 backdrop-blur-xl border-r border-[#0000000d] z-20 shrink-0">
                <div className="w-10 h-10 bg-[#34c759] rounded-[10px] flex items-center justify-center mb-8 shadow-sm">
                    <span className="text-white font-bold text-lg">S</span>
                </div>

                <nav className="flex flex-col gap-4 w-full items-center">
                    <SidebarItem icon={Home} label="Home" active href="/create" />
                    <SidebarItem icon={Inbox} label="Inbox" href="/inbox" />
                    <SidebarItem icon={Layers} label="Decks" href="/decks" />
                </nav>

                <div className="mt-auto">
                    <SidebarItem icon={Folder} label="Drive" />
                </div>
            </aside>

            {/* ─── MAIN CONTENT ─────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col relative h-full">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-8 shrink-0 relative z-20">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-[8px] bg-[#34c759] flex items-center justify-center shadow-sm border border-black/5">
                            <span className="text-white font-bold text-sm">S</span>
                        </div>
                        <span className="font-semibold text-lg tracking-tight text-[#1d1d1f]">SyncSlides</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-black/5 shadow-sm text-sm font-medium text-zinc-600">
                            <span className="w-2 h-2 rounded-full bg-[#34c759]" />
                            MoveInSync Internal
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-[#1d1d1f]">User Account</span>
                            <span className="text-xs text-[#86868b]">Internal Access</span>
                        </div>
                        <button className="w-9 h-9 rounded-full bg-zinc-100 overflow-hidden flex items-center justify-center border border-black/5 hover:bg-zinc-200 transition-colors">
                            <span className="text-xs font-bold text-zinc-600">US</span>
                        </button>
                    </div>
                </header>

                {/* Center Stage */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24 max-w-4xl mx-auto w-full relative z-10">
                    <AnimatePresence mode="wait">
                        {!isGenerating ? (
                            <motion.div
                                key="composer"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                className="w-full flex flex-col items-center"
                            >
                                <div className="mb-8 flex flex-col items-center text-center">
                                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-3 leading-tight">
                                        Generate your next deck.<br />Instantly.
                                    </h1>
                                    <p className="text-[#86868b] text-lg font-medium max-w-lg mb-4">
                                        Describe what you need, and SyncSlides will craft a structured, polished presentation for you.
                                    </p>
                                </div>

                                {/* Search / Prompt Box */}
                                <div
                                    className={`w-full bg-white/80 backdrop-blur-[24px] border transition-all duration-300 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${isFocused ? 'border-[#34c759]/50 shadow-[0_8px_30px_rgb(52,199,89,0.15)] ring-4 ring-[#34c759]/10' : 'border-[#00000010] hover:border-[#0000001a]'
                                        }`}
                                >
                                    <div className="p-4 sm:p-5 flex flex-col gap-3 min-h-[140px]">
                                        <AnimatePresence>
                                            {attachedFile && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-[#f4f7f4] rounded-lg w-fit border border-[#0000000d]"
                                                >
                                                    <FileText className="w-4 h-4 text-[#34c759]" />
                                                    <span className="text-sm font-medium text-zinc-700 truncate max-w-[200px]">
                                                        {attachedFile.name}
                                                    </span>
                                                    <button
                                                        onClick={() => setAttachedFile(null)}
                                                        className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-red-500 rounded-full hover:bg-white transition-colors ml-1"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        <textarea
                                            ref={textareaRef}
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            onFocus={() => setIsFocused(true)}
                                            onBlur={() => setIsFocused(false)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="e.g. Q3 Corporate Transport Efficiency Report..."
                                            className="w-full bg-transparent text-xl font-medium text-[#1d1d1f] placeholder:text-[#86868b] resize-none outline-none overflow-hidden block min-h-[60px]"
                                            rows={1}
                                        />

                                        <div className="flex items-center justify-between mt-auto pt-2">
                                            <div className="flex items-center gap-1">
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setShowAttachments(!showAttachments)}
                                                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${showAttachments ? 'bg-[#34c759] text-white shadow-sm' : 'bg-[#f4f7f4] hover:bg-[#e5e7eb] text-zinc-500 hover:text-zinc-800'}`}
                                                    >
                                                        <Plus className={`w-4 h-4 transition-transform duration-300 ${showAttachments ? 'rotate-45' : ''}`} />
                                                    </button>

                                                    <AnimatePresence>
                                                        {showAttachments && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                className="absolute bottom-full left-0 mb-3 w-56 bg-white/95 backdrop-blur-xl border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-1.5 z-50 flex flex-col"
                                                            >
                                                                <button
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                    className="flex items-center gap-3 px-3 py-2 hover:bg-[#f4f7f4] rounded-xl transition-colors text-[13px] font-semibold text-[#1d1d1f] w-full text-left"
                                                                >
                                                                    <div className="w-6 h-6 rounded-md bg-zinc-100 flex items-center justify-center border border-black/5">
                                                                        <HardDrive className="w-3.5 h-3.5 text-zinc-600" />
                                                                    </div>
                                                                    Upload from Computer
                                                                </button>
                                                                <button
                                                                    onClick={handleDriveClick}
                                                                    className="flex items-center gap-3 px-3 py-2 hover:bg-[#f4f7f4] rounded-xl transition-colors text-[13px] font-semibold text-[#1d1d1f] w-full text-left"
                                                                >
                                                                    <div className="w-6 h-6 rounded-md bg-[#32ade6]/10 flex items-center justify-center border border-[#32ade6]/20">
                                                                        <Cloud className="w-3.5 h-3.5 text-[#32ade6]" />
                                                                    </div>
                                                                    Import from Google Drive
                                                                </button>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        ref={fileInputRef}
                                                        onChange={handleFileSelect}
                                                        accept=".pdf,.doc,.docx,.txt,.csv"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => setShowSettings(!showSettings)}
                                                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${showSettings ? 'bg-[#34c759]/10 text-[#28a745]' : 'bg-[#f4f7f4] text-zinc-500 hover:bg-[#e5e7eb] hover:text-zinc-800'
                                                        }`}
                                                >
                                                    <Wrench className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={toggleListening}
                                                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-50 text-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.1)] animate-pulse' : 'hover:bg-[#f4f7f4] text-zinc-500 hover:text-zinc-800'}`}
                                                >
                                                    <Mic className="w-4 h-4 cursor-pointer" />
                                                </button>
                                                <button
                                                    onClick={handleGenerate}
                                                    disabled={!topic.trim()}
                                                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${topic.trim()
                                                        ? 'bg-[#34c759] text-white shadow-md hover:bg-[#28a745] hover:scale-105'
                                                        : 'bg-[#e5e7eb] text-zinc-400 cursor-not-allowed'
                                                        }`}
                                                >
                                                    <CornerDownLeft className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Advanced Settings Dropdown */}
                                <AnimatePresence>
                                    {showSettings && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, height: 0 }}
                                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                                            exit={{ opacity: 0, y: -10, height: 0 }}
                                            className="w-full overflow-hidden"
                                        >
                                            <div className="mt-4 p-5 rounded-[20px] bg-white/80 border border-[#0000000d] backdrop-blur-[24px] shadow-sm">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2 block">Theme</label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {THEME_IDS.map((id) => (
                                                                    <button
                                                                        key={id}
                                                                        onClick={() => setThemeId(id)}
                                                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${themeId === id
                                                                            ? 'bg-[#34c759]/10 border-[#34c759]/30 text-[#28a745]'
                                                                            : 'bg-white border-[#0000001a] hover:bg-[#f4f7f4] text-[#1d1d1f]'
                                                                            }`}
                                                                    >
                                                                        {themes[id].name}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2 block">Slide Count ({slideCount})</label>
                                                            <input
                                                                type="range"
                                                                min={3}
                                                                max={20}
                                                                value={slideCount}
                                                                onChange={(e) => setSlideCount(Number(e.target.value))}
                                                                className="w-full accent-[#34c759] h-1.5 bg-[#e5e7eb] rounded-full appearance-none outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2 block">Generation Mode</label>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <button
                                                                    onClick={() => setGenerationMode('advancedLayout')}
                                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${generationMode === 'advancedLayout'
                                                                        ? 'bg-[#34c759]/10 border-[#34c759]/30 text-[#28a745]'
                                                                        : 'bg-white border-[#0000001a] hover:bg-[#f4f7f4] text-[#1d1d1f]'
                                                                        }`}
                                                                >
                                                                    Nano Canvas
                                                                </button>
                                                                <button
                                                                    onClick={() => setGenerationMode('standard')}
                                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${generationMode === 'standard'
                                                                        ? 'bg-[#34c759]/10 border-[#34c759]/30 text-[#28a745]'
                                                                        : 'bg-white border-[#0000001a] hover:bg-[#f4f7f4] text-[#1d1d1f]'
                                                                        }`}
                                                                >
                                                                    Classic
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2 block">Audience (Optional)</label>
                                                            <input
                                                                type="text"
                                                                value={audience}
                                                                onChange={(e) => setAudience(e.target.value)}
                                                                placeholder="e.g. Investors, Students..."
                                                                className="w-full bg-white border border-[#0000001a] rounded-xl px-3 py-2 text-sm text-[#1d1d1f] font-medium outline-none focus:border-[#34c759] focus:ring-2 focus:ring-[#34c759]/20 transition-all"
                                                            />
                                                        </div>
                                                        <label className="flex items-center gap-2 cursor-pointer mt-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={includeSpeakerNotes}
                                                                onChange={(e) => setIncludeSpeakerNotes(e.target.checked)}
                                                                className="w-4 h-4 accent-[#34c759] rounded border-white/20"
                                                            />
                                                            <span className="text-sm font-medium text-[#1d1d1f]">Generate speaker notes</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="generating"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full max-w-lg flex flex-col items-center justify-center py-20"
                            >
                                <div className="w-20 h-20 relative mb-8">
                                    <div className="absolute inset-0 border-[3px] border-[#34c759]/20 rounded-full animate-ping" />
                                    <div className="absolute inset-0 border-[3px] border-t-[#34c759] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="w-8 h-8 text-[#34c759] animate-pulse" />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-semibold tracking-tight text-[#1d1d1f] mb-2">Forging presentation...</h2>
                                <p className="text-[#86868b] text-sm font-medium mb-8">
                                    {object?.deckSpec?.slides?.length ? `Drafting slide ${object.deckSpec.slides.length} of ${slideCount}...` : 'Analyzing parameters...'}
                                </p>

                                <div className="w-full h-1.5 bg-[#e5e7eb] rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-[#34c759] rounded-full"
                                        initial={{ width: '0%' }}
                                        animate={{ width: `${object?.deckSpec?.slides?.length ? (object.deckSpec.slides.length / slideCount) * 100 : 5}%` }}
                                        transition={{ duration: 0.5, ease: 'easeOut' }}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom Dock */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4">
                    <div className="flex bg-white/60 backdrop-blur-2xl border border-[#00000010] p-2 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] gap-2">
                        {DOCK_ITEMS.map((item) => (
                            <button key={item.id} className="group relative w-12 h-12 rounded-[16px] hover:bg-white flex items-center justify-center transition-all hover:shadow-sm hover:scale-110">
                                <item.icon className="w-5 h-5 text-zinc-600 group-hover:text-[#34c759] transition-colors" />

                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-3 px-2 py-1 bg-black/80 backdrop-blur-md text-white text-[11px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                    {item.label}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Subtle Background Elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#34c759]/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-[20%] w-[500px] h-[500px] bg-[#32ade6]/5 blur-[100px] rounded-full pointer-events-none" />
        </main>
    );
}

function SidebarItem({ icon: Icon, label, active, href }: { icon: any, label: string, active?: boolean, href?: string }) {
    const Component = (
        <button className="flex flex-col items-center gap-1 group w-full">
            <div className={`w-[42px] h-[42px] rounded-xl flex items-center justify-center transition-all ${active ? 'bg-white shadow-sm border border-[#0000000d] text-[#34c759]' : 'text-zinc-500 hover:bg-white hover:shadow-sm hover:border-[#0000000d] hover:text-zinc-800'
                }`}>
                <Icon className={`w-5 h-5 ${active ? 'fill-[#34c759]/10' : ''}`} />
            </div>
            <span className={`text-[10px] font-semibold ${active ? 'text-[#34c759]' : 'text-zinc-400 group-hover:text-zinc-600'}`}>
                {label}
            </span>
        </button>
    );

    if (href) {
        return <Link href={href} className="w-full">{Component}</Link>;
    }
    return Component;
}
