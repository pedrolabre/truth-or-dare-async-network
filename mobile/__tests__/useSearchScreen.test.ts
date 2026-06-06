import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useSearchScreen } from '../hooks/useSearchScreen';
import {
  getMyProfile,
  getRecommendedUsers,
  getTrendingClubs,
  searchClubs,
  searchContent,
  searchUsers,
} from '../services/api';
import {
  clearRecentSearches,
  loadRecentSearches,
  removeRecentSearch,
  saveRecentSearch,
} from '../services/recentSearches';
import {
  clearSearchFilters,
  loadSearchFilters,
  saveSearchFilters,
} from '../services/searchPreferences';
import type {
  SearchClubItem,
  SearchContentItem,
  SearchPagination,
  SearchRecentItem,
  SearchUserItem,
} from '../types/search';

jest.mock('../services/api', () => ({
  getMyProfile: jest.fn(),
  getRecommendedUsers: jest.fn(),
  getTrendingClubs: jest.fn(),
  searchClubs: jest.fn(),
  searchContent: jest.fn(),
  searchUsers: jest.fn(),
}));

jest.mock('../services/recentSearches', () => ({
  RECENT_SEARCHES_LIMIT: 10,
  clearRecentSearches: jest.fn(),
  loadRecentSearches: jest.fn(),
  removeRecentSearch: jest.fn(),
  saveRecentSearch: jest.fn(),
}));

