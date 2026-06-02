import React, { type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { ThemeProvider, useTheme } from '../context/ThemeContext';
import {
  getUserPreferences,
  updateUserPreferences,
} from '../services/api';
import {
  loadThemeModePreference,
  saveThemeMode,
} from '../services/settingsStorage';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../services/settingsStorage', () => ({
  loadThemeModePreference: jest.fn(),
  saveThemeMode: jest.fn(),
}));

jest.mock('../services/api', () => ({
  getUserPreferences: jest.fn(),
  updateUserPreferences: jest.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('ThemeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useColorScheme as jest.Mock).mockReturnValue('light');
    (loadThemeModePreference as jest.Mock).mockResolvedValue({
      themeMode: 'system',
      hasStoredThemeMode: true,
    });
    (saveThemeMode as jest.Mock).mockResolvedValue(undefined);
    (getUserPreferences as jest.Mock).mockResolvedValue({
      preferences: {
        themeMode: 'system',
        language: 'pt-BR',
        reduceMotion: false,
        largeText: false,
        highContrast: false,
      },
      items: [],
    });
    (updateUserPreferences as jest.Mock).mockResolvedValue({
      preferences: {
        themeMode: 'system',
        language: 'pt-BR',
        reduceMotion: false,
        largeText: false,
        highContrast: false,
      },
      items: [],
    });
  });

  it('renderiza imediatamente com system enquanto a leitura esta pendente', () => {
    (loadThemeModePreference as jest.Mock).mockReturnValue(
      new Promise(() => undefined),
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.themeMode).toBe('system');
    expect(result.current.useSystemTheme).toBe(true);
  });

  it('aplica o tema persistido quando a leitura termina', async () => {
    (loadThemeModePreference as jest.Mock).mockResolvedValue({
      themeMode: 'dark',
      hasStoredThemeMode: true,
    });

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.themeMode).toBe('system');

    await waitFor(() => {
      expect(result.current.themeMode).toBe('dark');
    });

    expect(result.current.isDark).toBe(true);
  });

  it('persiste alteracao feita por setThemeMode', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    await waitFor(() => {
      expect(loadThemeModePreference).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.setThemeMode('dark');
    });

    expect(result.current.themeMode).toBe('dark');
    expect(saveThemeMode).toHaveBeenCalledWith('dark');
    expect(updateUserPreferences).toHaveBeenCalledWith({ themeMode: 'dark' });
  });

  it('persiste alteracao feita por setUseSystemTheme', async () => {
    (loadThemeModePreference as jest.Mock).mockResolvedValue({
      themeMode: 'dark',
      hasStoredThemeMode: true,
    });
    const { result } = renderHook(() => useTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current.themeMode).toBe('dark');
    });

    act(() => {
      result.current.setUseSystemTheme(true);
    });

    expect(result.current.themeMode).toBe('system');
    expect(saveThemeMode).toHaveBeenCalledWith('system');
    expect(updateUserPreferences).toHaveBeenCalledWith({ themeMode: 'system' });
  });

  it('persiste alteracao feita por toggleManualTheme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.toggleManualTheme();
    });

    expect(result.current.themeMode).toBe('dark');
    expect(saveThemeMode).toHaveBeenCalledWith('dark');
    expect(updateUserPreferences).toHaveBeenCalledWith({ themeMode: 'dark' });
  });

  it('mantem renderizacao quando a leitura falha', async () => {
    (loadThemeModePreference as jest.Mock).mockRejectedValue(
      new Error('storage read failed'),
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    await waitFor(() => {
      expect(loadThemeModePreference).toHaveBeenCalledTimes(1);
    });

    expect(result.current.themeMode).toBe('system');
    expect(result.current.useSystemTheme).toBe(true);
  });

  it('preserva alteracao em memoria quando a escrita falha', async () => {
    (saveThemeMode as jest.Mock).mockRejectedValue(
      new Error('storage write failed'),
    );
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setThemeMode('dark');
    });

    await waitFor(() => {
      expect(saveThemeMode).toHaveBeenCalledWith('dark');
    });

    expect(result.current.themeMode).toBe('dark');
  });

  it('restaura tema remoto quando nao existe preferencia local especifica', async () => {
    (loadThemeModePreference as jest.Mock).mockResolvedValue({
      themeMode: 'system',
      hasStoredThemeMode: false,
    });
    (getUserPreferences as jest.Mock).mockResolvedValue({
      preferences: {
        themeMode: 'dark',
        language: 'pt-BR',
        reduceMotion: false,
        largeText: false,
        highContrast: false,
      },
      items: [],
    });

    const { result } = renderHook(() => useTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current.themeMode).toBe('dark');
    });

    expect(saveThemeMode).toHaveBeenCalledWith('dark');
  });

  it('mantem tema local quando a leitura remota falha', async () => {
    (loadThemeModePreference as jest.Mock).mockResolvedValue({
      themeMode: 'system',
      hasStoredThemeMode: false,
    });
    (getUserPreferences as jest.Mock).mockRejectedValue(
      new Error('remote sync failed'),
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    await waitFor(() => {
      expect(getUserPreferences).toHaveBeenCalledTimes(1);
    });

    expect(result.current.themeMode).toBe('system');
  });

  it('nao sobrescreve escolha do usuario quando a leitura pendente termina', async () => {
    let resolveThemeMode: (mode: 'system' | 'light' | 'dark') => void = () =>
      undefined;
    (loadThemeModePreference as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveThemeMode = (mode) =>
          resolve({
            themeMode: mode,
            hasStoredThemeMode: true,
          });
      }),
    );
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setThemeMode('light');
    });

    await act(async () => {
      resolveThemeMode('dark');
    });

    expect(result.current.themeMode).toBe('light');
  });
});
