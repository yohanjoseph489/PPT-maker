import type { ThemeDefinition } from '@/lib/themes';

export interface PptxThemeConfig {
    bgColor: string;
    titleColor: string;
    textColor: string;
    accentColor: string;
    secondaryColor: string;
    headingFont: string;
    bodyFont: string;
}

function hexClean(color: string): string {
    // Remove # prefix and handle rgba/special values
    if (color.startsWith('rgba') || color.startsWith('linear')) {
        return '1E1B4B'; // fallback for gradient/rgba themes
    }
    return color.replace('#', '').toUpperCase();
}

export function getPptxThemeConfig(theme: ThemeDefinition): PptxThemeConfig {
    return {
        bgColor: hexClean(theme.colors.background),
        titleColor: hexClean(theme.colors.text),
        textColor: hexClean(theme.colors.text),
        accentColor: hexClean(theme.colors.primary),
        secondaryColor: hexClean(theme.colors.textSecondary),
        headingFont: theme.fonts.heading,
        bodyFont: theme.fonts.body,
    };
}