jest.mock('../services/searchPreferences', () => ({
  clearSearchFilters: jest.fn(),
  loadSearchFilters: jest.fn(),
  saveSearchFilters: jest.fn(),
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
const mockedSearchContent = searchContent as jest.MockedFunction<
  typeof searchContent
>;
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
const mockedLoadSearchFilters = loadSearchFilters as jest.MockedFunction<
  typeof loadSearchFilters
>;
const mockedSaveSearchFilters = saveSearchFilters as jest.MockedFunction<
  typeof saveSearchFilters
>;
const mockedClearSearchFilters = clearSearchFilters as jest.MockedFunction<
  typeof clearSearchFilters
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
    isOnline: false,
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

function makeContent(
  overrides: Partial<SearchContentItem> = {},
): SearchContentItem {
  return {
    id: 'truth:truth-1',
    sourceId: 'truth-1',
    sourceType: 'truth',
    contentType: 'truth',
    parentId: 'truth-1',
    clubId: null,
    title: 'Verdade de busca',
    snippet: 'Verdade de busca com conteudo encontrado.',
    badgeLabel: 'Verdade',
    authorName: 'Marina',
    commentsCount: 2,
    likesCount: 1,
    createdAt: '2026-05-30T12:00:00.000Z',
    route: 'feed-comments',
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

function makeContentPage(
  items: SearchContentItem[] = [],
  nextCursor: string | null = null,
): SearchPagination<SearchContentItem> {
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
    mockedLoadSearchFilters.mockResolvedValue(null);
    mockedSaveSearchFilters.mockResolvedValue(undefined);
    mockedClearSearchFilters.mockResolvedValue(undefined);
    mockedSearchUsers.mockResolvedValue(makeUserPage());
    mockedSearchClubs.mockResolvedValue(makeClubPage());
    mockedSearchContent.mockResolvedValue(makeContentPage());
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

  it('restaura filtros salvos por usuario sem persistir termo bruto', async () => {
    mockedLoadRecentSearches.mockResolvedValue([]);
    mockedLoadSearchFilters.mockResolvedValue({
      query: 'termo bruto nao deve voltar',
      minLevel: 2,
      maxLevel: 8,
      onlineOnly: true,
      clubVisibility: 'public',
      clubTag: 'noite',
    });

    const { result } = renderHook(() =>
      useSearchScreen({ userId: 'viewer-1' }),
    );

    await waitFor(() => {
      expect(result.current.filters).toEqual({
        minLevel: 2,
        maxLevel: 8,
        onlineOnly: true,
        clubVisibility: 'public',
        clubTag: 'noite',
      });
    });

    expect(mockedLoadSearchFilters).toHaveBeenCalledWith('viewer-1');
    expect(result.current.query).toBe('');
  });

  it('nao sobrescreve alteracao local quando leitura de filtros ainda esta pendente', async () => {
    mockedLoadRecentSearches.mockResolvedValue([]);
    const storedFilters = createDeferred<{
      onlineOnly: boolean;
      minLevel: number;
    } | null>();
    mockedLoadSearchFilters.mockReturnValue(storedFilters.promise);

    const { result } = renderHook(() =>
      useSearchScreen({ userId: 'viewer-1' }),
    );

    act(() => {
      result.current.applyFilters({
        onlineOnly: true,
      });
    });

    await act(async () => {
      storedFilters.resolve({
        onlineOnly: false,
        minLevel: 9,
      });
      await storedFilters.promise;
    });

    expect(result.current.filters).toEqual({
      minLevel: null,
      maxLevel: null,
      onlineOnly: true,
      clubVisibility: undefined,
      clubTag: null,
    });
    expect(mockedSaveSearchFilters).toHaveBeenCalledWith('viewer-1', {
      minLevel: null,
      maxLevel: null,
      onlineOnly: true,
      clubVisibility: undefined,
      clubTag: null,
    });
  });

  it('salva, limpa e isola filtros quando usuario troca', async () => {
    mockedLoadRecentSearches.mockResolvedValue([]);
    mockedLoadSearchFilters
      .mockResolvedValueOnce({
        onlineOnly: true,
      })
      .mockResolvedValueOnce({
        clubTag: 'outro-usuario',
      });

    const { result, rerender } = renderHook(
      ({ userId }: { userId: string }) => useSearchScreen({ userId }),
      {
        initialProps: {
          userId: 'viewer-1',
        },
      },
    );

    await waitFor(() => {
      expect(result.current.filters.onlineOnly).toBe(true);
    });

    act(() => {
      result.current.applyFilters({
        query: 'termo bruto nao persiste',
        clubVisibility: 'public',
        clubTag: 'desafio',
      });
    });

    expect(mockedSaveSearchFilters).toHaveBeenCalledWith('viewer-1', {
      minLevel: null,
      maxLevel: null,
      onlineOnly: false,
      clubVisibility: 'public',
      clubTag: 'desafio',
    });
    expect(JSON.stringify(mockedSaveSearchFilters.mock.calls[0][1])).not.toContain(
      'termo bruto',
    );

    act(() => {
      result.current.clearFilters();
    });

    expect(mockedClearSearchFilters).toHaveBeenCalledWith('viewer-1');

    rerender({
      userId: 'viewer-2',
    });

    await waitFor(() => {
      expect(mockedLoadSearchFilters).toHaveBeenLastCalledWith('viewer-2');
    });
    await waitFor(() => {
      expect(result.current.filters.clubTag).toBe('outro-usuario');
    });
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
    expect(mockedSearchContent).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);

    act(() => {
      jest.advanceTimersByTime(349);
    });

    expect(mockedSearchUsers).not.toHaveBeenCalled();
    expect(mockedSearchClubs).not.toHaveBeenCalled();
    expect(mockedSearchContent).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => {
      expect(mockedSearchUsers).toHaveBeenCalledTimes(1);
      expect(mockedSearchClubs).toHaveBeenCalledTimes(1);
      expect(mockedSearchContent).toHaveBeenCalledTimes(1);
    });
    expect(mockedSearchUsers).toHaveBeenCalledWith(
      'Marina',
      null,
      undefined,
      expect.any(Object),
      expect.objectContaining({ onlineOnly: false }),
    );
    expect(mockedSearchClubs).toHaveBeenCalledWith(
      'Marina',
      null,
      undefined,
      expect.any(Object),
      expect.objectContaining({ onlineOnly: false }),
    );
    expect(mockedSearchContent).toHaveBeenCalledWith(
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
    mockedSearchContent
      .mockResolvedValueOnce(
        makeContentPage(
          [makeContent({ id: 'truth:truth-resultado' })],
          'truth:truth-resultado',
        ),
      )
      .mockResolvedValueOnce(makeContentPage());

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
    expect(result.current.results.content).toEqual([
      expect.objectContaining({ id: 'truth:truth-resultado' }),
    ]);
    expect(result.current.hasAnyResults).toBe(true);
    expect(result.current.isEmptyResult).toBe(false);
    expect(result.current.hasMoreUsers).toBe(true);
    expect(result.current.hasMoreClubs).toBe(true);
    expect(result.current.hasMoreContent).toBe(true);

    act(() => {
      result.current.setQuery('sem resultado');
    });

    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(result.current.results).toEqual({
        users: [],
        clubs: [],
        content: [],
      });
    });
    expect(result.current.hasAnyResults).toBe(false);
    expect(result.current.isEmptyResult).toBe(true);
    expect(result.current.hasMoreUsers).toBe(false);
    expect(result.current.hasMoreClubs).toBe(false);
    expect(result.current.hasMoreContent).toBe(false);
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
      expect.objectContaining({ onlineOnly: false }),
    );
    expect(mockedSearchClubs).toHaveBeenCalledWith(
      'Marina',
      null,
      undefined,
      expect.any(Object),
      expect.objectContaining({ onlineOnly: false }),
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
    expect(result.current.results).toEqual({
      users: [],
      clubs: [],
      content: [],
    });
    expect(result.current.isEmptyResult).toBe(true);

    await act(async () => {
      await result.current.retry();
    });

    expect(mockedSearchUsers).toHaveBeenLastCalledWith(
      'Falha',
      null,
      undefined,
      expect.any(Object),
      expect.objectContaining({ onlineOnly: false }),
    );
    expect(result.current.error).toBeNull();
    expect(result.current.results.users).toEqual([makeUser()]);
    expect(result.current.hasMoreUsers).toBe(true);

    act(() => {
      result.current.clearQuery();
    });

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual({
      users: [],
      clubs: [],
      content: [],
    });
    expect(result.current.hasMoreUsers).toBe(false);
    expect(result.current.hasMoreClubs).toBe(false);
    expect(result.current.isInitialState).toBe(true);
    expect(result.current.isEmptyResult).toBe(false);
  });

  it('expoe filtros, flags de paginacao e callbacks publicos do contrato', async () => {
    const onPressFilter = jest.fn();
    const onPressUserResult = jest.fn();
    const onPressClubResult = jest.fn();
    const onPressContentResult = jest.fn();
    mockedLoadRecentSearches.mockResolvedValue([]);
    mockedSearchUsers.mockResolvedValue(makeUserPage([makeUser()]));
    mockedSearchClubs.mockResolvedValue(makeClubPage([makeClub()]));
    mockedSearchContent.mockResolvedValue(makeContentPage([makeContent()]));

    const { result } = renderHook(() =>
      useSearchScreen({
        userId: 'viewer-1',
        onPressFilter,
        onPressUserResult,
        onPressClubResult,
        onPressContentResult,
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
    expect(result.current.results.content).toHaveLength(0);
    expect(result.current.isLoadingMore).toBe(false);
    expect(result.current.hasMoreUsers).toBe(false);
    expect(result.current.hasMoreClubs).toBe(false);

    act(() => {
      result.current.onPressFilter();
    });

    await act(async () => {
      await result.current.onPressUserResult(makeUser({ id: 'user-nav' }));
      await result.current.onPressClubResult(makeClub({ id: 'club-nav' }));
      await result.current.onPressContentResult(
        makeContent({ id: 'truth:content-nav' }),
      );
    });

    expect(onPressFilter).toHaveBeenCalledTimes(1);
    expect(onPressUserResult).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-nav' }),
    );
    expect(onPressClubResult).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'club-nav' }),
    );
    expect(onPressContentResult).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'truth:content-nav' }),
    );
    expect(mockedSearchUsers).toHaveBeenCalledTimes(1);
    expect(mockedSearchClubs).toHaveBeenCalledTimes(1);
    expect(mockedSearchContent).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.setActiveFilter('content');
    });

    expect(result.current.results.users).toHaveLength(0);
    expect(result.current.results.clubs).toHaveLength(0);
    expect(result.current.results.content).toEqual([makeContent()]);
    expect(mockedSearchContent).toHaveBeenCalledTimes(1);
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

  it('aplica e limpa filtros avancados refazendo chamadas com parametros', async () => {
    mockedLoadRecentSearches.mockResolvedValue([]);
    mockedSearchUsers.mockResolvedValue(makeUserPage([makeUser()]));
    mockedSearchClubs.mockResolvedValue(makeClubPage([makeClub()]));

    const { result } = renderHook(() =>
      useSearchScreen({ userId: 'viewer-1' }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
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
    });

    act(() => {
      result.current.applyFilters({
        minLevel: 2,
        maxLevel: 8,
        onlineOnly: true,
        clubVisibility: 'public',
        clubTag: 'noite',
      });
    });

    expect(result.current.hasActiveFilters).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(mockedSearchUsers).toHaveBeenCalledTimes(2);
      expect(mockedSearchClubs).toHaveBeenCalledTimes(2);
    });
    expect(mockedSearchUsers).toHaveBeenLastCalledWith(
      'Marina',
      null,
      undefined,
      expect.any(Object),
      expect.objectContaining({
        minLevel: 2,
        maxLevel: 8,
        onlineOnly: true,
        clubVisibility: 'public',
        clubTag: 'noite',
      }),
    );
    expect(mockedSearchClubs).toHaveBeenLastCalledWith(
      'Marina',
      null,
      undefined,
      expect.any(Object),
      expect.objectContaining({
        minLevel: 2,
        maxLevel: 8,
        onlineOnly: true,
        clubVisibility: 'public',
        clubTag: 'noite',
      }),
    );

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.hasActiveFilters).toBe(false);

    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(mockedSearchUsers).toHaveBeenCalledTimes(3);
    });
    expect(mockedSearchUsers).toHaveBeenLastCalledWith(
      'Marina',
      null,
      undefined,
      expect.any(Object),
      expect.objectContaining({ onlineOnly: false, clubTag: null }),
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
      expect.objectContaining({ onlineOnly: false }),
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
      expect.objectContaining({ onlineOnly: false }),
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

  it('pagina conteudo com cursor e respeita o filtro ativo', async () => {
    mockedLoadRecentSearches.mockResolvedValue([]);
    mockedSearchUsers.mockResolvedValue(makeUserPage([makeUser()]));
    mockedSearchClubs.mockResolvedValue(makeClubPage([makeClub()]));
    mockedSearchContent
      .mockResolvedValueOnce(
        makeContentPage(
          [makeContent({ id: 'truth:content-1' })],
          'truth:content-cursor-2',
        ),
      )
      .mockResolvedValueOnce(
        makeContentPage([
          makeContent({
            id: 'truth_comment:comment-2',
            sourceType: 'truth_comment',
            contentType: 'comment',
            snippet: 'Comentario paginado',
          }),
        ]),
      );

    const { result } = renderHook(() =>
      useSearchScreen({ userId: 'viewer-1' }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.onPressRecent(makeRecent({ label: 'Conteudo' }));
    });

    act(() => {
      result.current.setActiveFilter('content');
    });

    await act(async () => {
      await result.current.loadMoreContent();
    });

    expect(mockedSearchContent).toHaveBeenCalledTimes(2);
    expect(mockedSearchContent).toHaveBeenLastCalledWith(
      'Conteudo',
      'truth:content-cursor-2',
      undefined,
      expect.any(Object),
    );
    expect(result.current.results.users).toEqual([]);
    expect(result.current.results.clubs).toEqual([]);
    expect(result.current.results.content).toEqual([
      expect.objectContaining({ id: 'truth:content-1' }),
      expect.objectContaining({ id: 'truth_comment:comment-2' }),
    ]);
    expect(result.current.hasMoreContent).toBe(false);

    act(() => {
      result.current.setActiveFilter('users');
    });

    await act(async () => {
      await result.current.loadMoreContent();
    });

    expect(mockedSearchContent).toHaveBeenCalledTimes(2);
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
    expect(result.current.results).toEqual({
      users: [],
      clubs: [],
      content: [],
    });
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

    expect(result.current.results).toEqual({
      users: [],
      clubs: [],
      content: [],
    });
  });
});
