'use client';

import { motion } from 'framer-motion';
import { Sparkles, Palette, Download } from 'lucide-react';

const features = [
    {
        icon: Sparkles,
        title: 'AI-Powered Generation',
        description:
            'Describe your topic and let AI craft a polished deck with insightful content, speaker notes, and smart layouts.',
        gradient: 'from-[#34c759] to-[#28a745]',
    },
    {
        icon: Palette,
        title: '6 Premium Themes',
        description:
            'From dark neon to editorial serif — each theme is carefully designed for consistent, beautiful visuals.',
        gradient: 'from-[#32ade6] to-[#007aff]',
    },
    {
        icon: Download,
        title: 'Real PPTX Export',
        description:
            'Download actual PowerPoint files. Open them in PowerPoint, Keynote, or Google Slides — perfectly formatted.',
        gradient: 'from-[#ffcc00] to-[#ff9500]',
    },
];

const containerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.15 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function FeatureStrip() {
    return (
        <section className="relative py-24 px-6">
            {/* Subtle background glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[600px] h-[600px] rounded-full bg-[#34c759]/5 blur-[120px]" />
            </div>

            <div className="max-w-6xl mx-auto relative">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            variants={cardVariants}
                            className="group relative"
                        >
                            <div className="relative bg-white rounded-[24px] p-8 h-full transition-all duration-300 shadow-sm border border-[#0000000d] hover:shadow-md hover:border-[#0000001a] group-hover:-translate-y-1">
                                {/* Icon */}
                                <div
                                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg transition-transform duration-300 group-hover:scale-110`}
                                >
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>

                                <h3 className="text-lg font-semibold mb-2 text-foreground">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>

                                {/* Subtle bottom accent */}
                                <div
                                    className={`absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-40 transition-opacity duration-300`}
                                />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
