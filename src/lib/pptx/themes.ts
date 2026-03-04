import type { ThemeDefinition } from '@/lib/themes';

export interface PptxThemeConfig {
    bgColor: string;
    surfaceColor: string;
    titleColor: string;
    textColor: string;
    primaryColor: string;
    accentColor: string;
    secondaryColor: string;
    borderColor: string;
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
        surfaceColor: hexClean(theme.colors.surface),
        titleColor: hexClean(theme.colors.text),
        textColor: hexClean(theme.colors.text),
        primaryColor: hexClean(theme.colors.primary),
        accentColor: hexClean(theme.colors.accent),
        secondaryColor: hexClean(theme.colors.textSecondary),
        borderColor: hexClean(theme.colors.border),
        headingFont: theme.fonts.heading,
        bodyFont: theme.fonts.body,
    };
}
