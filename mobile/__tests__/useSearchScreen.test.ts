import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useSearchScreen } from '../hooks/useSearchScreen';
import {
  getMyProfile,
  getRecommendedUsers,
  getTrendingClubs,
  searchClubs,
  searchUsers,
} from '../services/api';
import {
  clearRecentSearches,
  loadRecentSearches,
  removeRecentSearch,
  saveRecentSearch,
} from '../services/recentSearches';
import type {
  SearchClubItem,
  SearchPagination,
  SearchRecentItem,
  SearchUserItem,
} from '../types/search';

jest.mock('../services/api', () => ({
  getMyProfile: jest.fn(),
  getRecommendedUsers: jest.fn(),
  getTrendingClubs: jest.fn(),
  searchClubs: jest.fn(),
  searchUsers: jest.fn(),
}));

jest.mock('../services/recentSearches', () => ({
  RECENT_SEARCHES_LIMIT: 10,
  clearRecentSearches: jest.fn(),
  loadRecentSearches: jest.fn(),
  removeRecentSearch: jest.fn(),
  saveRecentSearch: jest.fn(),
}));

const mockedGetMyProfile = getMyProfile as jest.MockedFunction<
  typeof getMyProfile
>;
const mockedGetRecommendedUsers = getRecommendedUsers as jest.MockedFunction<
  typeof getRecommendedUsers
>;
const mockedGetTrendingClubs = getTrendingClubs as jest.MockedFunction<
  typeof getTrendingClubs
>;
const mockedSearchUsers = searchUsers as jest.MockedFunction<typeof searchUsers>;
const mockedSearchClubs = searchClubs as jest.MockedFunction<typeof searchClubs>;
const mockedLoadRecentSearches = loadRecentSearches as jest.MockedFunction<
  typeof loadRecentSearches
>;
const mockedSaveRecentSearch = saveRecentSearch as jest.MockedFunction<
  typeof saveRecentSearch
>;
const mockedRemoveRecentSearch = removeRecentSearch as jest.MockedFunction<
  typeof removeRecentSearch
>;
const mockedClearRecentSearches = clearRecentSearches as jest.MockedFunction<
  typeof clearRecentSearches
>;

function makeUser(overrides: Partial<SearchUserItem> = {}): SearchUserItem {
  return {
    id: 'user-1',
    name: 'Marina Busca',
    username: 'marina',
    bio: 'Gosta de desafios.',
    level: 4,
    levelLabel: 'Nivel 4',
    avatarUrl: 'https://example.com/avatar.png',
    mutualCount: 2,
    ...overrides,
  };
}

function makeClub(overrides: Partial<SearchClubItem> = {}): SearchClubItem {
  return {
    id: 'club-1',
    slug: 'noite-dos-desafios',
    name: 'Noite dos Desafios',
    memberCount: 42,
    memberCountLabel: '42 membros',
    description: 'Clube para desafios leves.',
    iconName: 'celebration',
    imageUrl: 'https://example.com/club.png',
    badgeLabel: 'Em alta',
    isTrending: true,
    tags: ['noite'],
    ...overrides,
  };
}

