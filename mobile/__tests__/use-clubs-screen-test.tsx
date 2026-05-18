import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  CLUBS_SEARCH_DEBOUNCE_MS,
  useClubsScreen,
} from '../hooks/useClubsScreen';
import { discoverClubs, getMyClubs, searchClubs } from '../services/clubsApi';
import type { ClubSummaryApi, DiscoverClubsApi } from '../types/clubsApi';

jest.mock('../services/clubsApi', () => ({
  discoverClubs: jest.fn(),
  getMyClubs: jest.fn(),
  searchClubs: jest.fn(),
}));

const mockedDiscoverClubs = discoverClubs as jest.MockedFunction<
  typeof discoverClubs
>;
const mockedGetMyClubs = getMyClubs as jest.MockedFunction<typeof getMyClubs>;
const mockedSearchClubs = searchClubs as jest.MockedFunction<
  typeof searchClubs
>;

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
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockedGetMyClubs.mockResolvedValue([]);
    mockedDiscoverClubs.mockResolvedValue(makeDiscoverResponse());
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
        membersLabel: '2 membros',
        statusLabel: 'Dono',
        iconName: 'sports-esports',
        isActive: true,
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
        membersLabel: '2 membros',
        badgeLabel: 'Sugestão',
        iconName: 'sports-esports',
        isTrending: false,
      },
      {
        id: 'club-2',
        name: 'Clube Popular',
        description: 'Um clube para desafios leves.',
        membersLabel: '12 membros',
        badgeLabel: 'Popular',
        iconName: 'sports-esports',
        isTrending: true,
      },
      {
        id: 'club-3',
        name: 'Clube Novo',
        description: 'Um clube para desafios leves.',
        membersLabel: '1 membro',
        badgeLabel: 'Novo',
        iconName: 'sports-esports',
        isTrending: false,
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
        membersLabel: '7 membros',
        badgeLabel: 'Busca',
        iconName: 'sports-esports',
        isTrending: false,
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
});
