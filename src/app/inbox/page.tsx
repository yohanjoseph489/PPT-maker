'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Home,
    Inbox,
    Layers,
    Folder,
    Presentation,
    MessageSquare,
    Clock,
    User,
    CheckCircle2,
    Eye,
    MoreHorizontal
} from 'lucide-react';

// Dummy data for the inbox to show collaboration UI
const INBOX_ITEMS = [
    {
        id: '1',
        title: 'Q3 Corporate Transport Efficiency',
        sharedBy: 'Sarah Jenkins',
        role: 'Operations Lead',
        time: '2 hours ago',
        status: 'review_requested',
        comments: 4,
        thumbnail: 'bg-emerald-100',
    },
    {
        id: '2',
        title: 'New Employee Onboarding 2026',
        sharedBy: 'Michael Chen',
        role: 'HR Director',
        time: '5 hours ago',
        status: 'changes_suggested',
        comments: 12,
        thumbnail: 'bg-blue-100',
    },
    {
        id: '3',
        title: 'Vendor Pitch: EV Fleet',
        sharedBy: 'David Rodriguez',
        role: 'Procurement',
        time: '1 day ago',
        status: 'view_only',
        comments: 0,
        thumbnail: 'bg-purple-100',
    },
    {
        id: '4',
        title: 'SyncSlides Internal Rollout',
        sharedBy: 'Emma Watson',
        role: 'Product Manager',
        time: '2 days ago',
        status: 'approved',
        comments: 2,
        thumbnail: 'bg-orange-100',
    }
];

export default function InboxPage() {
    const [activeTab, setActiveTab] = useState<'all' | 'needs_review'>('all');

    const filteredItems = activeTab === 'needs_review'
        ? INBOX_ITEMS.filter(item => item.status === 'review_requested')
        : INBOX_ITEMS;

    return (
        <main className="flex h-screen w-full bg-[#f4f7f4] text-[#1d1d1f] font-sans overflow-hidden">
            {/* ─── LEFT SIDEBAR ─────────────────────────────────────────── */}
            <aside className="w-[72px] h-full flex flex-col items-center py-6 bg-white/60 backdrop-blur-xl border-r border-[#0000000d] z-20 shrink-0">
                <div className="w-10 h-10 bg-[#34c759] rounded-[10px] flex items-center justify-center mb-8 shadow-sm">
                    <span className="text-white font-bold text-lg">S</span>
                </div>

                <nav className="flex flex-col gap-4 w-full items-center">
                    <SidebarItem icon={Home} label="Home" href="/create" />
                    <SidebarItem icon={Inbox} label="Inbox" active href="/inbox" />
                    <SidebarItem icon={Layers} label="Decks" href="/decks" />
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
                        <span className="font-semibold text-lg tracking-tight text-[#1d1d1f]">Inbox</span>
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

                {/* Inbox Area */}
                <div className="flex-1 overflow-y-auto p-8 relative z-10 w-full max-w-5xl mx-auto">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f] mb-2">Collaboration Inbox</h1>
                            <p className="text-[#86868b] text-base font-medium">Review, comment, and collaborate on decks shared with you.</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 bg-black/5 p-1 rounded-xl w-fit mb-8">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'all' ? 'bg-white shadow-sm text-[#1d1d1f]' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                            All Activity
                        </button>
                        <button
                            onClick={() => setActiveTab('needs_review')}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'needs_review' ? 'bg-white shadow-sm text-[#1d1d1f]' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                            Needs Your Review
                            <span className="bg-[#34c759] text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">1</span>
                        </button>
                    </div>

                    {/* Inbox List */}
                    <div className="flex flex-col gap-3">
                        {filteredItems.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="group flex items-center gap-4 bg-white border border-[#0000000d] p-4 rounded-[20px] shadow-sm hover:shadow-md hover:border-[#34c759]/30 transition-all cursor-pointer"
                            >
                                {/* Thumbnail */}
                                <div className={`w-16 h-12 rounded-lg ${item.thumbnail} flex items-center justify-center shrink-0 border border-black/5`}>
                                    <Presentation className="w-6 h-6 text-black/20" />
                                </div>

                                {/* Main Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-semibold text-[#1d1d1f] truncate mb-0.5">{item.title}</h3>
                                    <div className="flex items-center gap-2 text-sm text-[#86868b]">
                                        <span className="font-medium text-zinc-700">{item.sharedBy}</span>
                                        <span className="w-1 h-1 rounded-full bg-zinc-300" />
                                        <span>{item.role}</span>
                                        <span className="w-1 h-1 rounded-full bg-zinc-300" />
                                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {item.time}</span>
                                    </div>
                                </div>

                                {/* Status & Actions */}
                                <div className="flex items-center gap-6 shrink-0 ml-4">
                                    {/* Badges */}
                                    <div className="flex flex-col items-end gap-1.5 w-32">
                                        {item.status === 'review_requested' && (
                                            <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-md bg-[#34c759]/10 text-[#28a745] border border-[#34c759]/20">
                                                Review Requested
                                            </span>
                                        )}
                                        {item.status === 'changes_suggested' && (
                                            <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                                                Changes Suggested
                                            </span>
                                        )}
                                        {item.status === 'approved' && (
                                            <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
                                            </span>
                                        )}
                                        {item.status === 'view_only' && (
                                            <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200">
                                                <Eye className="w-3 h-3 mr-1" /> View Only
                                            </span>
                                        )}
                                    </div>

                                    {/* Comments */}
                                    <div className="flex items-center gap-1.5 w-12 justify-end text-zinc-500">
                                        <MessageSquare className="w-4 h-4" />
                                        <span className="text-sm font-medium">{item.comments}</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 border-l border-zinc-100 pl-4">
                                        <button className="px-4 py-1.5 bg-[#f4f7f4] hover:bg-[#eaecea] text-[#1d1d1f] text-sm font-semibold rounded-lg transition-colors">
                                            Open
                                        </button>
                                        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
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
