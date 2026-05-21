import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ClubDetailScreen from '../app/clubs/[id]';
import { useClubDetailsScreen } from '../hooks/useClubDetailsScreen';
import type { ClubDetail } from '../types/clubs';

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

const mockedUseClubDetailsScreen = useClubDetailsScreen as jest.MockedFunction<
  typeof useClubDetailsScreen
>;

function makeClubDetail(overrides: Partial<ClubDetail> = {}): ClubDetail {
  return {
    id: 'club-real-123',
    slug: 'bons-desafios',
    name: 'Bons Desafios',
    description: 'Um clube para desafios leves.',
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
    handleRefresh: jest.fn().mockResolvedValue(undefined),
    handleRetry: jest.fn().mockResolvedValue(undefined),
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
  });

  it('recebe o id real da rota e renderiza o detalhe carregado', () => {
    const { getAllByText, getByTestId, getByText } = render(
      <ClubDetailScreen />,
    );

    expect(mockedUseClubDetailsScreen).toHaveBeenCalledWith({
      clubId: 'club-real-123',
    });
    expect(getAllByText('Bons Desafios')).toHaveLength(2);
    expect(getByTestId('club-detail-id').props.children).toEqual([
      'ID: ',
      'club-real-123',
    ]);
    expect(getByTestId('club-detail-summary-card')).toBeTruthy();
  });

  it('mantem navegacao de volta em sucesso', () => {
    const { getByLabelText } = render(<ClubDetailScreen />);

    fireEvent.press(getByLabelText('Voltar'));

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
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
