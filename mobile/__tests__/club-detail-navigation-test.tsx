import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import ClubsScreen from '../app/clubs';
import ClubDetailScreen from '../app/clubs/[id]';
import CreateGroupScreen from '../app/create-group';
import FeedCommentsScreen from '../app/feed-comments';
import { useClubDetailsScreen } from '../hooks/useClubDetailsScreen';
import { useClubFeed } from '../hooks/useClubFeed';
import { useClubMembers } from '../hooks/useClubMembers';
import { useClubsScreen } from '../hooks/useClubsScreen';
import { useCreateGroupScreen } from '../hooks/useCreateGroupScreen';
import { publishMyClubsUpsert } from '../services/clubsLocalUpdates';
import type {
  ClubDetail,
  ClubFeedScreenState,
  ClubMembersScreenState,
} from '../types/clubs';
import type { ClubDetailsApi, ClubFeedItemApi, ClubMemberApi } from '../types/clubsApi';

const mockRouterBack = jest.fn();
const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();
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
    replace: mockRouterReplace,
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

jest.mock('../hooks/useClubMembers', () => ({
  useClubMembers: jest.fn(),
}));

jest.mock('../hooks/useClubsScreen', () => ({
  useClubsScreen: jest.fn(),
}));

jest.mock('../hooks/useCreateGroupScreen', () => ({
  useCreateGroupScreen: jest.fn(),
}));

jest.mock('../services/clubsLocalUpdates', () => ({
  publishMyClubsUpsert: jest.fn(),
}));

const mockedUseClubDetailsScreen = useClubDetailsScreen as jest.MockedFunction<
  typeof useClubDetailsScreen
>;
const mockedUseClubFeed = useClubFeed as jest.MockedFunction<typeof useClubFeed>;
const mockedUseClubMembers = useClubMembers as jest.MockedFunction<
  typeof useClubMembers
>;
const mockedUseClubsScreen = useClubsScreen as jest.MockedFunction<
  typeof useClubsScreen
>;
const mockedUseCreateGroupScreen =
  useCreateGroupScreen as jest.MockedFunction<typeof useCreateGroupScreen>;
const mockedPublishMyClubsUpsert =
  publishMyClubsUpsert as jest.MockedFunction<typeof publishMyClubsUpsert>;

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

function makeClubDetailsApi(
  overrides: Partial<ClubDetailsApi> = {},
): ClubDetailsApi {
  return {
    id: 'club-created-real',
    slug: 'clube-criado-real',
    name: 'Clube Criado Real',
    description: 'Descricao criada pela API.',
    iconName: 'favorite',
    avatarUrl: null,
    visibility: 'private',
    status: 'active',
    memberCount: 2,
    promptCount: 0,
    lastActivityAt: '2026-05-21T12:00:00.000Z',
    viewerMembership: {
      isMember: true,
      role: 'owner',
      status: 'active',
    },
    coverUrl: null,
    rules: null,
    tags: ['games'],
    createdAt: '2026-05-21T12:00:00.000Z',
    updatedAt: '2026-05-21T12:00:00.000Z',
    archivedAt: null,
    deletedAt: null,
    joinPolicy: 'invite_only',
    permissions: makeClubDetail().permissions,
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
    createdAt: '2026-05-20T12:00:00.000Z',
    updatedAt: '2026-05-20T12:00:00.000Z',
    ...overrides,
  };
}

function makeDetailState(
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
    ...overrides,
  };
}

function makeClubsState(
  overrides: Partial<ReturnType<typeof useClubsScreen>> = {},
): ReturnType<typeof useClubsScreen> {
  const myClub = {
    id: 'my-real-club-id',
    name: 'Clube Real do Usuario',
    description: 'Clube vindo da API de Meus Clubes.',
    memberCount: 3,
    membersLabel: '3 membros',
    statusLabel: 'Membro',
    iconName: 'groups',
    isActive: true,
  };

  return {
    activeTab: 'my-clubs',
    activeContentState: 'list',
    clubActionErrorMessage: null,
    discoverClubs: [],
    discoverContentState: 'empty',
    errorMessage: null,
    filteredDiscoverClubs: [],
    handleChangeTab: jest.fn(),
    handleJoinClub: jest.fn(),
    handleRefresh: jest.fn(),
    handleRetry: jest.fn(),
    hasSearchQuery: false,
    isDiscoverEmpty: true,
    isInitialLoading: false,
    isLoading: false,
    isMyClubsEmpty: false,
    isRefreshing: false,
    isSearchLoading: false,
    joiningClubIds: [],
    myClubs: [myClub],
    myClubsContentState: 'list',
    query: '',
    searchErrorMessage: null,
    searchResults: [],
    setQuery: jest.fn(),
    visibleDiscoverClubs: [],
    ...overrides,
  };
}

