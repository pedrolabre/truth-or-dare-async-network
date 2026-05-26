import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useNotificationsUnreadCount } from '../hooks/useNotificationsUnreadCount';

describe('useNotificationsUnreadCount', () => {
  it('carrega o contador unico de notificacoes ao montar', async () => {
    const loadUnreadNotificationsCount = jest.fn().mockResolvedValue({
      unreadCount: 7,
    });

    const { result } = renderHook(() =>
      useNotificationsUnreadCount({ loadUnreadNotificationsCount }),
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(7);
    });

    expect(loadUnreadNotificationsCount).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.errorMessage).toBeNull();
  });

  it('normaliza contador negativo retornado pela API', async () => {
    const loadUnreadNotificationsCount = jest.fn().mockResolvedValue({
      unreadCount: -2,
    });

    const { result } = renderHook(() =>
      useNotificationsUnreadCount({ loadUnreadNotificationsCount }),
    );

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(0);
    });
  });

  it('permite recarga manual sem carregar automaticamente', async () => {
    const loadUnreadNotificationsCount = jest.fn().mockResolvedValue({
      unreadCount: 3,
    });

    const { result } = renderHook(() =>
      useNotificationsUnreadCount({
        loadUnreadNotificationsCount,
        loadOnMount: false,
      }),
    );

    expect(result.current.unreadCount).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(loadUnreadNotificationsCount).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.loadUnreadCount();
    });

    expect(loadUnreadNotificationsCount).toHaveBeenCalledTimes(1);
    expect(result.current.unreadCount).toBe(3);
  });

  it('mantem contador anterior quando uma recarga falha', async () => {
    const loadUnreadNotificationsCount = jest
      .fn()
      .mockResolvedValueOnce({ unreadCount: 5 })
      .mockRejectedValueOnce(new Error('Falha de rede'));

    const { result } = renderHook(() =>
      useNotificationsUnreadCount({ loadUnreadNotificationsCount }),
    );

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(5);
    });

    await act(async () => {
      await result.current.loadUnreadCount();
    });

    expect(result.current.unreadCount).toBe(5);
    expect(result.current.errorMessage).toBe('Falha de rede');
    expect(result.current.isLoading).toBe(false);
  });
});
