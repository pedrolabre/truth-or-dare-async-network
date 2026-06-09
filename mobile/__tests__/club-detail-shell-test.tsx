import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ClubDetailScreen from '../app/clubs/[id]';
import { useClubDetailsScreen } from '../hooks/useClubDetailsScreen';
import { useClubAuditLog } from '../hooks/useClubAuditLog';
import { useClubFeed } from '../hooks/useClubFeed';
import { useClubMembers } from '../hooks/useClubMembers';
import type {
  ClubAuditLogScreenState,
  ClubDetail,
  ClubFeedScreenState,
  ClubMembersScreenState,
} from '../types/clubs';
import type { ClubFeedItemApi, ClubMemberApi } from '../types/clubsApi';

const mockRouterBack = jest.fn();
const mockRouterPush = jest.fn();
const mockUseLocalSearchParams = jest.fn();

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    MaterialIcons: ({ name }: { name: string }) =>
      React.createElement(Text, null, name),
  };
});

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => ({
    back: mockRouterBack,
    push: mockRouterPush,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }),
}));

jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock('../hooks/useClubDetailsScreen', () => ({
  useClubDetailsScreen: jest.fn(),
}));

jest.mock('../hooks/useClubAuditLog', () => ({
  useClubAuditLog: jest.fn(),
}));

jest.mock('../hooks/useClubFeed', () => ({
  useClubFeed: jest.fn(),
}));

jest.mock('../hooks/useClubMembers', () => ({
  useClubMembers: jest.fn(),
}));

const mockedUseClubDetailsScreen = useClubDetailsScreen as jest.MockedFunction<
  typeof useClubDetailsScreen
>;
const mockedUseClubAuditLog = useClubAuditLog as jest.MockedFunction<
  typeof useClubAuditLog
>;
const mockedUseClubFeed = useClubFeed as jest.MockedFunction<typeof useClubFeed>;
const mockedUseClubMembers = useClubMembers as jest.MockedFunction<
  typeof useClubMembers
>;

function makeClubDetail(overrides: Partial<ClubDetail> = {}): ClubDetail {
  return {
    id: 'club-real-123',
    slug: 'bons-desafios',
    name: 'Bons Desafios',
    description: 'Um clube para desafios leves.',
    descriptionText: 'Um clube para desafios leves.',
    iconName: 'sports-esports',
    avatarUrl: null,
    coverUrl: null,
    visibility: 'public',
    visibilityLabel: 'Publico',
    status: 'active',
    statusLabel: 'Ativo',
    memberCount: 4,
    membersLabel: '4 membros',
    promptCount: 7,
    promptsLabel: '7 prompts',
    lastActivityAt: '2026-05-21T12:00:00.000Z',
    rules: null,
    tags: [],
    createdAt: '2026-05-20T12:00:00.000Z',
    updatedAt: '2026-05-21T12:00:00.000Z',
    archivedAt: null,
    deletedAt: null,
    joinPolicy: 'open',
    viewerMembership: {
      isMember: true,
      role: 'owner',
      status: 'active',
    },
    viewerActivity: {
      unreadCount: 0,
      lastSeenAt: null,
      mutedUntil: null,
      isMuted: false,
    },
    membershipLabel: 'Dono',
    permissions: {
      canViewFeed: true,
      canPostPrompt: true,
      canInviteMembers: true,
      canManageMembers: true,
      canEditClub: true,
      canArchiveClub: true,
      canTransferOwnership: true,
    },
    ...overrides,
  };
}