function makeCreateGroupState(
  overrides: Partial<ReturnType<typeof useCreateGroupScreen>> = {},
): ReturnType<typeof useCreateGroupScreen> {
  return {
    name: 'Clube Valido',
    description: 'Descricao valida do clube.',
    visibility: 'public',
    rules: '',
    selectedTags: [],
    friendQuery: '',
    selectedMembers: [],
    selectedIcon: 'groups',
    iconModalVisible: false,
    memberOptions: [],
    isLoadingMembers: false,
    memberSearchError: null,
    isSubmitting: false,
    createGroupError: null,
    selectedCount: 0,
    nameError: null,
    descriptionError: null,
    descriptionWarning: null,
    descriptionCharacterCount: 26,
    descriptionMaxLength: 280,
    rulesError: null,
    rulesCharacterCount: 0,
    rulesMaxLength: 2000,
    tagMaxCount: 10,
    canCreate: true,
    canRetryCreateGroup: false,
    setName: jest.fn(),
    setDescription: jest.fn(),
    setVisibility: jest.fn(),
    setRules: jest.fn(),
    setFriendQuery: jest.fn(),
    toggleMember: jest.fn(),
    retryMemberSearch: jest.fn(),
    toggleTag: jest.fn(),
    openIconModal: jest.fn(),
    closeIconModal: jest.fn(),
    selectIcon: jest.fn(),
    buildPayload: jest.fn(),
    handleCreateGroup: jest.fn().mockResolvedValue(null),
    retryCreateGroup: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

describe('club detail navigation coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockUseLocalSearchParams.mockReturnValue({
      id: 'club-real-123',
    });
    mockedUseClubDetailsScreen.mockReturnValue(makeDetailState());
    mockedUseClubFeed.mockReturnValue(makeFeedState());
    mockedUseClubMembers.mockReturnValue(makeMembersState());
    mockedUseClubsScreen.mockReturnValue(makeClubsState());
    mockedUseCreateGroupScreen.mockReturnValue(makeCreateGroupState());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('navega de Clubes para o detalhe usando o id real do clube', () => {
    const { getByText } = render(<ClubsScreen />);

    fireEvent.press(getByText('Clube Real do Usuario'));

    expect(mockRouterPush).toHaveBeenCalledWith('/clubs/my-real-club-id');
  });

  it('navega da criacao para o detalhe usando o id retornado pela API', async () => {
    jest.useFakeTimers();
    const createdClub = makeClubDetailsApi({
      id: 'club-real-retornado',
    });

    mockedUseCreateGroupScreen.mockReturnValue(
      makeCreateGroupState({
        handleCreateGroup: jest.fn().mockResolvedValue(createdClub),
      }),
    );

    const { getByText } = render(<CreateGroupScreen />);

    fireEvent.press(getByText('Criar Grupo'));

    await waitFor(() => {
      expect(getByText('Clube criado. Abrindo detalhes...')).toBeTruthy();
    });

    expect(mockedPublishMyClubsUpsert).toHaveBeenCalledWith(createdClub);

    await act(async () => {
      jest.advanceTimersByTime(700);
      await Promise.resolve();
    });

    expect(mockRouterReplace).toHaveBeenCalledWith('/clubs/club-real-retornado');
  });

  it('detalhe carrega o id real e preserva navegacao de volta no sucesso', () => {
    const { getByLabelText, getByTestId } = render(<ClubDetailScreen />);

    expect(mockedUseClubDetailsScreen).toHaveBeenCalledWith({
      clubId: 'club-real-123',
    });
    expect(getByTestId('club-feed-panel')).toBeTruthy();

    fireEvent.press(getByLabelText('Voltar'));

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  it('preserva navegacao de volta em erro e acesso negado', () => {
    mockedUseClubDetailsScreen.mockReturnValue(
      makeDetailState({
        club: null,
        membership: null,
        permissions: null,
        contentState: 'error',
        errorMessage: 'Falha de rede',
      }),
    );

    const { getByLabelText, getByText, rerender } = render(<ClubDetailScreen />);

    expect(getByText('Falha de rede')).toBeTruthy();
    fireEvent.press(getByLabelText('Voltar'));

    mockedUseClubDetailsScreen.mockReturnValue(
      makeDetailState({
        club: null,
        membership: null,
        permissions: null,
        contentState: 'access-denied',
        errorMessage: 'Este clube e privado.',
      }),
    );
    rerender(<ClubDetailScreen />);

    expect(getByText('Este clube e privado.')).toBeTruthy();
    fireEvent.press(getByLabelText('Voltar'));

    expect(mockRouterBack).toHaveBeenCalledTimes(2);
  });

  it('troca entre Detalhe, Feed e Membros sem perder o clube carregado', () => {
    const { getAllByText, getByTestId, getByText } = render(<ClubDetailScreen />);

    expect(getByTestId('club-feed-panel')).toBeTruthy();

    fireEvent.press(getByTestId('club-detail-tab-members'));
    expect(getByTestId('club-members-panel')).toBeTruthy();
    expect(getByText('Ana Membro')).toBeTruthy();

    fireEvent.press(getByTestId('club-detail-tab-feed'));
    expect(getByTestId('club-feed-panel')).toBeTruthy();
    expect(getAllByText('Bons Desafios')).toHaveLength(2);
  });

  it('abre feed-comments para prompt de clube sem listar comentarios falsos', () => {
    const { getByTestId, unmount } = render(<ClubDetailScreen />);

    fireEvent.press(getByTestId('club-prompt-comments-prompt-1'));

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/feed-comments',
      params: {
        itemId: 'prompt-1',
        itemType: 'club',
        title: 'Conte uma verdade leve.',
        clubName: 'Bons Desafios',
        badge: 'Verdade',
        quote: 'Conte uma verdade leve.',
        commentsCount: '0',
        likesCount: '2',
      },
    });

    unmount();
    mockUseLocalSearchParams.mockReturnValue({
      itemId: 'prompt-1',
      itemType: 'club',
      clubName: 'Bons Desafios',
      badge: 'Verdade',
      quote: 'Conte uma verdade leve.',
      commentsCount: '0',
      likesCount: '2',
    });

    const { getByText, queryByText } = render(<FeedCommentsScreen />);

    expect(getByText('Recurso ainda não disponível')).toBeTruthy();
    expect(
      getByText(/dependem de um endpoint real de leitura/i),
    ).toBeTruthy();
    expect(queryByText('Comentário falso')).toBeNull();
  });
});
