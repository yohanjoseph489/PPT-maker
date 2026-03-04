'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home,
    Inbox,
    Layers,
    Folder,
    Presentation,
    Clock,
    MoreVertical,
    Plus,
    CheckCircle2
} from 'lucide-react';

// Demo data for the "Decks" page (Approved or Created decks)
const DUMMY_DECKS = [
    {
        id: '1',
        title: 'Q3 Corporate Transport Efficiency',
        lastModified: '2 hours ago',
        status: 'approved',
        thumbnail: 'bg-emerald-100',
    },
    {
        id: '2',
        title: 'SyncSlides Internal Rollout',
        lastModified: '2 days ago',
        status: 'approved',
        thumbnail: 'bg-orange-100',
    },
    {
        id: '3',
        title: 'Q1 Logistics Overview',
        lastModified: '1 week ago',
        status: 'created',
        thumbnail: 'bg-blue-100',
    }
];

export default function DecksPage() {
    // For demonstration, you can toggle this to see the empty state.
    const [decks, setDecks] = useState<typeof DUMMY_DECKS>([]);

    return (
        <main className="flex h-screen w-full bg-[#f4f7f4] text-[#1d1d1f] font-sans overflow-hidden">
            {/* ─── LEFT SIDEBAR ─────────────────────────────────────────── */}
            <aside className="w-[72px] h-full flex flex-col items-center py-6 bg-white/60 backdrop-blur-xl border-r border-[#0000000d] z-20 shrink-0">
                <div className="w-10 h-10 bg-[#34c759] rounded-[10px] flex items-center justify-center mb-8 shadow-sm">
                    <span className="text-white font-bold text-lg">S</span>
                </div>

                <nav className="flex flex-col gap-4 w-full items-center">
                    <SidebarItem icon={Home} label="Home" href="/create" />
                    <SidebarItem icon={Inbox} label="Inbox" href="/inbox" />
                    <SidebarItem icon={Layers} label="Decks" active href="/decks" />
                </nav>

                <div className="mt-auto">
                    <SidebarItem icon={Folder} label="Drive" href="/drive" />
                </div>
            </aside>

            {/* ─── MAIN CONTENT ─────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-8 shrink-0 relative z-20 bg-white/40 backdrop-blur-md border-b border-black/5">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg tracking-tight text-[#1d1d1f]">My Decks</span>
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

                {/* Main Area */}
                <div className="flex-1 overflow-y-auto p-8 relative z-10 w-full max-w-6xl mx-auto flex flex-col">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f] mb-2">Approved & Created Decks</h1>
                            <p className="text-[#86868b] text-base font-medium">Presentations you've generated or successfully collaborated on.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setDecks(decks.length ? [] : DUMMY_DECKS)}
                                className="px-4 py-2 text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
                            >
                                Toggle Data Demo
                            </button>
                            <Link href="/create">
                                <button className="px-5 py-2.5 bg-[#34c759] hover:bg-[#28a745] text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    New Deck
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Content Grid or Empty State */}
                    <div className="flex-1 flex flex-col">
                        <AnimatePresence mode="wait">
                            {decks.length === 0 ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto"
                                >
                                    <div className="w-20 h-20 rounded-[20px] bg-white border border-[#0000000d] shadow-sm flex items-center justify-center mb-6">
                                        <Presentation className="w-10 h-10 text-zinc-300" />
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f] mb-3">No Decks Found</h2>
                                    <p className="text-[#86868b] text-base font-medium mb-8">
                                        You don't have any approved or created presentations yet.
                                    </p>
                                    <Link href="/create">
                                        <button className="px-6 py-3 bg-[#1d1d1f] hover:bg-black text-white rounded-xl font-semibold shadow-md transition-all flex items-center gap-2 active:scale-95">
                                            <Plus className="w-4 h-4" />
                                            Generate your first design
                                        </button>
                                    </Link>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="grid"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                >
                                    {decks.map((deck, i) => (
                                        <motion.div
                                            key={deck.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="group bg-white border border-[#0000000d] rounded-[20px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all cursor-pointer flex flex-col"
                                        >
                                            <div className={`aspect-video w-full ${deck.thumbnail} relative flex items-center justify-center`}>
                                                <Presentation className="w-10 h-10 text-black/10" />
                                                <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-zinc-600 flex items-center gap-1 shadow-sm">
                                                    {deck.status === 'approved' && <CheckCircle2 className="w-3 h-3 text-[#34c759]" />}
                                                    {deck.status === 'created' && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                                                    {deck.status.toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="p-5 flex flex-col flex-1">
                                                <h3 className="font-semibold text-[15px] text-[#1d1d1f] mb-2 line-clamp-2 leading-snug">
                                                    {deck.title}
                                                </h3>
                                                <div className="mt-auto pt-4 flex items-center justify-between text-xs text-[#86868b] border-t border-black/5">
                                                    <span className="flex items-center gap-1 font-medium">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {deck.lastModified}
                                                    </span>
                                                    <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-100 hover:text-[#1d1d1f] transition-colors">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
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
