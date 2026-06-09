import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  CLUB_FEED_HAS_REAL_PROMPT_PAGINATION,
  useClubFeed,
} from '../hooks/useClubFeed';
import { LOCAL_CACHE_KEYS, LOCAL_CACHE_TTLS, writeCache } from '../services/cache';
import type { ClubFeedApi, ClubFeedItemApi } from '../types/clubsApi';

jest.mock('../services/clubsApi', () => ({
  createClubPromptResponse: jest.fn(),
  getClubFeed: jest.fn(),
  markClubFeedSeen: jest.fn().mockResolvedValue({
    lastSeenAt: '2026-05-23T12:00:00.000Z',
    unreadCount: 0,
    readCount: 1,
  }),
}));

function makeToken(userId: string) {
  const payload = btoa(JSON.stringify({ sub: userId }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `header.${payload}.signature`;
}

function makeFeedItem(
  overrides: Partial<ClubFeedItemApi> = {},
): ClubFeedItemApi {
  return {
    id: 'prompt-1',
    clubId: 'club-1',
    authorId: 'user-1',
    authorName: 'Ana',
    type: 'truth',
    status: 'published',
    content: 'Conte uma verdade leve.',
    difficulty: 'leve',
    attachments: [],
    maxAttempts: null,
    expiresAt: null,
    publishedAt: '2026-05-21T12:00:00.000Z',
    answersCount: 0,
    commentsCount: 0,
    likesCount: 0,
    isPinned: false,
    isMembersOnly: false,
    createdAt: '2026-05-21T12:00:00.000Z',
    updatedAt: '2026-05-21T12:00:00.000Z',
    viewerState: {
      likedByMe: false,
      answeredByMe: false,
      canAnswer: true,
    },
    recentResponses: [],
    ...overrides,
  };
}

function makeFeed(items: ClubFeedItemApi[] = [makeFeedItem()]): ClubFeedApi {
  return {
    club: {
      id: 'club-1',
      slug: 'bons-desafios',
      name: 'Bons Desafios',
      description: 'Um clube para desafios leves.',
      iconName: 'sports-esports',
      avatarUrl: null,
      visibility: 'public',
      status: 'active',
      memberCount: 4,
      promptCount: items.length,
      lastActivityAt: '2026-05-21T12:00:00.000Z',
      viewerMembership: {
        isMember: true,
        role: 'member',
        status: 'active',
      },
    },
    items,
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

describe('useClubFeed', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('nao carrega feed enquanto a aba nao esta ativa', () => {
    const loadClubFeed = jest.fn().mockResolvedValue(makeFeed());
    const markClubFeedSeenAction = jest.fn();

    const { result } = renderHook(() =>
      useClubFeed({
        clubId: 'club-1',
        isActive: false,
        canViewFeed: true,
        loadClubFeed,
        markClubFeedSeenAction,
      }),
    );

    expect(result.current.contentState).toBe('idle');
    expect(loadClubFeed).not.toHaveBeenCalled();
    expect(markClubFeedSeenAction).not.toHaveBeenCalled();
  });

  it('carrega feed real quando a aba esta ativa e ha permissao', async () => {
    const loadClubFeed = jest.fn().mockResolvedValue(makeFeed());
    const markClubFeedSeenAction = jest.fn().mockResolvedValue({
      lastSeenAt: '2026-05-23T12:00:00.000Z',
      unreadCount: 0,
      readCount: 2,
    });
    const onFeedSeen = jest.fn();

    const { result } = renderHook(() =>
      useClubFeed({
        clubId: 'club-1',
        isActive: true,
        canViewFeed: true,
        loadClubFeed,
        markClubFeedSeenAction,
        onFeedSeen,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    expect(loadClubFeed).toHaveBeenCalledTimes(1);
    expect(loadClubFeed).toHaveBeenCalledWith('club-1', 'activity');
    expect(result.current.items).toHaveLength(1);
    expect(result.current.hasRealPromptPagination).toBe(false);
    expect(CLUB_FEED_HAS_REAL_PROMPT_PAGINATION).toBe(false);

    await waitFor(() => {
      expect(markClubFeedSeenAction).toHaveBeenCalledWith('club-1');
    });
    expect(markClubFeedSeenAction).toHaveBeenCalledTimes(1);
    expect(onFeedSeen).toHaveBeenCalledWith({
      lastSeenAt: '2026-05-23T12:00:00.000Z',
      unreadCount: 0,
      readCount: 2,
    });
  });

  it('marca feed visto apenas uma vez apos a aba/feed estar ativa', async () => {
    const loadClubFeed = jest.fn().mockResolvedValue(makeFeed());
    const markClubFeedSeenAction = jest.fn().mockResolvedValue({
      lastSeenAt: '2026-05-23T12:00:00.000Z',
      unreadCount: 0,
      readCount: 1,
    });

    const { result } = renderHook(() =>
      useClubFeed({
        clubId: 'club-1',
        isActive: true,
        canViewFeed: true,
        loadClubFeed,
        markClubFeedSeenAction,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    await waitFor(() => {
      expect(markClubFeedSeenAction).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await result.current.handleRefresh();
    });

    expect(loadClubFeed).toHaveBeenCalledTimes(2);
    expect(markClubFeedSeenAction).toHaveBeenCalledTimes(1);
  });

  it('falha ao marcar feed visto nao quebra renderizacao', async () => {
    const loadClubFeed = jest.fn().mockResolvedValue(makeFeed());
    const markClubFeedSeenAction = jest
      .fn()
      .mockRejectedValue(new Error('Falha ao marcar visto'));

    const { result } = renderHook(() =>
      useClubFeed({
        clubId: 'club-1',
        isActive: true,
        canViewFeed: true,
        loadClubFeed,
        markClubFeedSeenAction,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    await waitFor(() => {
      expect(markClubFeedSeenAction).toHaveBeenCalledTimes(1);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.errorMessage).toBeNull();
  });

  it('mostra estado vazio quando o endpoint retorna lista sem prompts', async () => {
    const loadClubFeed = jest.fn().mockResolvedValue(makeFeed([]));

    const { result } = renderHook(() =>
      useClubFeed({
        clubId: 'club-1',
        isActive: true,
        canViewFeed: true,
        loadClubFeed,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('empty');
    });

    expect(result.current.items).toEqual([]);
  });

  it('mostra erro e retry recupera o feed sem paginacao falsa', async () => {
    const loadClubFeed = jest
      .fn()
      .mockRejectedValueOnce(new Error('Falha de rede'))
      .mockResolvedValueOnce(makeFeed([makeFeedItem({ id: 'prompt-retry' })]));

    const { result } = renderHook(() =>
      useClubFeed({
        clubId: 'club-1',
        isActive: true,
        canViewFeed: true,
        loadClubFeed,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('error');
    });

    expect(result.current.errorMessage).toBe('Falha de rede');

    await act(async () => {
      await result.current.handleRetry();
    });

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    expect(loadClubFeed).toHaveBeenCalledTimes(2);
    expect(loadClubFeed).toHaveBeenLastCalledWith('club-1', 'activity');
    expect(result.current.items[0]?.id).toBe('prompt-retry');
    expect(result.current.hasRealPromptPagination).toBe(false);
  });

  it('refresh preserva prompts ja carregados quando ocorre erro', async () => {
    const loadClubFeed = jest
      .fn()
      .mockResolvedValueOnce(makeFeed([makeFeedItem({ id: 'prompt-loaded' })]))
      .mockRejectedValueOnce(new Error('Offline'));

    const { result } = renderHook(() =>
      useClubFeed({
        clubId: 'club-1',
        isActive: true,
        canViewFeed: true,
        loadClubFeed,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    await act(async () => {
      await result.current.handleRefresh();
    });

    expect(result.current.contentState).toBe('ready');
    expect(result.current.items[0]?.id).toBe('prompt-loaded');
    expect(result.current.errorMessage).toBe('Offline');
  });

  it('expoe loading inicial separado do detalhe do clube', async () => {
    const deferred = createDeferred<ClubFeedApi>();
    const loadClubFeed = jest.fn().mockReturnValue(deferred.promise);

    const { result } = renderHook(() =>
      useClubFeed({
        clubId: 'club-1',
        isActive: true,
        canViewFeed: true,
        loadClubFeed,
      }),
    );

    expect(result.current.contentState).toBe('loading');
    expect(result.current.isInitialLoading).toBe(true);

    await act(async () => {
      deferred.resolve(makeFeed());
      await deferred.promise;
    });

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
    });
  });

  it('respeita permissions.canViewFeed e nao chama o endpoint sem permissao', () => {
    const loadClubFeed = jest.fn().mockResolvedValue(makeFeed());

    const { result } = renderHook(() =>
      useClubFeed({
        clubId: 'club-1',
        isActive: true,
        canViewFeed: false,
        loadClubFeed,
      }),
    );

    expect(result.current.contentState).toBe('access-denied');
    expect(result.current.canRetry).toBe(false);
    expect(loadClubFeed).not.toHaveBeenCalled();
  });

  it('envia resposta de verdade com payload real e atualiza prompt local apos sucesso', async () => {
    const response = {
      id: 'response-real-1',
      clubId: 'club-1',
      promptId: 'prompt-1',
      userId: 'viewer-1',
      userName: 'Viewer',
      text: 'Minha resposta real.',
      mediaUrl: null,
      mediaType: null,
      dareProofId: null,
      attemptsUsed: 0,
      completedAt: '2026-05-22T12:00:00.000Z',
      likesCount: 0,
      commentsCount: 0,
      createdAt: '2026-05-22T12:00:00.000Z',
      updatedAt: '2026-05-22T12:00:00.000Z',
    };
    const submitClubPromptResponse = jest.fn().mockResolvedValue(response);

    const { result } = renderHook(() =>
      useClubFeed({
        clubId: 'club-1',
        isActive: true,
        canViewFeed: true,
        loadClubFeed: jest.fn().mockResolvedValue(makeFeed([makeFeedItem()])),
        submitClubPromptResponse,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    await act(async () => {
      await result.current.submitPromptResponse('prompt-1', {
        text: 'Minha resposta real.',
        mediaUrl: null,
        mediaType: null,
        dareProofId: null,
      });
    });

    expect(submitClubPromptResponse).toHaveBeenCalledWith('club-1', 'prompt-1', {
      text: 'Minha resposta real.',
      mediaUrl: null,
      mediaType: null,
      dareProofId: null,
    });
    expect(result.current.items[0]?.answersCount).toBe(1);
    expect(result.current.items[0]?.viewerState.answeredByMe).toBe(true);
    expect(result.current.items[0]?.viewerState.canAnswer).toBe(false);
    expect(result.current.items[0]?.recentResponses[0]).toEqual(response);
  });

  it('nao cria resposta local quando o endpoint de resposta falha', async () => {
    const submitClubPromptResponse = jest
      .fn()
      .mockRejectedValue(new Error('Falha ao responder'));

    const { result } = renderHook(() =>
      useClubFeed({
        clubId: 'club-1',
        isActive: true,
        canViewFeed: true,
        loadClubFeed: jest.fn().mockResolvedValue(makeFeed([makeFeedItem()])),
        submitClubPromptResponse,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    await act(async () => {
      try {
        await result.current.submitPromptResponse('prompt-1', {
          text: 'Tentativa preservada pela modal.',
        });
      } catch {
        return;
      }
    });

    expect(result.current.items[0]?.answersCount).toBe(0);
    expect(result.current.items[0]?.viewerState.answeredByMe).toBe(false);
    expect(result.current.items[0]?.recentResponses).toEqual([]);
    expect(result.current.responseErrorMessage).toBe('Falha ao responder');
  });

  it('renderiza feed cacheado antes da sincronizacao do backend', async () => {
    await AsyncStorage.setItem('auth_token', makeToken('user-1'));
    await writeCache(
      LOCAL_CACHE_KEYS.clubFeed('club-1'),
      makeFeed([makeFeedItem({ id: 'prompt-cache', content: 'Cache' })]),
      { ttlMs: LOCAL_CACHE_TTLS.clubFeed },
    );
    const deferred = createDeferred<ClubFeedApi>();
    const loadClubFeed = jest.fn().mockReturnValue(deferred.promise);
    const markClubFeedSeenAction = jest.fn();

    const { result } = renderHook(() =>
      useClubFeed({
        clubId: 'club-1',
        isActive: true,
        canViewFeed: true,
        loadClubFeed,
        markClubFeedSeenAction,
      }),
    );

    await waitFor(() => {
      expect(result.current.items[0]?.id).toBe('prompt-cache');
      expect(result.current.isFromCache).toBe(true);
    });
    expect(markClubFeedSeenAction).not.toHaveBeenCalled();

    await act(async () => {
      deferred.resolve(
        makeFeed([makeFeedItem({ id: 'prompt-fresh', content: 'Backend' })]),
      );
      await deferred.promise;
    });

    await waitFor(() => {
      expect(result.current.items[0]?.id).toBe('prompt-fresh');
      expect(result.current.isFromCache).toBe(false);
      expect(result.current.syncErrorMessage).toBeNull();
    });
    await waitFor(() => {
      expect(markClubFeedSeenAction).toHaveBeenCalledWith('club-1');
    });
  });

  it('mantem feed cacheado quando a sincronizacao falha', async () => {
    await AsyncStorage.setItem('auth_token', makeToken('user-1'));
    await writeCache(
      LOCAL_CACHE_KEYS.clubFeed('club-1'),
      makeFeed([makeFeedItem({ id: 'prompt-offline', content: 'Offline' })]),
      { ttlMs: LOCAL_CACHE_TTLS.clubFeed },
    );
    const loadClubFeed = jest.fn().mockRejectedValue(new Error('Offline'));
    const markClubFeedSeenAction = jest.fn();

    const { result } = renderHook(() =>
      useClubFeed({
        clubId: 'club-1',
        isActive: true,
        canViewFeed: true,
        loadClubFeed,
        markClubFeedSeenAction,
      }),
    );

    await waitFor(() => {
      expect(result.current.items[0]?.id).toBe('prompt-offline');
      expect(result.current.isFromCache).toBe(true);
      expect(result.current.syncErrorMessage).toBe('Offline');
    });
    expect(markClubFeedSeenAction).not.toHaveBeenCalled();
  });
});