function makeHookState(
  overrides: Partial<ReturnType<typeof useClubDetailsScreen>> = {},
): ReturnType<typeof useClubDetailsScreen> {
  const club = makeClubDetail();

  return {
    clubId: club.id,
    club,
    membership: club.viewerMembership,
    permissions: club.permissions,
    contentState: 'ready',
    isInitialLoading: false,
    isRefreshing: false,
    errorMessage: null,
    canRetry: true,
    pendingAction: null,
    actionErrorMessage: null,
    actionSuccessMessage: null,
    isMuted: false,
    clearActionFeedback: jest.fn(),
    handleClubUpdated: jest.fn(),
    handleClubActivityUpdated: jest.fn(),
    handleJoinClub: jest.fn().mockResolvedValue(undefined),
    handleLeaveClub: jest.fn().mockResolvedValue(undefined),
    handleToggleMute: jest.fn().mockResolvedValue(undefined),
    handleCreatePrompt: jest.fn().mockResolvedValue(null),
    handleRefresh: jest.fn().mockResolvedValue(undefined),
    handleRetry: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeFeedItem(overrides: Partial<ClubFeedItemApi> = {}): ClubFeedItemApi {
  return {
    id: 'prompt-1',
    clubId: 'club-real-123',
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
    answersCount: 1,
    commentsCount: 0,
    likesCount: 2,
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

function makeFeedState(
  overrides: Partial<ClubFeedScreenState> = {},
): ClubFeedScreenState {
  return {
    items: [makeFeedItem()],
    contentState: 'ready',
    nextCursor: null,
    isInitialLoading: false,
    isRefreshing: false,
    isLoadingMore: false,
    isSubmittingResponse: false,
    responseSubmittingPromptId: null,
    errorMessage: null,
    responseErrorMessage: null,
    isFromCache: false,
    syncErrorMessage: null,
    canRetry: true,
    canLoadMore: false,
    hasRealPromptPagination: true,
    handleRetry: jest.fn().mockResolvedValue(undefined),
    handleRefresh: jest.fn().mockResolvedValue(undefined),
    handleLoadMore: jest.fn().mockResolvedValue(undefined),
    clearResponseError: jest.fn(),
    submitPromptResponse: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function makeMember(overrides: Partial<ClubMemberApi> = {}): ClubMemberApi {
  return {
    id: 'membership-1',
    clubId: 'club-real-123',
    userId: 'user-member-1',
    name: 'Ana Membro',
    username: 'ana',
    role: 'member',
    status: 'active',
    joinedAt: '2026-05-20T12:00:00.000Z',
    lastSeenAt: null,
    mutedUntil: null,
    postingSuspendedUntil: null,
    createdAt: '2026-05-20T12:00:00.000Z',
    updatedAt: '2026-05-20T12:00:00.000Z',
    ...overrides,
  };
}

function makeMembersState(
  overrides: Partial<ClubMembersScreenState> = {},
): ClubMembersScreenState {
  return {
    items: [makeMember()],
    contentState: 'ready',
    searchQuery: '',
    roleFilter: null,
    statusFilter: null,
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    },
    isInitialLoading: false,
    isRefreshing: false,
    isLoadingMore: false,
    errorMessage: null,
    canRetry: true,
    canLoadMore: false,
    setSearchQuery: jest.fn(),
    setRoleFilter: jest.fn(),
    setStatusFilter: jest.fn(),
    handleRetry: jest.fn().mockResolvedValue(undefined),
    handleRefresh: jest.fn().mockResolvedValue(undefined),
    handleLoadMore: jest.fn().mockResolvedValue(undefined),
    replaceMember: jest.fn(),
    ...overrides,
  };
}

function makeAuditState(
  overrides: Partial<ClubAuditLogScreenState> = {},
): ClubAuditLogScreenState {
  return {
    items: [],
    filters: {
      action: null,
      targetUserId: null,
      entityType: null,
      from: null,
      to: null,
    },
    contentState: 'empty',
    nextCursor: null,
    isInitialLoading: false,
    isRefreshing: false,
    isLoadingMore: false,
    errorMessage: null,
    canRetry: true,
    canLoadMore: false,
    setActionFilter: jest.fn(),
    setTargetUserIdFilter: jest.fn(),
    setEntityTypeFilter: jest.fn(),
    setFromFilter: jest.fn(),
    setToFilter: jest.fn(),
    clearFilters: jest.fn(),
    handleRetry: jest.fn().mockResolvedValue(undefined),
    handleRefresh: jest.fn().mockResolvedValue(undefined),
    handleLoadMore: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('ClubDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({
      id: 'club-real-123',
    });
    mockedUseClubDetailsScreen.mockReturnValue(makeHookState());
    mockedUseClubAuditLog.mockReturnValue(makeAuditState());
    mockedUseClubFeed.mockReturnValue(makeFeedState());
    mockedUseClubMembers.mockReturnValue(makeMembersState());
  });

  it('recebe o id real da rota e renderiza o detalhe carregado', () => {
    const screen = render(<ClubDetailScreen />);
    const { getAllByText, getByTestId, getByText, queryByTestId } = screen;
    const getByLabelText = (label: string) =>
      label.includes('Abrir')
        ? getByTestId('club-actions-menu-button')
        : screen.getByLabelText(label);

    expect(mockedUseClubDetailsScreen).toHaveBeenCalledWith({
      clubId: 'club-real-123',
    });
    expect(mockedUseClubFeed).toHaveBeenCalledWith({
      clubId: 'club-real-123',
      isActive: true,
      canViewFeed: true,
      onFeedSeen: expect.any(Function),
    });
    expect(getAllByText('Bons Desafios')).toHaveLength(2);
    expect(getByTestId('club-detail-summary-card')).toBeTruthy();
    expect(getByTestId('club-header-card')).toBeTruthy();
    expect(getByTestId('club-header-invite')).toBeTruthy();
    expect(getByTestId('club-action-post-floating')).toBeTruthy();
    fireEvent.press(getByLabelText('Abrir ações do clube'));
    expect(getByTestId('club-overflow-menu')).toBeTruthy();
    expect(getByTestId('club-detail-tabs')).toBeTruthy();
    expect(getByTestId('club-feed-panel')).toBeTruthy();
    expect(getByTestId('club-prompt-card-prompt-1')).toBeTruthy();
    expect(getByTestId('club-detail-tab-feed')).toBeTruthy();
    expect(getByTestId('club-detail-tab-members')).toBeTruthy();
    expect(getByTestId('club-detail-tab-media')).toBeTruthy();
    expect(getByTestId('club-detail-tab-about')).toBeTruthy();
    expect(queryByTestId('club-detail-tab-audit')).toBeNull();
    expect(getByText('Auditoria')).toBeTruthy();
  });

  it('mantem navegacao de volta em sucesso', () => {
    const { getByLabelText } = render(<ClubDetailScreen />);

    fireEvent.press(getByLabelText('Voltar'));

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  it('troca abas internas sem acionar refresh do detalhe carregado', () => {
    const handleRefresh = jest.fn().mockResolvedValue(undefined);
    mockedUseClubDetailsScreen.mockReturnValue(
      makeHookState({
        handleRefresh,
      }),
    );

    const { getByTestId, getByText } = render(<ClubDetailScreen />);

    expect(getByTestId('club-feed-panel')).toBeTruthy();

    fireEvent.press(getByTestId('club-detail-tab-about'));
    expect(getByTestId('club-about-panel')).toBeTruthy();
    expect(getByText('Sem regras publicadas.')).toBeTruthy();

    fireEvent.press(getByTestId('club-detail-tab-media'));
    expect(getByTestId('club-media-unavailable')).toBeTruthy();

    fireEvent.press(getByTestId('club-detail-tab-members'));
    expect(getByTestId('club-members-panel')).toBeTruthy();

    fireEvent.press(getByTestId('club-detail-tab-feed'));
    expect(getByTestId('club-feed-panel')).toBeTruthy();
    expect(handleRefresh).not.toHaveBeenCalled();
  });

  it('abre auditoria pelo menu apenas para owner ou admin', () => {
    const screen = render(<ClubDetailScreen />);
    const { getByTestId, queryByLabelText, queryByTestId, rerender } = screen;
    const getByLabelText = (label: string) =>
      label.includes('Abrir')
        ? getByTestId('club-actions-menu-button')
        : screen.getByLabelText(label);

    expect(queryByTestId('club-detail-tab-audit')).toBeNull();
    expect(mockedUseClubAuditLog).toHaveBeenLastCalledWith({
      clubId: 'club-real-123',
      isActive: false,
      canViewAudit: true,
    });

    fireEvent.press(getByLabelText('Abrir aÃ§Ãµes do clube'));
    fireEvent.press(getByLabelText('Auditoria'));

    expect(getByTestId('club-audit-empty')).toBeTruthy();
    expect(mockedUseClubAuditLog).toHaveBeenLastCalledWith({
      clubId: 'club-real-123',
      isActive: true,
      canViewAudit: true,
    });

    const memberClub = makeClubDetail({
      viewerMembership: {
        isMember: true,
        role: 'member',
        status: 'active',
      },
      membershipLabel: 'Membro',
      permissions: {
        canViewFeed: true,
        canPostPrompt: true,
        canInviteMembers: false,
        canManageMembers: false,
        canEditClub: false,
        canArchiveClub: false,
        canTransferOwnership: false,
      },
    });

    mockedUseClubDetailsScreen.mockReturnValue(
      makeHookState({
        club: memberClub,
        permissions: memberClub.permissions,
      }),
    );

    rerender(<ClubDetailScreen />);

    expect(queryByTestId('club-detail-tab-audit')).toBeNull();
    fireEvent.press(getByLabelText('Abrir aÃ§Ãµes do clube'));
    expect(queryByLabelText('Auditoria')).toBeNull();
    expect(mockedUseClubAuditLog).toHaveBeenLastCalledWith({
      clubId: 'club-real-123',
      isActive: false,
      canViewAudit: false,
    });
  });

  it('navega para estado indisponivel de comentarios do prompt do clube', () => {
    const { getByTestId } = render(<ClubDetailScreen />);

    fireEvent.press(getByTestId('club-prompt-comments-prompt-1'));

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/feed-comments',
      params: {
        itemId: 'prompt-1',
        itemType: 'club',
        clubId: 'club-real-123',
        title: 'Conte uma verdade leve.',
        clubName: 'Bons Desafios',
        badge: 'Verdade',
        quote: 'Conte uma verdade leve.',
        commentsCount: '0',
        likesCount: '2',
      },
    });
  });

  it('carrega membros apenas quando a aba Membros esta ativa', () => {
    const { getByTestId } = render(<ClubDetailScreen />);

    expect(mockedUseClubMembers).toHaveBeenLastCalledWith({
      clubId: 'club-real-123',
      isActive: false,
    });

    fireEvent.press(getByTestId('club-detail-tab-members'));

    expect(mockedUseClubMembers).toHaveBeenLastCalledWith({
      clubId: 'club-real-123',
      isActive: true,
    });
  });

  it('passa aba ativa e permissao real para o feed interno', () => {
    const { getByTestId } = render(<ClubDetailScreen />);

    expect(mockedUseClubFeed).toHaveBeenLastCalledWith({
      clubId: 'club-real-123',
      isActive: true,
      canViewFeed: true,
      onFeedSeen: expect.any(Function),
    });

    fireEvent.press(getByTestId('club-detail-tab-about'));

    expect(mockedUseClubFeed).toHaveBeenLastCalledWith({
      clubId: 'club-real-123',
      isActive: false,
      canViewFeed: true,
      onFeedSeen: expect.any(Function),
    });
  });

  it('mostra acesso indisponivel no feed quando a permissao nega visualizacao', () => {
    const club = makeClubDetail({
      permissions: {
        ...makeClubDetail().permissions,
        canViewFeed: false,
      },
    });
    mockedUseClubDetailsScreen.mockReturnValue(
      makeHookState({
        club,
        permissions: club.permissions,
      }),
    );
    mockedUseClubFeed.mockReturnValue(
      makeFeedState({
        items: [],
        contentState: 'access-denied',
        canRetry: false,
      }),
    );

    const { getByTestId, getByText } = render(<ClubDetailScreen />);

    expect(mockedUseClubFeed).toHaveBeenLastCalledWith({
      clubId: 'club-real-123',
      isActive: true,
      canViewFeed: false,
      onFeedSeen: expect.any(Function),
    });
    expect(getByTestId('club-feed-access-unavailable')).toBeTruthy();
    expect(getByText('Feed indisponivel')).toBeTruthy();
  });

  it('mostra loading inicial sem perder o botao de voltar', () => {
    mockedUseClubDetailsScreen.mockReturnValue(
      makeHookState({
        club: null,
        membership: null,
        permissions: null,
        contentState: 'loading',
        isInitialLoading: true,
        canRetry: false,
      }),
    );

    const { getByLabelText, getByText } = render(<ClubDetailScreen />);

    expect(getByText('Carregando clube')).toBeTruthy();

    fireEvent.press(getByLabelText('Voltar'));

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  it('mostra erro amigavel com retry', () => {
    const handleRetry = jest.fn().mockResolvedValue(undefined);
    mockedUseClubDetailsScreen.mockReturnValue(
      makeHookState({
        club: null,
        membership: null,
        permissions: null,
        contentState: 'error',
        errorMessage: 'Falha de rede',
        handleRetry,
      }),
    );

    const { getByText } = render(<ClubDetailScreen />);

    expect(getByText('Nao foi possivel carregar o clube')).toBeTruthy();
    expect(getByText('Falha de rede')).toBeTruthy();

    fireEvent.press(getByText('Tentar novamente'));

    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renderiza acesso negado, nao encontrado e arquivado como estados claros', () => {
    mockedUseClubDetailsScreen.mockReturnValue(
      makeHookState({
        club: null,
        membership: null,
        permissions: null,
        contentState: 'access-denied',
        errorMessage: 'Este clube e privado.',
      }),
    );

    const { getByText, rerender } = render(<ClubDetailScreen />);

    expect(getByText('Clube privado')).toBeTruthy();
    expect(getByText('Este clube e privado.')).toBeTruthy();

    mockedUseClubDetailsScreen.mockReturnValue(
      makeHookState({
        club: null,
        membership: null,
        permissions: null,
        contentState: 'not-found',
        errorMessage: 'Este clube foi removido.',
      }),
    );
    rerender(<ClubDetailScreen />);

    expect(getByText('Clube nao encontrado')).toBeTruthy();
    expect(getByText('Este clube foi removido.')).toBeTruthy();

    mockedUseClubDetailsScreen.mockReturnValue(
      makeHookState({
        club: makeClubDetail({
          status: 'archived',
          statusLabel: 'Arquivado',
          archivedAt: '2026-05-21T10:00:00.000Z',
        }),
        contentState: 'archived',
      }),
    );
    rerender(<ClubDetailScreen />);

    expect(getByText('Clube arquivado')).toBeTruthy();
  });
});
