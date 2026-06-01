import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import {
  loadThemeMode,
  saveThemeMode as persistThemeMode,
} from '../services/settingsStorage';
import type { ThemeMode } from '../types/settings';

export type { ThemeMode } from '../types/settings';

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
  const themeModeRef = useRef<ThemeMode>('system');
  const hasUserChangedThemeRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    void loadThemeMode()
      .then((savedThemeMode) => {
        if (!isMounted || hasUserChangedThemeRef.current) {
          return;
        }

        themeModeRef.current = savedThemeMode;
        setThemeModeState(savedThemeMode);
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const isDark =
    themeMode === 'system'
      ? systemScheme === 'dark'
      : themeMode === 'dark';

  const useSystemTheme = themeMode === 'system';

  function applyThemeMode(mode: ThemeMode) {
    themeModeRef.current = mode;
    setThemeModeState(mode);
    void persistThemeMode(mode).catch(() => undefined);
  }

  function setThemeMode(mode: ThemeMode) {
    hasUserChangedThemeRef.current = true;
    applyThemeMode(mode);
  }

  function setUseSystemTheme(value: boolean) {
    const current = themeModeRef.current;
    let nextThemeMode = current;

    if (value) {
      nextThemeMode = 'system';
    } else if (current === 'system') {
      nextThemeMode = systemScheme === 'dark' ? 'dark' : 'light';
    }

    hasUserChangedThemeRef.current = true;
    applyThemeMode(nextThemeMode);
  }

  function toggleManualTheme() {
    const current = themeModeRef.current;
    const nextThemeMode =
      current === 'system'
        ? systemScheme === 'dark'
          ? 'light'
          : 'dark'
        : current === 'dark'
          ? 'light'
          : 'dark';

    hasUserChangedThemeRef.current = true;
    applyThemeMode(nextThemeMode);
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
