import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemePalette = 'cobalt' | 'teal' | 'cyan' | 'sapphire' | 'emerald' | 'violet';

export interface ThemeOption {
  id: ThemePalette;
  name: string;
  koreanName: string;
  icon: string;
  primaryColor: string;
  description: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'emerald',
    name: 'Alpine Emerald',
    koreanName: '알파인 에메랄드',
    icon: '🌲',
    primaryColor: '#34d399',
    description: 'Mountain Pine & Lush Ridge Jade',
  },
  {
    id: 'cobalt',
    name: 'Electric Cobalt',
    koreanName: '일렉트릭 코발트',
    icon: '⚡',
    primaryColor: '#6366f1',
    description: 'Deep Alpine Indigo & Expedition Ultramarine',
  },
  {
    id: 'teal',
    name: 'Aurora Teal',
    koreanName: '오로라 틸',
    icon: '🌊',
    primaryColor: '#2dd4bf',
    description: 'Glacial Meltwater & Northern Lights Mint',
  },
  {
    id: 'cyan',
    name: 'Glacier Cyan',
    koreanName: '빙하 시안',
    icon: '🧊',
    primaryColor: '#22d3ee',
    description: 'Crisp Arctic Cyan & High-Altitude Peak Sky',
  },
  {
    id: 'sapphire',
    name: 'Nordic Sapphire',
    koreanName: '노르딕 사파이어',
    icon: '🌌',
    primaryColor: '#38bdf8',
    description: 'Ice Cobalt & Deep Twilight Ridge',
  },
  {
    id: 'violet',
    name: 'Summit Twilight',
    koreanName: '서밋 트와일라잇',
    icon: '🔮',
    primaryColor: '#a855f7',
    description: 'Purple Dusk Horizon & High Alpenglow',
  },
];

interface ThemeContextValue {
  theme: ThemePalette;
  setTheme: (theme: ThemePalette) => void;
  themeOption: ThemeOption;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'emerald',
  setTheme: () => {},
  themeOption: THEME_OPTIONS[0],
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemePalette>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('peakpulse_cool_theme_v3');
      if (stored && ['cobalt', 'teal', 'cyan', 'sapphire', 'emerald', 'violet'].includes(stored)) {
        return stored as ThemePalette;
      }
      // Also check v2 if explicitly set to something user picked
      const v2 = localStorage.getItem('peakpulse_cool_theme_v2');
      if (v2 && ['cobalt', 'teal', 'cyan', 'sapphire', 'emerald', 'violet'].includes(v2)) {
        return v2 as ThemePalette;
      }
    }
    return 'emerald'; // Default color palette is Alpine Emerald
  });

  const setTheme = (newTheme: ThemePalette) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('peakpulse_cool_theme_v3', newTheme);
      localStorage.setItem('peakpulse_cool_theme_v2', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const themeOption = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeOption }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