function makeRecent(
  overrides: Partial<SearchRecentItem> = {},
): SearchRecentItem {
  return {
    id: 'user:user-1',
    label: 'Marina Busca',
    type: 'user',
    referenceId: 'user-1',
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

  return { promise, resolve, reject };
}

function makeUserPage(
  items: SearchUserItem[] = [],
  nextCursor: string | null = null,
): SearchPagination<SearchUserItem> {
  return {
    items,
    nextCursor,
  };
}

function makeClubPage(
  items: SearchClubItem[] = [],
  nextCursor: string | null = null,
): SearchPagination<SearchClubItem> {
  return {
    items,
    nextCursor,
  };
}

describe('useSearchScreen', () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    mockedGetMyProfile.mockResolvedValue({
      id: 'profile-user-1',
      name: 'Pedro',
      email: 'pedro@example.com',
      username: 'pedro',
      bio: null,
      createdTruthsCount: 0,
      createdDaresCount: 0,
    });
    mockedGetRecommendedUsers.mockResolvedValue([makeUser()]);
    mockedGetTrendingClubs.mockResolvedValue([makeClub()]);
    mockedLoadRecentSearches.mockResolvedValue([makeRecent()]);
    mockedSaveRecentSearch.mockResolvedValue(undefined);
    mockedRemoveRecentSearch.mockResolvedValue(undefined);
    mockedClearRecentSearches.mockResolvedValue(undefined);
    mockedSearchUsers.mockResolvedValue(makeUserPage());
    mockedSearchClubs.mockResolvedValue(makeClubPage());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('carrega recomendados, clubes em alta e recentes ao montar', async () => {
    const { result } = renderHook(() =>
      useSearchScreen({ userId: 'viewer-1' }),
    );

    await waitFor(() => {
      expect(result.current.recommendedUsers).toEqual([makeUser()]);
    });

    expect(mockedGetRecommendedUsers).toHaveBeenCalledTimes(1);
    expect(mockedGetTrendingClubs).toHaveBeenCalledTimes(1);
    expect(mockedLoadRecentSearches).toHaveBeenCalledWith('viewer-1');
    expect(mockedGetMyProfile).not.toHaveBeenCalled();
    expect(result.current.trendingClubs).toEqual([makeClub()]);
    expect(result.current.recentSearches).toEqual([makeRecent()]);
    expect(result.current.isInitialState).toBe(true);
    expect(result.current.isEmptyResult).toBe(false);
    expect(result.current.hasAnyResults).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('resolve o usuario atual para carregar recentes quando o hook nao recebe userId', async () => {
    renderHook(() => useSearchScreen());

    await waitFor(() => {
      expect(mockedLoadRecentSearches).toHaveBeenCalledWith('profile-user-1');
    });

    expect(mockedGetMyProfile).toHaveBeenCalledTimes(1);
  });

  it('mantem o hook utilizavel quando sugestoes ou recentes falham', async () => {
    mockedGetMyProfile.mockRejectedValue(new Error('perfil indisponivel'));
    mockedGetRecommendedUsers.mockRejectedValue(new Error('recomendados'));
    mockedGetTrendingClubs.mockRejectedValue(new Error('clubes'));
    mockedLoadRecentSearches.mockRejectedValue(new Error('storage'));

    const { result } = renderHook(() => useSearchScreen());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.recommendedUsers).toEqual([]);
    expect(result.current.trendingClubs).toEqual([]);
    expect(result.current.recentSearches).toEqual([]);
    expect(result.current.isInitialState).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('atualiza query imediatamente e dispara busca apos debounce de 350ms', async () => {
    mockedLoadRecentSearches.mockResolvedValue([]);

    const { result } = renderHook(() =>
      useSearchScreen({ userId: 'viewer-1' }),
    );

    await waitFor(() => {
      expect(result.current.recommendedUsers).toEqual([makeUser()]);
    });

    jest.useFakeTimers();

    act(() => {
      result.current.setQuery('Marina');
    });

    expect(result.current.query).toBe('Marina');
    expect(mockedSearchUsers).not.toHaveBeenCalled();
    expect(mockedSearchClubs).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);

    act(() => {
      jest.advanceTimersByTime(349);
    });

    expect(mockedSearchUsers).not.toHaveBeenCalled();
    expect(mockedSearchClubs).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => {
      expect(mockedSearchUsers).toHaveBeenCalledTimes(1);
      expect(mockedSearchClubs).toHaveBeenCalledTimes(1);
    });
    expect(mockedSearchUsers).toHaveBeenCalledWith(
      'Marina',
      null,
      undefined,
      expect.any(Object),
    );
    expect(mockedSearchClubs).toHaveBeenCalledWith(
      'Marina',
      null,
      undefined,
      expect.any(Object),
    );
  });

  it('busca resultados remotos apos debounce e expoe estado de resultado vazio', async () => {
    mockedLoadRecentSearches.mockResolvedValue([]);
    mockedSearchUsers
      .mockResolvedValueOnce(
        makeUserPage([makeUser({ id: 'user-resultado' })], 'user-cursor-1'),
      )
      .mockResolvedValueOnce(makeUserPage());
    mockedSearchClubs
      .mockResolvedValueOnce(
        makeClubPage([makeClub({ id: 'club-resultado' })], 'club-cursor-1'),
      )
      .mockResolvedValueOnce(makeClubPage());

    const { result } = renderHook(() =>
      useSearchScreen({ userId: 'viewer-1' }),
    );

    await waitFor(() => {
      expect(result.current.recentSearches).toEqual([]);
    });

    jest.useFakeTimers();

    act(() => {
      result.current.setQuery('resultado');
    });

    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(result.current.results.users).toEqual([
        expect.objectContaining({ id: 'user-resultado' }),
      ]);
    });
    expect(result.current.results.clubs).toEqual([
      expect.objectContaining({ id: 'club-resultado' }),
    ]);
    expect(result.current.hasAnyResults).toBe(true);
    expect(result.current.isEmptyResult).toBe(false);
    expect(result.current.hasMoreUsers).toBe(true);
    expect(result.current.hasMoreClubs).toBe(true);

    act(() => {
      result.current.setQuery('sem resultado');
    });

    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(result.current.results).toEqual({ users: [], clubs: [] });
    });
    expect(result.current.hasAnyResults).toBe(false);
    expect(result.current.isEmptyResult).toBe(true);
    expect(result.current.hasMoreUsers).toBe(false);
    expect(result.current.hasMoreClubs).toBe(false);
  });

  it('cancela requisicao antiga e impede resultado desatualizado de sobrescrever o atual', async () => {
    mockedLoadRecentSearches.mockResolvedValue([]);
    const firstSearch = createDeferred<SearchPagination<SearchUserItem>>();
    const secondSearch = createDeferred<SearchPagination<SearchUserItem>>();
    mockedSearchUsers.mockImplementation((term) =>
      term === 'Marina' ? firstSearch.promise : secondSearch.promise,
    );
    mockedSearchClubs.mockResolvedValue(makeClubPage());

    const { result } = renderHook(() =>
      useSearchScreen({ userId: 'viewer-1' }),
    );

    await waitFor(() => {
      expect(result.current.recentSearches).toEqual([]);
    });

    jest.useFakeTimers();

    act(() => {
      result.current.setQuery('Marina');
    });

    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(mockedSearchUsers).toHaveBeenCalledTimes(1);
      expect(mockedSearchClubs).toHaveBeenCalledTimes(1);
    });

    const firstSignal = mockedSearchUsers.mock.calls[0][3] as AbortSignal;

    act(() => {
      result.current.setQuery('Julia');
    });

    expect(firstSignal.aborted).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(mockedSearchUsers).toHaveBeenCalledTimes(2);
      expect(mockedSearchClubs).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      secondSearch.resolve(
        makeUserPage([makeUser({ id: 'user-julia', name: 'Julia Atual' })]),
      );
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.results.users).toEqual([
        expect.objectContaining({ id: 'user-julia' }),
      ]);
    });

    await act(async () => {
      firstSearch.resolve(
        makeUserPage([makeUser({ id: 'user-marina', name: 'Marina Antiga' })]),
      );
      await Promise.resolve();
    });

    expect(result.current.results.users).toEqual([
      expect.objectContaining({ id: 'user-julia' }),
    ]);
  });

  it('salva resultado de usuario como recente com referenceId e atualiza memoria', async () => {
    mockedLoadRecentSearches.mockResolvedValue([]);
    const user = makeUser({ id: 'user-2', name: 'Julia Perfil' });

    const { result } = renderHook(() =>
      useSearchScreen({ userId: 'viewer-1' }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.saveRecentFromResult(user);
    });

    const expectedRecent = {
      id: 'user:user-2',
      label: 'Julia Perfil',
      type: 'user',
      referenceId: 'user-2',
    };

    expect(mockedSaveRecentSearch).toHaveBeenCalledWith(
      'viewer-1',
      expectedRecent,
    );
    expect(result.current.recentSearches).toEqual([expectedRecent]);
  });

  it('salva resultado de clube como recente e promove item existente', async () => {
    const club = makeClub({ id: 'club-2', name: 'Clube Repetido' });
    const oldRecent = makeRecent({
      id: 'club:club-2',
      label: 'Nome antigo',
      type: 'club',
      referenceId: 'club-2',
    });
    mockedLoadRecentSearches.mockResolvedValue([
      makeRecent({ id: 'user:user-3', referenceId: 'user-3' }),
      oldRecent,
    ]);

    const { result } = renderHook(() =>
      useSearchScreen({ userId: 'viewer-1' }),
    );

    await waitFor(() => {
      expect(result.current.recentSearches).toHaveLength(2);
    });

    await act(async () => {
      await result.current.saveRecentFromResult(club);
    });

    expect(result.current.recentSearches[0]).toEqual({
      id: 'club:club-2',
      label: 'Clube Repetido',
      type: 'club',
      referenceId: 'club-2',
    });
    expect(result.current.recentSearches).toHaveLength(2);
  });

  it('remove e limpa recentes conectando storage e estado em memoria', async () => {
    mockedLoadRecentSearches.mockResolvedValue([
      makeRecent({ id: 'user:user-1', referenceId: 'user-1' }),
      makeRecent({
        id: 'club:club-1',
        label: 'Noite dos Desafios',
        type: 'club',
        referenceId: 'club-1',
      }),
    ]);

    const { result } = renderHook(() =>
      useSearchScreen({ userId: 'viewer-1' }),
    );

    await waitFor(() => {
      expect(result.current.recentSearches).toHaveLength(2);
    });

    await act(async () => {
      await result.current.removeRecent('user:user-1');
    });

    expect(mockedRemoveRecentSearch).toHaveBeenCalledWith(
      'viewer-1',
      'user:user-1',
    );
    expect(result.current.recentSearches).toEqual([
      expect.objectContaining({ id: 'club:club-1' }),
    ]);

    await act(async () => {
      await result.current.clearAllRecent();
    });

    expect(mockedClearRecentSearches).toHaveBeenCalledWith('viewer-1');
    expect(result.current.recentSearches).toEqual([]);
  });

  it('toca em busca recente, preenche query e dispara busca imediata', async () => {
    const recent = makeRecent({ label: 'Marina' });
    mockedLoadRecentSearches.mockResolvedValue([recent]);
    mockedSearchUsers.mockResolvedValue(
      makeUserPage([makeUser({ id: 'user-9', name: 'Marina Resultado' })]),
    );
    mockedSearchClubs.mockResolvedValue(makeClubPage([makeClub({ id: 'club-9' })]));

    const { result } = renderHook(() =>
      useSearchScreen({ userId: 'viewer-1' }),
    );

    await waitFor(() => {
      expect(result.current.recentSearches).toEqual([recent]);
    });

    jest.useFakeTimers();

    await act(async () => {
      await result.current.onPressRecent(recent);
    });

    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    expect(result.current.query).toBe('Marina');
    expect(mockedSearchUsers).toHaveBeenCalledTimes(1);
    expect(mockedSearchClubs).toHaveBeenCalledTimes(1);
    expect(mockedSearchUsers).toHaveBeenCalledWith(
      'Marina',
      null,
      undefined,
      expect.any(Object),
    );
    expect(mockedSearchClubs).toHaveBeenCalledWith(
      'Marina',
      null,
      undefined,
      expect.any(Object),
    );
    expect(mockedSaveRecentSearch).toHaveBeenCalledWith('viewer-1', recent);
    expect(result.current.results.users).toEqual([
      expect.objectContaining({ id: 'user-9' }),
    ]);
    expect(result.current.results.clubs).toEqual([
      expect.objectContaining({ id: 'club-9' }),
    ]);
    expect(result.current.hasAnyResults).toBe(true);
    expect(result.current.isInitialState).toBe(false);
    expect(result.current.isEmptyResult).toBe(false);
  });

  it('expoe vazio, erro, retry e limpar campo de forma coerente', async () => {
    mockedLoadRecentSearches.mockResolvedValue([]);
    mockedSearchUsers
      .mockRejectedValueOnce(new Error('Busca indisponivel'))
      .mockResolvedValueOnce(makeUserPage([makeUser()], 'user-cursor-retry'));
    mockedSearchClubs.mockResolvedValue(makeClubPage());

    const { result } = renderHook(() =>
      useSearchScreen({ userId: 'viewer-1' }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.onPressRecent(makeRecent({ label: 'Falha' }));
    });

    expect(result.current.query).toBe('Falha');
    expect(result.current.error).toBe('Busca indisponivel');
    expect(result.current.results).toEqual({ users: [], clubs: [] });
    expect(result.current.isEmptyResult).toBe(true);

    await act(async () => {
      await result.current.retry();
    });

    expect(mockedSearchUsers).toHaveBeenLastCalledWith(
      'Falha',
      null,
      undefined,
      expect.any(Object),
    );
    expect(result.current.error).toBeNull();
    expect(result.current.results.users).toEqual([makeUser()]);
    expect(result.current.hasMoreUsers).toBe(true);

    act(() => {
      result.current.clearQuery();
    });

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual({ users: [], clubs: [] });
    expect(result.current.hasMoreUsers).toBe(false);
    expect(result.current.hasMoreClubs).toBe(false);
    expect(result.current.isInitialState).toBe(true);
    expect(result.current.isEmptyResult).toBe(false);
  });

  it('expoe filtros, flags de paginacao e callbacks publicos do contrato', async () => {
    const onPressFilter = jest.fn();
    const onPressUserResult = jest.fn();
    const onPressClubResult = jest.fn();
    mockedLoadRecentSearches.mockResolvedValue([]);
    mockedSearchUsers.mockResolvedValue(makeUserPage([makeUser()]));
    mockedSearchClubs.mockResolvedValue(makeClubPage([makeClub()]));

    const { result } = renderHook(() =>
      useSearchScreen({
        userId: 'viewer-1',
        onPressFilter,
        onPressUserResult,
        onPressClubResult,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.onPressRecent(makeRecent({ label: 'Tudo' }));
    });

    act(() => {
      result.current.setActiveFilter('users');
    });

    expect(mockedSearchUsers).toHaveBeenCalledTimes(1);
    expect(mockedSearchClubs).toHaveBeenCalledTimes(1);
    expect(result.current.results.users).toHaveLength(1);
    expect(result.current.results.clubs).toHaveLength(0);
    expect(result.current.isLoadingMore).toBe(false);
    expect(result.current.hasMoreUsers).toBe(false);
    expect(result.current.hasMoreClubs).toBe(false);

    act(() => {
      result.current.onPressFilter();
    });

    await act(async () => {
      await result.current.onPressUserResult(makeUser({ id: 'user-nav' }));
      await result.current.onPressClubResult(makeClub({ id: 'club-nav' }));
    });

    expect(onPressFilter).toHaveBeenCalledTimes(1);
    expect(onPressUserResult).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-nav' }),
    );
    expect(onPressClubResult).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'club-nav' }),
    );
    expect(mockedSearchUsers).toHaveBeenCalledTimes(1);
    expect(mockedSearchClubs).toHaveBeenCalledTimes(1);
    expect(mockedSaveRecentSearch).toHaveBeenCalledWith(
      'viewer-1',
      expect.objectContaining({
        id: 'user:user-nav',
        referenceId: 'user-nav',
      }),
    );
    expect(mockedSaveRecentSearch).toHaveBeenCalledWith(
      'viewer-1',
      expect.objectContaining({
        id: 'club:club-nav',
        referenceId: 'club-nav',
      }),
    );
  });

  it('pagina usuarios com cursor, concatena resultados e mantem loading separado', async () => {
    mockedLoadRecentSearches.mockResolvedValue([]);
    const nextUsers = createDeferred<SearchPagination<SearchUserItem>>();
    mockedSearchUsers
      .mockResolvedValueOnce(
        makeUserPage([makeUser({ id: 'user-1' })], 'user-cursor-2'),
      )
      .mockReturnValueOnce(nextUsers.promise);
    mockedSearchClubs.mockResolvedValue(
      makeClubPage([makeClub({ id: 'club-1' })], 'club-cursor-2'),
    );

    const { result } = renderHook(() =>
      useSearchScreen({ userId: 'viewer-1' }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.onPressRecent(makeRecent({ label: 'Marina' }));
    });

    expect(result.current.hasMoreUsers).toBe(true);
    expect(result.current.hasMoreClubs).toBe(true);

    let loadMorePromise: Promise<void>;

    act(() => {
      loadMorePromise = result.current.loadMoreUsers();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoadingMore).toBe(true);
    expect(mockedSearchUsers).toHaveBeenCalledTimes(2);
    expect(mockedSearchClubs).toHaveBeenCalledTimes(1);
    expect(mockedSearchUsers).toHaveBeenLastCalledWith(
      'Marina',
      'user-cursor-2',
      undefined,
      expect.any(Object),
    );

    await act(async () => {
      nextUsers.resolve(
        makeUserPage([makeUser({ id: 'user-2', name: 'Julia Pagina' })]),
      );
      await loadMorePromise!;
    });

    expect(result.current.results.users).toEqual([
      expect.objectContaining({ id: 'user-1' }),
      expect.objectContaining({ id: 'user-2' }),
    ]);
    expect(result.current.results.clubs).toEqual([
      expect.objectContaining({ id: 'club-1' }),
    ]);
    expect(result.current.hasMoreUsers).toBe(false);
    expect(result.current.hasMoreClubs).toBe(true);
    expect(result.current.isLoadingMore).toBe(false);
  });

  it('pagina clubes com cursor e respeita o filtro ativo', async () => {
    mockedLoadRecentSearches.mockResolvedValue([]);
    mockedSearchUsers.mockResolvedValue(
      makeUserPage([makeUser({ id: 'user-1' })], 'user-cursor-2'),
    );
    mockedSearchClubs
      .mockResolvedValueOnce(
        makeClubPage([makeClub({ id: 'club-1' })], 'club-cursor-2'),
      )
      .mockResolvedValueOnce(
        makeClubPage([makeClub({ id: 'club-2', name: 'Clube Pagina' })]),
      );

    const { result } = renderHook(() =>
      useSearchScreen({ userId: 'viewer-1' }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.onPressRecent(makeRecent({ label: 'Desafios' }));
    });

    act(() => {
      result.current.setActiveFilter('clubs');
    });

    await act(async () => {
      await result.current.loadMoreClubs();
    });

    expect(mockedSearchClubs).toHaveBeenCalledTimes(2);
    expect(mockedSearchClubs).toHaveBeenLastCalledWith(
      'Desafios',
      'club-cursor-2',
      undefined,
      expect.any(Object),
    );
    expect(result.current.results.users).toEqual([]);
    expect(result.current.results.clubs).toEqual([
      expect.objectContaining({ id: 'club-1' }),
      expect.objectContaining({ id: 'club-2' }),
    ]);
    expect(result.current.hasMoreClubs).toBe(false);

    act(() => {
      result.current.setActiveFilter('users');
    });

    await act(async () => {
      await result.current.loadMoreClubs();
    });

    expect(mockedSearchClubs).toHaveBeenCalledTimes(2);
    expect(result.current.results.users).toEqual([
      expect.objectContaining({ id: 'user-1' }),
    ]);
    expect(result.current.results.clubs).toEqual([]);
  });

  it('limpa query cancelando paginacao pendente, resultados e cursores', async () => {
    mockedLoadRecentSearches.mockResolvedValue([]);
    const nextUsers = createDeferred<SearchPagination<SearchUserItem>>();
    mockedSearchUsers
      .mockResolvedValueOnce(
        makeUserPage([makeUser({ id: 'user-1' })], 'user-cursor-2'),
      )
      .mockReturnValueOnce(nextUsers.promise);
    mockedSearchClubs.mockResolvedValue(
      makeClubPage([makeClub({ id: 'club-1' })], 'club-cursor-2'),
    );

    const { result } = renderHook(() =>
      useSearchScreen({ userId: 'viewer-1' }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.onPressRecent(makeRecent({ label: 'Marina' }));
    });

    let loadMorePromise: Promise<void>;

    act(() => {
      loadMorePromise = result.current.loadMoreUsers();
    });

    const paginationSignal = mockedSearchUsers.mock.calls[1][3] as AbortSignal;

    act(() => {
      result.current.clearQuery();
    });

    expect(paginationSignal.aborted).toBe(true);
    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual({ users: [], clubs: [] });
    expect(result.current.hasMoreUsers).toBe(false);
    expect(result.current.hasMoreClubs).toBe(false);
    expect(result.current.isLoadingMore).toBe(false);
    expect(result.current.error).toBeNull();

    await act(async () => {
      nextUsers.resolve(
        makeUserPage([makeUser({ id: 'user-2', name: 'Resultado Antigo' })]),
      );
      await loadMorePromise!;
    });

    expect(result.current.results).toEqual({ users: [], clubs: [] });
  });
});
