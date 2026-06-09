import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  CLUBS_SEARCH_DEBOUNCE_MS,
  useClubsScreen,
} from '../hooks/useClubsScreen';
import {
  discoverClubs,
  getMyClubs,
  joinClub,
  searchClubs,
} from '../services/clubsApi';
import { LOCAL_CACHE_KEYS, LOCAL_CACHE_TTLS, writeCache } from '../services/cache';
import type {
  ClubMemberApi,
  ClubSummaryApi,
  DiscoverClubsApi,
} from '../types/clubsApi';

jest.mock('../services/clubsApi', () => ({
  discoverClubs: jest.fn(),
  getMyClubs: jest.fn(),
  joinClub: jest.fn(),
  searchClubs: jest.fn(),
}));

const mockedDiscoverClubs = discoverClubs as jest.MockedFunction<
  typeof discoverClubs
>;
const mockedGetMyClubs = getMyClubs as jest.MockedFunction<typeof getMyClubs>;
const mockedJoinClub = joinClub as jest.MockedFunction<typeof joinClub>;
const mockedSearchClubs = searchClubs as jest.MockedFunction<
  typeof searchClubs
>;

const DEFAULT_VIEWER_ACTIVITY = {
  unreadCount: 0,
  lastSeenAt: null,
  mutedUntil: null,
  isMuted: false,
};

