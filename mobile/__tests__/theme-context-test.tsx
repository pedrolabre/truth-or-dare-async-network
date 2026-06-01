import React, { type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { ThemeProvider, useTheme } from '../context/ThemeContext';
import {
  loadThemeMode,
  saveThemeMode,
} from '../services/settingsStorage';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../services/settingsStorage', () => ({
  loadThemeMode: jest.fn(),
  saveThemeMode: jest.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('ThemeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useColorScheme as jest.Mock).mockReturnValue('light');
    (loadThemeMode as jest.Mock).mockResolvedValue('system');
    (saveThemeMode as jest.Mock).mockResolvedValue(undefined);
  });

  it('renderiza imediatamente com system enquanto a leitura esta pendente', () => {
    (loadThemeMode as jest.Mock).mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.themeMode).toBe('system');
    expect(result.current.useSystemTheme).toBe(true);
  });

  it('aplica o tema persistido quando a leitura termina', async () => {
    (loadThemeMode as jest.Mock).mockResolvedValue('dark');

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
      expect(loadThemeMode).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.setThemeMode('dark');
    });

    expect(result.current.themeMode).toBe('dark');
    expect(saveThemeMode).toHaveBeenCalledWith('dark');
  });

  it('persiste alteracao feita por setUseSystemTheme', async () => {
    (loadThemeMode as jest.Mock).mockResolvedValue('dark');
    const { result } = renderHook(() => useTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current.themeMode).toBe('dark');
    });

    act(() => {
      result.current.setUseSystemTheme(true);
    });

    expect(result.current.themeMode).toBe('system');
    expect(saveThemeMode).toHaveBeenCalledWith('system');
  });

  it('persiste alteracao feita por toggleManualTheme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.toggleManualTheme();
    });

    expect(result.current.themeMode).toBe('dark');
    expect(saveThemeMode).toHaveBeenCalledWith('dark');
  });

  it('mantem renderizacao quando a leitura falha', async () => {
    (loadThemeMode as jest.Mock).mockRejectedValue(
      new Error('storage read failed'),
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    await waitFor(() => {
      expect(loadThemeMode).toHaveBeenCalledTimes(1);
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

  it('nao sobrescreve escolha do usuario quando a leitura pendente termina', async () => {
    let resolveThemeMode: (mode: 'system' | 'light' | 'dark') => void =
      () => undefined;
    (loadThemeMode as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveThemeMode = resolve;
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
