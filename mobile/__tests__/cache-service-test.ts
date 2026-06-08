import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearCacheByPrefix,
  getCacheUserIdFromToken,
  isCacheFresh,
  LOCAL_CACHE_SCHEMA_VERSION,
  readCache,
  removeCache,
  writeCache,
} from '../services/cache';

function makeToken(userId: string) {
  const payload = btoa(JSON.stringify({ sub: userId }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `header.${payload}.signature`;
}

describe('cache service', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('grava e le cache com namespace do sub do JWT local', async () => {
    await AsyncStorage.setItem('auth_token', makeToken('user-1'));

    const record = await writeCache(
      'profile/me',
      { id: 'user-1', name: 'Ana' },
      { ttlMs: 1000, now: 100 },
    );
    const cached = await readCache<{ id: string; name: string }>('profile/me');

    expect(record).toEqual({
      schemaVersion: LOCAL_CACHE_SCHEMA_VERSION,
      key: 'profile/me',
      value: { id: 'user-1', name: 'Ana' },
      writtenAt: 100,
      expiresAt: 1100,
    });
    expect(cached?.value.name).toBe('Ana');
    expect(isCacheFresh(cached, 500)).toBe(true);
    expect(isCacheFresh(cached, 1200)).toBe(false);
  });

  it('isola caches por usuario e limpa por prefixo', async () => {
    await AsyncStorage.setItem('auth_token', makeToken('user-1'));
    await writeCache('clubs/my', [{ id: 'club-1' }], { ttlMs: 1000 });
    await writeCache('clubs/details/club-1', { id: 'club-1' }, { ttlMs: 1000 });

    await AsyncStorage.setItem('auth_token', makeToken('user-2'));
    expect(await readCache('clubs/my')).toBeNull();

    await AsyncStorage.setItem('auth_token', makeToken('user-1'));
    await clearCacheByPrefix('clubs/');

    expect(await readCache('clubs/my')).toBeNull();
    expect(await readCache('clubs/details/club-1')).toBeNull();
  });

  it('remove JSON corrompido em leitura tolerante', async () => {
    await AsyncStorage.setItem('auth_token', makeToken('user-1'));
    await AsyncStorage.setItem(
      'tod:local-cache:v1:user:user-1:feed/main',
      '{nao-json',
    );

    await expect(readCache('feed/main')).resolves.toBeNull();
    await expect(
      AsyncStorage.getItem('tod:local-cache:v1:user:user-1:feed/main'),
    ).resolves.toBeNull();
  });

  it('remove item por chave e recusa campos sensiveis', async () => {
    await AsyncStorage.setItem('auth_token', makeToken('user-1'));
    await writeCache('feed/main', [{ id: 'item-1' }], { ttlMs: 1000 });
    await removeCache('feed/main');

    expect(await readCache('feed/main')).toBeNull();
    await expect(
      writeCache('profile/me', { authToken: 'segredo' }, { ttlMs: 1000 }),
    ).rejects.toThrow('campo sensivel');
  });

  it('extrai sub do JWT quando possivel', () => {
    expect(getCacheUserIdFromToken(makeToken('user-abc'))).toBe('user-abc');
    expect(getCacheUserIdFromToken('token-invalido')).toBeNull();
  });
});