function makeToken(userId: string) {
  const payload = btoa(JSON.stringify({ sub: userId }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `header.${payload}.signature`;
}

type ClubSummaryOverrides = Partial<Omit<ClubSummaryApi, 'viewerMembership'>> & {
  viewerMembership?: Partial<ClubSummaryApi['viewerMembership']>;
};

function makeClubSummary(overrides: ClubSummaryOverrides = {}): ClubSummaryApi {
  const baseClub: ClubSummaryApi = {
    id: 'club-1',
    slug: 'bons-desafios',
    name: 'Bons Desafios',
    description: 'Um clube para desafios leves.',
    iconName: 'sports-esports',
    avatarUrl: null,
    visibility: 'public',
    status: 'active',
    memberCount: 2,
    promptCount: 4,
    lastActivityAt: '2026-05-18T12:00:00.000Z',
    viewerMembership: {
      isMember: true,
      role: 'owner',
      status: 'active',
    },
  };

  return {
    ...baseClub,
    ...overrides,
    viewerMembership: {
      ...baseClub.viewerMembership,
      ...overrides.viewerMembership,
    },
  };
}

function makeClubMember(
  overrides: Partial<ClubMemberApi> = {},
): ClubMemberApi {
  return {
    id: 'member-1',
    clubId: 'club-1',
    userId: 'user-1',
    name: 'Pedro',
    username: 'pedro',
    role: 'member',
    status: 'active',
    joinedAt: '2026-05-18T12:00:00.000Z',
    lastSeenAt: null,
    mutedUntil: null,
    postingSuspendedUntil: null,
    createdAt: '2026-05-18T12:00:00.000Z',
    updatedAt: '2026-05-18T12:00:00.000Z',
    ...overrides,
  };
}

function makeDiscoverResponse(
  overrides: Partial<DiscoverClubsApi> = {},
): DiscoverClubsApi {
  return {
    suggested: [],
    popular: [],
    recent: [],
    ...overrides,
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return {
    promise,
    reject,
    resolve,
  };
}

async function advanceSearchDebounce() {
  await act(async () => {
    jest.advanceTimersByTime(CLUBS_SEARCH_DEBOUNCE_MS);
    await Promise.resolve();
  });
}

describe('useClubsScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useRealTimers();
    await AsyncStorage.clear();
    mockedGetMyClubs.mockResolvedValue([]);
    mockedDiscoverClubs.mockResolvedValue(makeDiscoverResponse());
    mockedJoinClub.mockResolvedValue(makeClubMember());
    mockedSearchClubs.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('carrega Meus Clubes ao abrir a tela', async () => {
    mockedGetMyClubs.mockResolvedValue([makeClubSummary()]);

    const { result } = renderHook(() => useClubsScreen());

    expect(result.current.isInitialLoading).toBe(true);
    expect(result.current.activeContentState).toBe('loading');

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('list');
    });

    expect(mockedGetMyClubs).toHaveBeenCalledTimes(1);
    expect(mockedDiscoverClubs).not.toHaveBeenCalled();
    expect(mockedSearchClubs).not.toHaveBeenCalled();
    expect(result.current.myClubs).toEqual([
      {
        id: 'club-1',
        name: 'Bons Desafios',
        description: 'Um clube para desafios leves.',
        memberCount: 2,
        membersLabel: '2 membros',
        statusLabel: 'Dono',
        iconName: 'sports-esports',
        isActive: true,
        viewerActivity: DEFAULT_VIEWER_ACTIVITY,
        unreadCount: 0,
        hasUnreadActivity: false,
      },
    ]);
    expect(result.current.activeContentState).toBe('list');
  });

  it('representa resposta vazia em Meus Clubes', async () => {
    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    expect(result.current.myClubs).toEqual([]);
    expect(result.current.isMyClubsEmpty).toBe(true);
    expect(result.current.errorMessage).toBeNull();
  });

  it('representa erro ao carregar Meus Clubes', async () => {
    mockedGetMyClubs.mockRejectedValue(new Error('Falha de rede'));

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('error');
    });

    expect(result.current.myClubs).toEqual([]);
    expect(result.current.errorMessage).toBe('Falha de rede');
    expect(result.current.activeContentState).toBe('error');
  });

  it('não carrega Descobrir na abertura inicial', async () => {
    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    expect(result.current.activeTab).toBe('my-clubs');
    expect(result.current.discoverContentState).toBe('empty');
    expect(mockedDiscoverClubs).not.toHaveBeenCalled();
    expect(mockedSearchClubs).not.toHaveBeenCalled();
  });

  it('carrega Descobrir ao trocar de aba e deduplica os grupos reais', async () => {
    mockedDiscoverClubs.mockResolvedValue(
      makeDiscoverResponse({
        suggested: [
          makeClubSummary({
            id: 'club-1',
            name: 'Clube Sugerido',
            viewerMembership: {
              isMember: false,
              role: null,
              status: null,
            },
          }),
        ],
        popular: [
          makeClubSummary({
            id: 'club-1',
            name: 'Duplicado Popular',
            memberCount: 50,
          }),
          makeClubSummary({
            id: 'club-2',
            name: 'Clube Popular',
            memberCount: 12,
            viewerMembership: {
              isMember: false,
              role: null,
              status: null,
            },
          }),
        ],
        recent: [
          makeClubSummary({
            id: 'club-3',
            name: 'Clube Novo',
            memberCount: 1,
            viewerMembership: {
              isMember: false,
              role: null,
              status: null,
            },
          }),
          makeClubSummary({
            id: 'club-2',
            name: 'Duplicado Recente',
          }),
        ],
      }),
    );

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    expect(mockedDiscoverClubs).not.toHaveBeenCalled();

    act(() => {
      result.current.handleChangeTab('discover');
    });

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('list');
    });

    expect(result.current.activeTab).toBe('discover');
    expect(mockedDiscoverClubs).toHaveBeenCalledTimes(1);
    expect(result.current.discoverClubs).toEqual([
      {
        id: 'club-1',
        name: 'Clube Sugerido',
        description: 'Um clube para desafios leves.',
        memberCount: 2,
        membersLabel: '2 membros',
        badgeLabel: 'Sugestão',
        iconName: 'sports-esports',
        isTrending: false,
        isMember: false,
        membershipStatus: null,
      },
      {
        id: 'club-2',
        name: 'Clube Popular',
        description: 'Um clube para desafios leves.',
        memberCount: 12,
        membersLabel: '12 membros',
        badgeLabel: 'Popular',
        iconName: 'sports-esports',
        isTrending: true,
        isMember: false,
        membershipStatus: null,
      },
      {
        id: 'club-3',
        name: 'Clube Novo',
        description: 'Um clube para desafios leves.',
        memberCount: 1,
        membersLabel: '1 membro',
        badgeLabel: 'Novo',
        iconName: 'sports-esports',
        isTrending: false,
        isMember: false,
        membershipStatus: null,
      },
    ]);
    expect(result.current.visibleDiscoverClubs).toEqual(
      result.current.discoverClubs,
    );
    expect(mockedSearchClubs).not.toHaveBeenCalled();

    act(() => {
      result.current.handleChangeTab('my-clubs');
      result.current.handleChangeTab('discover');
    });

    expect(mockedDiscoverClubs).toHaveBeenCalledTimes(1);
  });

  it('representa loading e vazio de Descobrir', async () => {
    const discoverDeferred = createDeferred<DiscoverClubsApi>();
    mockedDiscoverClubs.mockReturnValue(discoverDeferred.promise);

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    act(() => {
      result.current.handleChangeTab('discover');
    });

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('loading');
    });

    expect(result.current.activeContentState).toBe('loading');
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      discoverDeferred.resolve(makeDiscoverResponse());
      await discoverDeferred.promise;
    });

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('empty');
    });

    expect(result.current.isDiscoverEmpty).toBe(true);
    expect(result.current.errorMessage).toBeNull();
  });

  it('representa erro de Descobrir sem contaminar Meus Clubes', async () => {
    mockedDiscoverClubs.mockRejectedValue(new Error('Falha na descoberta'));

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    act(() => {
      result.current.handleChangeTab('discover');
    });

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('error');
    });

    expect(result.current.activeContentState).toBe('error');
    expect(result.current.errorMessage).toBe('Falha na descoberta');

    act(() => {
      result.current.handleChangeTab('my-clubs');
    });

    expect(result.current.myClubsContentState).toBe('empty');
    expect(result.current.errorMessage).toBeNull();
  });

  it('debounce evita chamada imediata de searchClubs ao alterar query', async () => {
    mockedDiscoverClubs.mockResolvedValue(
      makeDiscoverResponse({
        suggested: [makeClubSummary()],
      }),
    );

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    act(() => {
      result.current.handleChangeTab('discover');
    });

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('list');
    });

    jest.useFakeTimers();

    act(() => {
      result.current.setQuery('desafios');
    });

    expect(result.current.hasSearchQuery).toBe(true);
    expect(result.current.discoverContentState).toBe('loading');
    expect(mockedSearchClubs).not.toHaveBeenCalled();
    jest.clearAllTimers();
  });

  it('executa busca remota com debounce e usa resultados reais', async () => {
    mockedDiscoverClubs.mockResolvedValue(
      makeDiscoverResponse({
        suggested: [
          makeClubSummary({
            id: 'discover-1',
            name: 'Clube Descoberto',
            viewerMembership: {
              isMember: false,
              role: null,
              status: null,
            },
          }),
        ],
      }),
    );
    mockedSearchClubs.mockResolvedValue([
      makeClubSummary({
        id: 'search-1',
        name: 'Clube Buscado',
        memberCount: 7,
        viewerMembership: {
          isMember: false,
          role: null,
          status: null,
        },
      }),
    ]);

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    act(() => {
      result.current.handleChangeTab('discover');
    });

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('list');
    });

    jest.useFakeTimers();

    act(() => {
      result.current.setQuery('des');
      result.current.setQuery('desafios');
    });

    expect(mockedSearchClubs).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(CLUBS_SEARCH_DEBOUNCE_MS - 1);
      await Promise.resolve();
    });

    expect(mockedSearchClubs).not.toHaveBeenCalled();

    await advanceSearchDebounce();

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('search-results');
    });

    expect(mockedSearchClubs).toHaveBeenCalledTimes(1);
    expect(mockedSearchClubs).toHaveBeenCalledWith('desafios');
    expect(result.current.searchResults).toEqual([
      {
        id: 'search-1',
        name: 'Clube Buscado',
        description: 'Um clube para desafios leves.',
        memberCount: 7,
        membersLabel: '7 membros',
        badgeLabel: 'Busca',
        iconName: 'sports-esports',
        isTrending: false,
        isMember: false,
        membershipStatus: null,
      },
    ]);
    expect(result.current.visibleDiscoverClubs).toEqual(
      result.current.searchResults,
    );
  });

  it('usa search-empty quando a busca remota retorna vazia', async () => {
    mockedDiscoverClubs.mockResolvedValue(
      makeDiscoverResponse({
        suggested: [
          makeClubSummary({
            id: 'discover-1',
            name: 'Clube Descoberto',
            viewerMembership: {
              isMember: false,
              role: null,
              status: null,
            },
          }),
        ],
      }),
    );
    mockedSearchClubs.mockResolvedValue([]);

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    act(() => {
      result.current.handleChangeTab('discover');
    });

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('list');
    });

    jest.useFakeTimers();

    act(() => {
      result.current.setQuery('sem resultado');
    });

    await advanceSearchDebounce();

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('search-empty');
    });

    expect(mockedSearchClubs).toHaveBeenCalledWith('sem resultado');
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.visibleDiscoverClubs).toEqual([]);
    expect(result.current.discoverClubs[0].name).toBe('Clube Descoberto');
  });

  it('nao chama searchClubs na aba Meus Clubes', async () => {
    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    jest.useFakeTimers();

    act(() => {
      result.current.setQuery('desafios');
    });

    await advanceSearchDebounce();

    expect(result.current.activeTab).toBe('my-clubs');
    expect(result.current.activeContentState).toBe('empty');
    expect(mockedSearchClubs).not.toHaveBeenCalled();
  });

  it('query vazia volta para a descoberta carregada', async () => {
    const discoverClub = makeClubSummary({
      id: 'discover-1',
      name: 'Clube Descoberto',
      viewerMembership: {
        isMember: false,
        role: null,
        status: null,
      },
    });
    mockedDiscoverClubs.mockResolvedValue(
      makeDiscoverResponse({
        suggested: [discoverClub],
      }),
    );
    mockedSearchClubs.mockResolvedValue([
      makeClubSummary({
        id: 'search-1',
        name: 'Clube Buscado',
        viewerMembership: {
          isMember: false,
          role: null,
          status: null,
        },
      }),
    ]);

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    act(() => {
      result.current.handleChangeTab('discover');
    });

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('list');
    });

    jest.useFakeTimers();

    act(() => {
      result.current.setQuery('desafios');
    });

    await advanceSearchDebounce();

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('search-results');
    });

    act(() => {
      result.current.setQuery('   ');
    });

    expect(result.current.hasSearchQuery).toBe(false);
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.discoverContentState).toBe('list');
    expect(result.current.visibleDiscoverClubs).toEqual(
      result.current.discoverClubs,
    );
    expect(result.current.discoverClubs[0].name).toBe('Clube Descoberto');
  });

  it('ignora resposta antiga quando buscas retornam fora de ordem', async () => {
    const firstSearch = createDeferred<ClubSummaryApi[]>();
    const secondSearch = createDeferred<ClubSummaryApi[]>();

    mockedDiscoverClubs.mockResolvedValue(
      makeDiscoverResponse({
        suggested: [makeClubSummary()],
      }),
    );
    mockedSearchClubs
      .mockReturnValueOnce(firstSearch.promise)
      .mockReturnValueOnce(secondSearch.promise);

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    act(() => {
      result.current.handleChangeTab('discover');
    });

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('list');
    });

    jest.useFakeTimers();

    act(() => {
      result.current.setQuery('antiga');
    });

    await advanceSearchDebounce();
    expect(mockedSearchClubs).toHaveBeenCalledWith('antiga');

    act(() => {
      result.current.setQuery('nova');
    });

    await advanceSearchDebounce();
    expect(mockedSearchClubs).toHaveBeenCalledWith('nova');

    await act(async () => {
      secondSearch.resolve([
        makeClubSummary({
          id: 'new-search',
          name: 'Resultado Novo',
          viewerMembership: {
            isMember: false,
            role: null,
            status: null,
          },
        }),
      ]);
      await secondSearch.promise;
    });

    await waitFor(() => {
      expect(result.current.searchResults[0].name).toBe('Resultado Novo');
    });

    await act(async () => {
      firstSearch.resolve([
        makeClubSummary({
          id: 'old-search',
          name: 'Resultado Antigo',
          viewerMembership: {
            isMember: false,
            role: null,
            status: null,
          },
        }),
      ]);
      await firstSearch.promise;
    });

    expect(result.current.searchResults).toHaveLength(1);
    expect(result.current.searchResults[0].name).toBe('Resultado Novo');
    expect(result.current.discoverContentState).toBe('search-results');
  });

  it('erro de busca nao apaga a descoberta carregada', async () => {
    mockedDiscoverClubs.mockResolvedValue(
      makeDiscoverResponse({
        suggested: [
          makeClubSummary({
            id: 'discover-1',
            name: 'Clube Descoberto',
            viewerMembership: {
              isMember: false,
              role: null,
              status: null,
            },
          }),
        ],
      }),
    );
    mockedSearchClubs.mockRejectedValue(new Error('Falha na busca'));

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    act(() => {
      result.current.handleChangeTab('discover');
    });

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('list');
    });

    jest.useFakeTimers();

    act(() => {
      result.current.setQuery('quebrada');
    });

    await advanceSearchDebounce();

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('error');
    });

    expect(result.current.errorMessage).toBe('Falha na busca');
    expect(result.current.searchErrorMessage).toBe('Falha na busca');
    expect(result.current.discoverClubs[0].name).toBe('Clube Descoberto');

    act(() => {
      result.current.setQuery('');
    });

    expect(result.current.discoverContentState).toBe('list');
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.visibleDiscoverClubs[0].name).toBe(
      'Clube Descoberto',
    );
  });

  it('entrada com sucesso atualiza contadores locais e preserva aba e query', async () => {
    mockedDiscoverClubs.mockResolvedValue(
      makeDiscoverResponse({
        suggested: [
          makeClubSummary({
            id: 'discover-1',
            name: 'Clube Descoberto',
            viewerMembership: {
              isMember: false,
              role: null,
              status: null,
            },
          }),
        ],
      }),
    );
    mockedSearchClubs.mockResolvedValue([
      makeClubSummary({
        id: 'search-join',
        name: 'Clube para Entrar',
        memberCount: 7,
        viewerMembership: {
          isMember: false,
          role: null,
          status: null,
        },
      }),
    ]);
    mockedJoinClub.mockResolvedValue(
      makeClubMember({
        clubId: 'search-join',
        role: 'member',
        status: 'active',
      }),
    );

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    act(() => {
      result.current.handleChangeTab('discover');
    });

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('list');
    });

    jest.useFakeTimers();

    act(() => {
      result.current.setQuery('entrar');
    });

    await advanceSearchDebounce();

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('search-results');
    });

    const clubToJoin = result.current.visibleDiscoverClubs[0];

    await act(async () => {
      await result.current.handleJoinClub(clubToJoin);
    });

    expect(mockedJoinClub).toHaveBeenCalledTimes(1);
    expect(mockedJoinClub).toHaveBeenCalledWith('search-join');
    expect(result.current.activeTab).toBe('discover');
    expect(result.current.query).toBe('entrar');
    expect(result.current.searchResults[0]).toEqual({
      ...clubToJoin,
      memberCount: 8,
      membersLabel: '8 membros',
      isMember: true,
      membershipStatus: 'active',
    });
    expect(result.current.myClubs[0]).toEqual({
      id: 'search-join',
      name: 'Clube para Entrar',
      description: 'Um clube para desafios leves.',
      memberCount: 8,
      membersLabel: '8 membros',
      statusLabel: 'Membro',
      iconName: 'sports-esports',
      isActive: true,
      viewerActivity: DEFAULT_VIEWER_ACTIVITY,
      unreadCount: 0,
      hasUnreadActivity: false,
    });
    expect(result.current.clubActionErrorMessage).toBeNull();
    expect(result.current.joiningClubIds).toEqual([]);
  });

  it('erro de entrada preserva dados locais e expoe erro amigavel', async () => {
    mockedDiscoverClubs.mockResolvedValue(
      makeDiscoverResponse({
        suggested: [
          makeClubSummary({
            id: 'join-error',
            name: 'Clube com Falha',
            viewerMembership: {
              isMember: false,
              role: null,
              status: null,
            },
          }),
        ],
      }),
    );
    mockedJoinClub.mockRejectedValue(new Error('Falha ao entrar'));

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    act(() => {
      result.current.handleChangeTab('discover');
    });

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('list');
    });

    const clubToJoin = result.current.visibleDiscoverClubs[0];

    await act(async () => {
      await result.current.handleJoinClub(clubToJoin);
    });

    expect(mockedJoinClub).toHaveBeenCalledWith('join-error');
    expect(result.current.discoverClubs[0]).toEqual(clubToJoin);
    expect(result.current.myClubs).toEqual([]);
    expect(result.current.clubActionErrorMessage).toBe('Falha ao entrar');
    expect(result.current.joiningClubIds).toEqual([]);
  });

  it('ignora duplo toque enquanto entrada esta em andamento', async () => {
    const joinDeferred = createDeferred<ClubMemberApi>();

    mockedDiscoverClubs.mockResolvedValue(
      makeDiscoverResponse({
        suggested: [
          makeClubSummary({
            id: 'join-pending',
            name: 'Clube Pendente',
            viewerMembership: {
              isMember: false,
              role: null,
              status: null,
            },
          }),
        ],
      }),
    );
    mockedJoinClub.mockReturnValue(joinDeferred.promise);

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    act(() => {
      result.current.handleChangeTab('discover');
    });

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('list');
    });

    const clubToJoin = result.current.visibleDiscoverClubs[0];
    let firstJoinPromise!: Promise<void>;

    act(() => {
      firstJoinPromise = result.current.handleJoinClub(clubToJoin);
      void result.current.handleJoinClub(clubToJoin);
    });

    expect(mockedJoinClub).toHaveBeenCalledTimes(1);
    expect(result.current.joiningClubIds).toEqual(['join-pending']);

    await act(async () => {
      joinDeferred.resolve(
        makeClubMember({
          clubId: 'join-pending',
        }),
      );
      await firstJoinPromise;
    });

    expect(result.current.joiningClubIds).toEqual([]);
    expect(result.current.discoverClubs[0].isMember).toBe(true);
  });

  it('refresh em Meus Clubes chama getMyClubs novamente sem trocar aba', async () => {
    mockedGetMyClubs
      .mockResolvedValueOnce([
        makeClubSummary({
          id: 'my-club-1',
          name: 'Clube Inicial',
        }),
      ])
      .mockResolvedValueOnce([
        makeClubSummary({
          id: 'my-club-2',
          name: 'Clube Atualizado',
        }),
      ]);

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubs[0].name).toBe('Clube Inicial');
    });

    await act(async () => {
      await result.current.handleRefresh();
    });

    expect(mockedGetMyClubs).toHaveBeenCalledTimes(2);
    expect(mockedDiscoverClubs).not.toHaveBeenCalled();
    expect(mockedSearchClubs).not.toHaveBeenCalled();
    expect(result.current.activeTab).toBe('my-clubs');
    expect(result.current.myClubs[0].name).toBe('Clube Atualizado');
    expect(result.current.isRefreshing).toBe(false);
  });

  it('refresh em Descobrir sem query recarrega discoverClubs mesmo ja carregado', async () => {
    mockedDiscoverClubs
      .mockResolvedValueOnce(
        makeDiscoverResponse({
          suggested: [
            makeClubSummary({
              id: 'discover-1',
              name: 'Descoberta Inicial',
              viewerMembership: {
                isMember: false,
                role: null,
                status: null,
              },
            }),
          ],
        }),
      )
      .mockResolvedValueOnce(
        makeDiscoverResponse({
          popular: [
            makeClubSummary({
              id: 'discover-2',
              name: 'Descoberta Atualizada',
              memberCount: 20,
              viewerMembership: {
                isMember: false,
                role: null,
                status: null,
              },
            }),
          ],
        }),
      );

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    act(() => {
      result.current.handleChangeTab('discover');
    });

    await waitFor(() => {
      expect(result.current.discoverClubs[0].name).toBe('Descoberta Inicial');
    });

    await act(async () => {
      await result.current.handleRefresh();
    });

    expect(mockedDiscoverClubs).toHaveBeenCalledTimes(2);
    expect(mockedSearchClubs).not.toHaveBeenCalled();
    expect(result.current.activeTab).toBe('discover');
    expect(result.current.query).toBe('');
    expect(result.current.discoverClubs[0].name).toBe(
      'Descoberta Atualizada',
    );
    expect(result.current.discoverClubs[0].badgeLabel).toBe('Popular');
  });

  it('refresh em busca recarrega searchClubs com a query atual', async () => {
    mockedDiscoverClubs.mockResolvedValue(
      makeDiscoverResponse({
        suggested: [
          makeClubSummary({
            id: 'discover-1',
            name: 'Clube Descoberto',
            viewerMembership: {
              isMember: false,
              role: null,
              status: null,
            },
          }),
        ],
      }),
    );
    mockedSearchClubs
      .mockResolvedValueOnce([
        makeClubSummary({
          id: 'search-1',
          name: 'Resultado Inicial',
          viewerMembership: {
            isMember: false,
            role: null,
            status: null,
          },
        }),
      ])
      .mockResolvedValueOnce([
        makeClubSummary({
          id: 'search-2',
          name: 'Resultado Atualizado',
          viewerMembership: {
            isMember: false,
            role: null,
            status: null,
          },
        }),
      ]);

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    act(() => {
      result.current.handleChangeTab('discover');
    });

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('list');
    });

    jest.useFakeTimers();

    act(() => {
      result.current.setQuery('desafios');
    });

    await advanceSearchDebounce();

    await waitFor(() => {
      expect(result.current.searchResults[0].name).toBe('Resultado Inicial');
    });

    await act(async () => {
      await result.current.handleRefresh();
    });

    expect(mockedSearchClubs).toHaveBeenCalledTimes(2);
    expect(mockedSearchClubs).toHaveBeenLastCalledWith('desafios');
    expect(mockedDiscoverClubs).toHaveBeenCalledTimes(1);
    expect(result.current.activeTab).toBe('discover');
    expect(result.current.query).toBe('desafios');
    expect(result.current.searchResults[0].name).toBe('Resultado Atualizado');
  });

  it('refresh em busca com erro preserva discovery carregado', async () => {
    mockedDiscoverClubs.mockResolvedValue(
      makeDiscoverResponse({
        suggested: [
          makeClubSummary({
            id: 'discover-1',
            name: 'Clube Descoberto',
            viewerMembership: {
              isMember: false,
              role: null,
              status: null,
            },
          }),
        ],
      }),
    );
    mockedSearchClubs
      .mockResolvedValueOnce([
        makeClubSummary({
          id: 'search-1',
          name: 'Resultado Inicial',
          viewerMembership: {
            isMember: false,
            role: null,
            status: null,
          },
        }),
      ])
      .mockRejectedValueOnce(new Error('Falha no refresh da busca'));

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    act(() => {
      result.current.handleChangeTab('discover');
    });

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('list');
    });

    jest.useFakeTimers();

    act(() => {
      result.current.setQuery('desafios');
    });

    await advanceSearchDebounce();

    await waitFor(() => {
      expect(result.current.searchResults[0].name).toBe('Resultado Inicial');
    });

    await act(async () => {
      await result.current.handleRefresh();
    });

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('error');
    });

    expect(mockedSearchClubs).toHaveBeenCalledTimes(2);
    expect(mockedSearchClubs).toHaveBeenLastCalledWith('desafios');
    expect(result.current.query).toBe('desafios');
    expect(result.current.searchErrorMessage).toBe('Falha no refresh da busca');
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.discoverClubs[0].name).toBe('Clube Descoberto');
    expect(result.current.isRefreshing).toBe(false);
  });

  it('retry apos erro de Meus Clubes repete getMyClubs', async () => {
    mockedGetMyClubs
      .mockRejectedValueOnce(new Error('Falha em Meus Clubes'))
      .mockResolvedValueOnce([
        makeClubSummary({
          id: 'my-club-retry',
          name: 'Clube Recuperado',
        }),
      ]);

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('error');
    });

    await act(async () => {
      await result.current.handleRetry();
    });

    expect(mockedGetMyClubs).toHaveBeenCalledTimes(2);
    expect(result.current.activeTab).toBe('my-clubs');
    expect(result.current.myClubsContentState).toBe('list');
    expect(result.current.myClubs[0].name).toBe('Clube Recuperado');
  });

  it('retry apos erro de Descobrir repete discoverClubs', async () => {
    mockedDiscoverClubs
      .mockRejectedValueOnce(new Error('Falha na descoberta'))
      .mockResolvedValueOnce(
        makeDiscoverResponse({
          recent: [
            makeClubSummary({
              id: 'discover-retry',
              name: 'Descoberta Recuperada',
              viewerMembership: {
                isMember: false,
                role: null,
                status: null,
              },
            }),
          ],
        }),
      );

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    act(() => {
      result.current.handleChangeTab('discover');
    });

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('error');
    });

    await act(async () => {
      await result.current.handleRetry();
    });

    expect(mockedDiscoverClubs).toHaveBeenCalledTimes(2);
    expect(mockedSearchClubs).not.toHaveBeenCalled();
    expect(result.current.activeTab).toBe('discover');
    expect(result.current.discoverContentState).toBe('list');
    expect(result.current.discoverClubs[0].name).toBe(
      'Descoberta Recuperada',
    );
  });

  it('retry apos erro de busca repete searchClubs sem apagar discovery carregado', async () => {
    mockedDiscoverClubs.mockResolvedValue(
      makeDiscoverResponse({
        suggested: [
          makeClubSummary({
            id: 'discover-1',
            name: 'Clube Descoberto',
            viewerMembership: {
              isMember: false,
              role: null,
              status: null,
            },
          }),
        ],
      }),
    );
    mockedSearchClubs
      .mockRejectedValueOnce(new Error('Falha na busca'))
      .mockRejectedValueOnce(new Error('Falha nova na busca'));

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    act(() => {
      result.current.handleChangeTab('discover');
    });

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('list');
    });

    jest.useFakeTimers();

    act(() => {
      result.current.setQuery('quebrada');
    });

    await advanceSearchDebounce();

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('error');
    });

    await act(async () => {
      await result.current.handleRetry();
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('Falha nova na busca');
    });

    expect(mockedSearchClubs).toHaveBeenCalledTimes(2);
    expect(mockedSearchClubs).toHaveBeenLastCalledWith('quebrada');
    expect(result.current.query).toBe('quebrada');
    expect(result.current.discoverClubs[0].name).toBe('Clube Descoberto');
    expect(result.current.visibleDiscoverClubs).toEqual([]);
  });

  it('retry apos erro de busca recupera resultados reais', async () => {
    mockedDiscoverClubs.mockResolvedValue(
      makeDiscoverResponse({
        suggested: [
          makeClubSummary({
            id: 'discover-1',
            name: 'Clube Descoberto',
            viewerMembership: {
              isMember: false,
              role: null,
              status: null,
            },
          }),
        ],
      }),
    );
    mockedSearchClubs
      .mockRejectedValueOnce(new Error('Falha na busca'))
      .mockResolvedValueOnce([
        makeClubSummary({
          id: 'search-recovered',
          name: 'Resultado Recuperado',
          memberCount: 11,
          viewerMembership: {
            isMember: false,
            role: null,
            status: null,
          },
        }),
      ]);

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    act(() => {
      result.current.handleChangeTab('discover');
    });

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('list');
    });

    jest.useFakeTimers();

    act(() => {
      result.current.setQuery('recuperar');
    });

    await advanceSearchDebounce();

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('error');
    });

    await act(async () => {
      await result.current.handleRetry();
    });

    await waitFor(() => {
      expect(result.current.discoverContentState).toBe('search-results');
    });

    expect(mockedSearchClubs).toHaveBeenCalledTimes(2);
    expect(mockedSearchClubs).toHaveBeenLastCalledWith('recuperar');
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.searchErrorMessage).toBeNull();
    expect(result.current.discoverClubs[0].name).toBe('Clube Descoberto');
    expect(result.current.visibleDiscoverClubs).toEqual([
      {
        id: 'search-recovered',
        name: 'Resultado Recuperado',
        description: 'Um clube para desafios leves.',
        memberCount: 11,
        membersLabel: '11 membros',
        badgeLabel: 'Busca',
        iconName: 'sports-esports',
        isTrending: false,
        isMember: false,
        membershipStatus: null,
      },
    ]);
  });

  it('refresh e retry nao chamam searchClubs fora da aba Descobrir', async () => {
    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    jest.useFakeTimers();

    act(() => {
      result.current.setQuery('desafios');
    });

    await advanceSearchDebounce();

    await act(async () => {
      await result.current.handleRefresh();
    });

    await act(async () => {
      await result.current.handleRetry();
    });

    expect(result.current.activeTab).toBe('my-clubs');
    expect(result.current.query).toBe('desafios');
    expect(mockedSearchClubs).not.toHaveBeenCalled();
    expect(mockedDiscoverClubs).not.toHaveBeenCalled();
    expect(mockedGetMyClubs).toHaveBeenCalledTimes(3);
  });

  it('renderiza Meus Clubes cacheados antes da sincronizacao do backend', async () => {
    await AsyncStorage.setItem('auth_token', makeToken('user-1'));
    await writeCache(
      LOCAL_CACHE_KEYS.clubsMy,
      [
        makeClubSummary({
          id: 'club-cache',
          name: 'Clube Cacheado',
        }),
      ],
      { ttlMs: LOCAL_CACHE_TTLS.clubsMy },
    );

    const deferred = createDeferred<ClubSummaryApi[]>();
    mockedGetMyClubs.mockReturnValue(deferred.promise);

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubs[0]?.name).toBe('Clube Cacheado');
      expect(result.current.isFromCache).toBe(true);
    });

    await act(async () => {
      deferred.resolve([
        makeClubSummary({
          id: 'club-fresh',
          name: 'Clube Fresco',
        }),
      ]);
      await deferred.promise;
    });

    await waitFor(() => {
      expect(result.current.myClubs[0]?.name).toBe('Clube Fresco');
      expect(result.current.isFromCache).toBe(false);
      expect(result.current.syncErrorMessage).toBeNull();
    });
  });

  it('mantem Meus Clubes cacheados quando a sincronizacao falha', async () => {
    await AsyncStorage.setItem('auth_token', makeToken('user-1'));
    await writeCache(
      LOCAL_CACHE_KEYS.clubsMy,
      [
        makeClubSummary({
          id: 'club-offline',
          name: 'Clube Offline',
        }),
      ],
      { ttlMs: LOCAL_CACHE_TTLS.clubsMy },
    );
    mockedGetMyClubs.mockRejectedValue(new Error('Offline'));

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubs[0]?.name).toBe('Clube Offline');
      expect(result.current.isFromCache).toBe(true);
      expect(result.current.syncErrorMessage).toBe('Offline');
    });
  });
});
