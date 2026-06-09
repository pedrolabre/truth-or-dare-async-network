import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useProfileScreen } from '../hooks/useProfileScreen';
import { getMyProfile } from '../services/api';
import { LOCAL_CACHE_KEYS, LOCAL_CACHE_TTLS, writeCache } from '../services/cache';
import type { MyProfileResponse } from '../services/api';

jest.mock('../services/api', () => ({
  getMyProfile: jest.fn(),
  updateMyProfile: jest.fn(),
}));

function makeToken(userId: string) {
  const payload = btoa(JSON.stringify({ sub: userId }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `header.${payload}.signature`;
}

function makeProfile(overrides: Partial<MyProfileResponse> = {}): MyProfileResponse {
  return {
    id: 'user-1',
    name: 'Perfil Fresco',
    email: 'user@test.com',
    username: 'perfil',
    bio: 'Bio fresca',
    avatarUrl: null,
    isPrivate: false,
    createdAt: '2026-06-01T12:00:00.000Z',
    createdTruthsCount: 1,
    createdDaresCount: 2,
    stats: {
      createdTruthsCount: 1,
      createdDaresCount: 2,
      activePublicClubsCount: 0,
      publishedClubPromptsCount: 0,
    },
    publicClubs: [],
    ...overrides,
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

describe('useProfileScreen cache', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    await AsyncStorage.setItem('auth_token', makeToken('user-1'));
  });

  it('renderiza perfil cacheado antes da sincronizacao do backend', async () => {
    await writeCache(
      LOCAL_CACHE_KEYS.profileMe,
      makeProfile({ name: 'Perfil Cacheado' }),
      { ttlMs: LOCAL_CACHE_TTLS.profileMe },
    );
    const deferred = createDeferred<MyProfileResponse>();
    (getMyProfile as jest.Mock).mockReturnValue(deferred.promise);

    const { result } = renderHook(() => useProfileScreen());

    await waitFor(() => {
      expect(result.current.profile?.name).toBe('Perfil Cacheado');
      expect(result.current.isFromCache).toBe(true);
    });
    deferred.resolve(makeProfile({ name: 'Perfil Fresco' }));
    await waitFor(() => {
      expect(result.current.profile?.name).toBe('Perfil Fresco');
      expect(result.current.isFromCache).toBe(false);
    });
  });

  it('mantem perfil cacheado quando sincronizacao falha', async () => {
    await writeCache(
      LOCAL_CACHE_KEYS.profileMe,
      makeProfile({ name: 'Perfil Offline' }),
      { ttlMs: LOCAL_CACHE_TTLS.profileMe },
    );
    (getMyProfile as jest.Mock).mockRejectedValue(new Error('Offline'));

    const { result } = renderHook(() => useProfileScreen());

    await waitFor(() => {
      expect(result.current.profile?.name).toBe('Perfil Offline');
      expect(result.current.isFromCache).toBe(true);
      expect(result.current.syncErrorMessage).toBe('Offline');
    });
  });
});
