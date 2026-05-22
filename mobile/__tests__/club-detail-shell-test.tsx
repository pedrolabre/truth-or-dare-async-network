import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ClubDetailScreen from '../app/clubs/[id]';
import { useClubDetailsScreen } from '../hooks/useClubDetailsScreen';
import { useClubFeed } from '../hooks/useClubFeed';
import type { ClubDetail, ClubFeedScreenState } from '../types/clubs';
import type { ClubFeedItemApi } from '../types/clubsApi';

const mockRouterBack = jest.fn();
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

jest.mock('../hooks/useClubFeed', () => ({
  useClubFeed: jest.fn(),
}));

const mockedUseClubDetailsScreen = useClubDetailsScreen as jest.MockedFunction<
  typeof useClubDetailsScreen
>;
const mockedUseClubFeed = useClubFeed as jest.MockedFunction<typeof useClubFeed>;

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
    isInitialLoading: false,
    isRefreshing: false,
    isSubmittingResponse: false,
    responseSubmittingPromptId: null,
    errorMessage: null,
    responseErrorMessage: null,
    canRetry: true,
    hasRealPromptPagination: false,
    handleRetry: jest.fn().mockResolvedValue(undefined),
    handleRefresh: jest.fn().mockResolvedValue(undefined),
    clearResponseError: jest.fn(),
    submitPromptResponse: jest.fn().mockResolvedValue(null),
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
    mockedUseClubFeed.mockReturnValue(makeFeedState());
  });

  it('recebe o id real da rota e renderiza o detalhe carregado', () => {
    const { getAllByText, getByTestId } = render(
      <ClubDetailScreen />,
    );

    expect(mockedUseClubDetailsScreen).toHaveBeenCalledWith({
      clubId: 'club-real-123',
    });
    expect(mockedUseClubFeed).toHaveBeenCalledWith({
      clubId: 'club-real-123',
      isActive: true,
      canViewFeed: true,
    });
    expect(getAllByText('Bons Desafios')).toHaveLength(2);
    expect(getByTestId('club-detail-summary-card')).toBeTruthy();
    expect(getByTestId('club-header-card')).toBeTruthy();
    expect(getByTestId('club-action-bar')).toBeTruthy();
    expect(getByTestId('club-detail-tabs')).toBeTruthy();
    expect(getByTestId('club-feed-panel')).toBeTruthy();
    expect(getByTestId('club-prompt-card-prompt-1')).toBeTruthy();
    expect(getByTestId('club-detail-tab-feed')).toBeTruthy();
    expect(getByTestId('club-detail-tab-members')).toBeTruthy();
    expect(getByTestId('club-detail-tab-ranking')).toBeTruthy();
    expect(getByTestId('club-detail-tab-about')).toBeTruthy();
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

    fireEvent.press(getByTestId('club-detail-tab-ranking'));
    expect(getByTestId('club-ranking-unavailable')).toBeTruthy();

    fireEvent.press(getByTestId('club-detail-tab-members'));
    expect(getByTestId('club-members-placeholder')).toBeTruthy();

    fireEvent.press(getByTestId('club-detail-tab-feed'));
    expect(getByTestId('club-feed-panel')).toBeTruthy();
    expect(handleRefresh).not.toHaveBeenCalled();
  });

  it('passa aba ativa e permissao real para o feed interno', () => {
    const { getByTestId } = render(<ClubDetailScreen />);

    expect(mockedUseClubFeed).toHaveBeenLastCalledWith({
      clubId: 'club-real-123',
      isActive: true,
      canViewFeed: true,
    });

    fireEvent.press(getByTestId('club-detail-tab-about'));

    expect(mockedUseClubFeed).toHaveBeenLastCalledWith({
      clubId: 'club-real-123',
      isActive: false,
      canViewFeed: true,
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
