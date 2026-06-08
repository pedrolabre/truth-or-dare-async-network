import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadCachedResource } from '../services/cachedApi';

function makeToken(userId: string) {
  const payload = btoa(JSON.stringify({ sub: userId }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `header.${payload}.signature`;
}

describe('cached api helper', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    await AsyncStorage.setItem('auth_token', makeToken('user-1'));
  });

  it('renderiza cache imediatamente e depois retorna valor fresco', async () => {
    const cacheHits: string[] = [];
    const firstResult = await loadCachedResource({
      key: 'feed/main',
      ttlMs: 1000,
      fetcher: jest.fn().mockResolvedValue(['fresh']),
    });

    expect(firstResult).toMatchObject({
      value: ['fresh'],
      isFromCache: false,
      syncErrorMessage: null,
    });

    const secondResult = await loadCachedResource<string[]>({
      key: 'feed/main',
      ttlMs: 1000,
      fetcher: jest.fn().mockResolvedValue(['fresh-2']),
      onCacheHit: ({ record }) => {
        cacheHits.push(record.value[0]);
      },
    });

    expect(cacheHits).toEqual(['fresh']);
    expect(secondResult.value).toEqual(['fresh-2']);
    expect(secondResult.isFromCache).toBe(false);
  });

  it('preserva cache e expoe erro de sincronizacao quando API falha', async () => {
    await loadCachedResource({
      key: 'clubs/my',
      ttlMs: 1000,
      fetcher: jest.fn().mockResolvedValue([{ id: 'club-1' }]),
    });

    const result = await loadCachedResource<Array<{ id: string }>>({
      key: 'clubs/my',
      ttlMs: 1000,
      fetcher: jest.fn().mockRejectedValue(new Error('Offline')),
    });

    expect(result.value).toEqual([{ id: 'club-1' }]);
    expect(result.isFromCache).toBe(true);
    expect(result.syncErrorMessage).toBe('Offline');
  });

  it('retorna valor fresco mesmo quando escrita do cache falha', async () => {
    jest
      .spyOn(AsyncStorage, 'setItem')
      .mockRejectedValueOnce(new Error('AsyncStorage indisponivel'));

    const result = await loadCachedResource({
      key: 'feed/main',
      ttlMs: 1000,
      fetcher: jest.fn().mockResolvedValue(['fresh']),
    });

    expect(result).toMatchObject({
      value: ['fresh'],
      isFromCache: false,
      syncErrorMessage: null,
    });
  });

  it('propaga erro da API quando nao existe cache utilizavel', async () => {
    await expect(
      loadCachedResource({
        key: 'profile/me',
        ttlMs: 1000,
        fetcher: jest.fn().mockRejectedValue(new Error('Falha')),
      }),
    ).rejects.toThrow('Falha');
  });
});
