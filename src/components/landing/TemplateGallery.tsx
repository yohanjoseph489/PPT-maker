'use client';

import { motion } from 'framer-motion';
import { themes, type ThemeId } from '@/lib/themes';

const themeOrder: ThemeId[] = [
    'aurora',
    'minimal',
    'corporate',
    'pitchDeck',
    'gradientGlass',
    'editorial',
];

function ThemePreviewCard({ themeId }: { themeId: ThemeId }) {
    const theme = themes[themeId];

    return (
        <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="group relative flex-shrink-0 w-[280px] cursor-pointer"
        >
            <div
                className="relative overflow-hidden rounded-[20px] bg-white transition-all duration-300 shadow-sm border border-[#0000000d] group-hover:shadow-lg group-hover:border-[#0000001a]"
            >
                {/* Mini slide preview */}
                <div
                    className="aspect-video p-4 flex flex-col justify-between"
                    style={{ background: theme.colors.background }}
                >
                    {/* Title bar */}
                    <div className="space-y-1.5">
                        <div
                            className="h-2.5 w-3/4 rounded-full"
                            style={{ background: theme.colors.text, opacity: 0.9 }}
                        />
                        <div
                            className="h-1.5 w-1/2 rounded-full"
                            style={{ background: theme.colors.textSecondary, opacity: 0.6 }}
                        />
                    </div>

                    {/* Content blocks */}
                    <div className="flex gap-2 mt-auto">
                        <div className="flex-1 space-y-1">
                            <div
                                className="h-1 w-full rounded-full"
                                style={{ background: theme.colors.text, opacity: 0.3 }}
                            />
                            <div
                                className="h-1 w-4/5 rounded-full"
                                style={{ background: theme.colors.text, opacity: 0.2 }}
                            />
                            <div
                                className="h-1 w-3/5 rounded-full"
                                style={{ background: theme.colors.text, opacity: 0.15 }}
                            />
                        </div>
                        <div
                            className="w-12 h-8 rounded"
                            style={{ background: theme.colors.primary, opacity: 0.3 }}
                        />
                    </div>

                    {/* Accent bar */}
                    <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ background: theme.colors.primary }}
                    />
                </div>

                {/* Info */}
                <div className="p-4 space-y-1 bg-white">
                    <p className="text-sm font-semibold text-[#1d1d1f]">{theme.name}</p>
                    <p className="text-xs text-[#86868b]">{theme.description}</p>
                </div>
            </div>
        </motion.div>
    );
}

export default function TemplateGallery() {
    return (
        <section className="relative py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl font-bold tracking-tight text-[#1d1d1f] mb-3">
                        Premium{' '}
                        <span className="text-[#34c759]">Themes</span>
                    </h2>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        Six carefully crafted design systems. Every theme is consistent across preview and exported PPTX.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin"
                >
                    {themeOrder.map((id) => (
                        <ThemePreviewCard key={id} themeId={id} />
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
