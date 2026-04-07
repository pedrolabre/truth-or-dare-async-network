import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextType = {
  themeMode: ThemeMode;
  isDark: boolean;
  useSystemTheme: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setUseSystemTheme: (value: boolean) => void;
  toggleManualTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();

  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  const isDark =
    themeMode === 'system'
      ? systemScheme === 'dark'
      : themeMode === 'dark';

  const useSystemTheme = themeMode === 'system';

  function setThemeMode(mode: ThemeMode) {
    setThemeModeState(mode);
  }

  function setUseSystemTheme(value: boolean) {
    setThemeModeState((current) => {
      if (value) {
        return 'system';
      }

      if (current === 'system') {
        return systemScheme === 'dark' ? 'dark' : 'light';
      }

      return current;
    });
  }

  function toggleManualTheme() {
    setThemeModeState((current) => {
      if (current === 'system') {
        return systemScheme === 'dark' ? 'light' : 'dark';
      }

      return current === 'dark' ? 'light' : 'dark';
    });
  }

  const value = useMemo(
    () => ({
      themeMode,
      isDark,
      useSystemTheme,
      setThemeMode,
      setUseSystemTheme,
      toggleManualTheme,
    }),
    [themeMode, isDark, useSystemTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }

  return context;
}