export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  colors: {
    background: string;
    surface: string;
    primary: string;
    accent: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  isDark: boolean;
}

export const THEME_IDS = [
  'aurora',
  'minimal',
  'corporate',
  'pitchDeck',
  'gradientGlass',
  'editorial',
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const themes: Record<ThemeId, ThemeDefinition> = {
  aurora: {
    id: 'aurora',
    name: 'Aurora',
    description: 'Dark theme with neon accents',
    colors: {
      background: '#0f0f1a',
      surface: '#1a1a2e',
      primary: '#6366f1',
      accent: '#ec4899',
      text: '#e2e8f0',
      textSecondary: '#94a3b8',
      border: '#2d2d44',
    },
    fonts: {
      heading: 'Space Grotesk',
      body: 'Inter',
    },
    isDark: true,
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean white with lots of whitespace',
    colors: {
      background: '#ffffff',
      surface: '#f8fafc',
      primary: '#0f172a',
      accent: '#6366f1',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
    },
    fonts: {
      heading: 'Inter',
      body: 'Georgia',
    },
    isDark: false,
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate',
    description: 'Professional blue and gray',
    colors: {
      background: '#f1f5f9',
      surface: '#ffffff',
      primary: '#1e40af',
      accent: '#3b82f6',
      text: '#0f172a',
      textSecondary: '#475569',
      border: '#cbd5e1',
    },
    fonts: {
      heading: 'Roboto',
      body: 'Inter',
    },
    isDark: false,
  },
  pitchDeck: {
    id: 'pitchDeck',
    name: 'Pitch Deck',
    description: 'Bold headlines with big numbers',
    colors: {
      background: '#0a0a0a',
      surface: '#171717',
      primary: '#facc15',
      accent: '#f97316',
      text: '#fafafa',
      textSecondary: '#a3a3a3',
      border: '#262626',
    },
    fonts: {
      heading: 'Outfit',
      body: 'Inter',
    },
    isDark: true,
  },
  gradientGlass: {
    id: 'gradientGlass',
    name: 'Gradient Glass',
    description: 'Soft gradients with frosted panels',
    colors: {
      background: '#1e1b4b',
      surface: 'rgba(255,255,255,0.08)',
      primary: '#818cf8',
      accent: '#c084fc',
      text: '#f8fafc',
      textSecondary: '#c7d2fe',
      border: 'rgba(255,255,255,0.12)',
    },
    fonts: {
      heading: 'Poppins',
      body: 'Inter',
    },
    isDark: true,
  },
  editorial: {
    id: 'editorial',
    name: 'Editorial',
    description: 'Serif typography with warm tones',
    colors: {
      background: '#faf7f2',
      surface: '#ffffff',
      primary: '#92400e',
      accent: '#b45309',
      text: '#1c1917',
      textSecondary: '#57534e',
      border: '#d6d3d1',
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Source Sans 3',
    },
    isDark: false,
  },
};

export function getTheme(id: ThemeId): ThemeDefinition {
  return themes[id];
}
