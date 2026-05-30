import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getPublicUserProfile,
  getRecommendedUsers,
  getTrendingClubs,
  searchAll,
  searchClubs,
  searchUsers,
} from '../services/api';
import type { SearchApiClubItem, SearchApiUserItem } from '../types/search';

function makeJsonResponse(
  ok: boolean,
  status: number,
  body: Record<string, unknown> | unknown[],
): Response {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn(),
  } as unknown as Response;
}

function makeApiUser(
  overrides: Partial<SearchApiUserItem> = {},
): SearchApiUserItem {
  return {
    id: 'user-1',
    name: 'Marina Busca',
    username: 'marina_busca',
    bio: 'Gosta de desafios em grupo.',
    avatarUrl: 'https://example.com/avatar.png',
    level: 4,
    mutualCount: 2,
    ...overrides,
  };
}

function makeApiClub(
  overrides: Partial<SearchApiClubItem> = {},
): SearchApiClubItem {
  return {
    id: 'club-1',
    slug: 'noite-dos-desafios',
    name: 'Noite dos Desafios',
    description: 'Clube para desafios leves.',
    iconName: 'celebration',
    avatarUrl: 'https://example.com/club.png',
    memberCount: 42,
    isTrending: true,
    tags: ['noite', 'desafio'],
    ...overrides,
  };
}

describe('search API client', () => {
  const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_URL = 'https://api.test';
    global.fetch = fetchMock;
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token-123');
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
  });

  it('busca resultados unificados com URL segura, token, limit, AbortSignal e mappers', async () => {
    const signal = new AbortController().signal;
    fetchMock.mockResolvedValue(
      makeJsonResponse(true, 200, {
        users: {
          items: [makeApiUser()],
          nextCursor: null,
        },
        clubs: {
          items: [makeApiClub()],
          nextCursor: null,
        },
      }),
    );

    await expect(searchAll('  Marina e Clube  ', 8, signal)).resolves.toEqual({
      users: [
        expect.objectContaining({
          id: 'user-1',
          name: 'Marina Busca',
          levelLabel: 'Nivel 4',
          mutualCount: 2,
        }),
      ],
      clubs: [
        expect.objectContaining({
          id: 'club-1',
          name: 'Noite dos Desafios',
          memberCountLabel: '42 membros',
          badgeLabel: 'Em alta',
        }),
      ],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/search?query=Marina+e+Clube&limit=8',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        },
        signal,
      },
    );
  });

  it('busca usuarios com cursor, limit, token, AbortSignal e preserva nextCursor', async () => {
    const signal = new AbortController().signal;
    fetchMock.mockResolvedValue(
      makeJsonResponse(true, 200, {
        items: [makeApiUser({ id: 'user-2', level: null })],
        nextCursor: 'user-2',
      }),
    );

    await expect(
      searchUsers(' marina ', 'cursor-1', 12, signal),
    ).resolves.toEqual({
      items: [
        expect.objectContaining({
          id: 'user-2',
          level: null,
          levelLabel: 'Nivel inicial',
        }),
      ],
      nextCursor: 'user-2',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/search/users?query=marina&cursor=cursor-1&limit=12',
      expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        },
        signal,
      }),
    );
  });

  it('omite cursor vazio e limit invalido ao montar URL de usuarios', async () => {
    fetchMock.mockResolvedValue(
      makeJsonResponse(true, 200, {
        items: [],
        nextCursor: null,
      }),
    );

    await expect(searchUsers(' marina ', '   ', Number.NaN)).resolves.toEqual({
      items: [],
      nextCursor: null,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/search/users?query=marina',
      expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        },
      }),
    );
  });

  it('busca clubes com cursor, limit, token, AbortSignal e preserva nextCursor', async () => {
    const signal = new AbortController().signal;
    fetchMock.mockResolvedValue(
      makeJsonResponse(true, 200, {
        items: [
          makeApiClub({
            id: 'club-2',
            memberCount: 1,
            isTrending: false,
          }),
        ],
        nextCursor: 'club-2',
      }),
    );

    await expect(
      searchClubs(' desafios ', 'cursor-2', 6, signal),
    ).resolves.toEqual({
      items: [
        expect.objectContaining({
          id: 'club-2',
          memberCount: 1,
          memberCountLabel: '1 membro',
          badgeLabel: undefined,
        }),
      ],
      nextCursor: 'club-2',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/search/clubs?query=desafios&cursor=cursor-2&limit=6',
      expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        },
        signal,
      }),
    );
  });

  it('busca usuarios recomendados no endpoint de descoberta e aplica mapper', async () => {
    fetchMock.mockResolvedValue(
      makeJsonResponse(true, 200, [
        makeApiUser({
          id: 'recommended-1',
          username: '@usuario_recomendado',
        }),
      ]),
    );

    await expect(getRecommendedUsers()).resolves.toEqual([
      expect.objectContaining({
        id: 'recommended-1',
        username: 'usuario_recomendado',
        levelLabel: 'Nivel 4',
      }),
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/search/recommended/users',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        },
      },
    );
  });

  it('busca clubes em alta no endpoint de descoberta e aplica mapper', async () => {
    fetchMock.mockResolvedValue(
      makeJsonResponse(true, 200, [
        makeApiClub({
          id: 'trending-1',
          iconName: null,
          avatarUrl: null,
        }),
      ]),
    );

    await expect(getTrendingClubs()).resolves.toEqual([
      expect.objectContaining({
        id: 'trending-1',
        iconName: 'groups',
        imageUrl: undefined,
        badgeLabel: 'Em alta',
      }),
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/search/trending/clubs',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        },
      },
    );
  });

  it('busca perfil publico de usuario sem exigir token', async () => {
    fetchMock.mockResolvedValue(
      makeJsonResponse(true, 200, {
        id: 'user-public-1',
        name: 'Perfil Publico',
        username: 'perfil_publico',
        bio: 'Bio publica',
        avatarUrl: null,
        level: null,
        levelLabel: 'Nivel indisponivel',
        stats: {
          createdTruthsCount: 1,
          createdDaresCount: 2,
          activePublicClubsCount: 3,
          publishedClubPromptsCount: 4,
        },
      }),
    );

    await expect(getPublicUserProfile('user-public-1')).resolves.toMatchObject({
      id: 'user-public-1',
      stats: {
        activePublicClubsCount: 3,
      },
    });

    expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/users/user-public-1/public',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  });

  it('reaproveita parseResponse para propagar erro da API de busca', async () => {
    fetchMock.mockResolvedValue(
      makeJsonResponse(false, 503, {
        error: 'Busca indisponivel',
        code: 'SEARCH_UNAVAILABLE',
      }),
    );

    await expect(searchAll('marina')).rejects.toThrow('Busca indisponivel');
  });

  it('interrompe chamadas autenticadas quando nao ha token salvo', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    await expect(searchUsers('marina')).rejects.toThrow(
      'Token nÃ£o encontrado',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
