import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ClubsScreen from '../app/clubs';
import { useClubsScreen } from '../hooks/useClubsScreen';

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    MaterialIcons: ({ name }: { name: string }) =>
      React.createElement(Text, null, name),
  };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({
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

jest.mock('../hooks/useClubsScreen', () => ({
  useClubsScreen: jest.fn(),
}));

jest.mock('../hooks/useNotificationsUnreadCount', () => ({
  useNotificationsUnreadCount: jest.fn(() => ({
    unreadCount: 0,
    isLoading: false,
    errorMessage: null,
    loadUnreadCount: jest.fn(),
  })),
}));

const mockedUseClubsScreen = useClubsScreen as jest.MockedFunction<
  typeof useClubsScreen
>;

const DEFAULT_VIEWER_ACTIVITY = {
  unreadCount: 0,
  lastSeenAt: null,
  mutedUntil: null,
  isMuted: false,
};

const baseHookState: ReturnType<typeof useClubsScreen> = {
  activeTab: 'my-clubs',
  activeContentState: 'empty',
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
  isMyClubsEmpty: true,
  isRefreshing: false,
  isSearchLoading: false,
  joiningClubIds: [],
  myClubs: [],
  myClubsContentState: 'empty',
  query: '',
  searchErrorMessage: null,
  searchResults: [],
  setQuery: jest.fn(),
  visibleDiscoverClubs: [],
};

describe('ClubsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza skeleton no carregamento inicial', () => {
    mockedUseClubsScreen.mockReturnValue({
      ...baseHookState,
      activeContentState: 'loading',
      isInitialLoading: true,
      isLoading: true,
      myClubsContentState: 'loading',
      isMyClubsEmpty: false,
    });

    const { getByTestId, getAllByTestId, queryByText } = render(
      <ClubsScreen />,
    );

    expect(getByTestId('clubs-skeleton-list')).toBeTruthy();
    expect(getAllByTestId('clubs-skeleton-card')).toHaveLength(3);
    expect(queryByText('Você ainda não participa de clubes')).toBeNull();
  });

  it('renderiza ClubDiscoverCard com dados reais da aba Descobrir', () => {
    const discoverItem = {
      id: 'club-discover-1',
      name: 'Clube Público Real',
      description: 'Desafios rápidos para jogar em grupo.',
      memberCount: 5,
      membersLabel: '5 membros',
      badgeLabel: 'Popular',
      iconName: 'explore',
      isTrending: true,
      isMember: false,
      membershipStatus: null,
    };
    const handleJoinClub = jest.fn();

    mockedUseClubsScreen.mockReturnValue({
      ...baseHookState,
      activeTab: 'discover',
      activeContentState: 'list',
      discoverClubs: [discoverItem],
      discoverContentState: 'list',
      filteredDiscoverClubs: [discoverItem],
      handleJoinClub,
      isDiscoverEmpty: false,
      visibleDiscoverClubs: [discoverItem],
    });

    const { getByText, queryByText } = render(<ClubsScreen />);

    expect(getByText('Clube Público Real')).toBeTruthy();
    expect(getByText('Desafios rápidos para jogar em grupo.')).toBeTruthy();
    expect(getByText('5 membros')).toBeTruthy();
    expect(getByText('Popular')).toBeTruthy();
    fireEvent.press(getByText('Entrar'));
    expect(handleJoinClub).toHaveBeenCalledWith(discoverItem);
    expect(queryByText('Abrir clube')).toBeNull();
  });

  it('navega para o detalhe ao pressionar um card de Meus Clubes', () => {
    const myClub = {
      id: 'my-real-club-id',
      name: 'Clube Real do Usuario',
      description: 'Clube vindo da API de Meus Clubes.',
      memberCount: 3,
      membersLabel: '3 membros',
      statusLabel: 'Membro',
      iconName: 'groups',
      isActive: true,
      viewerActivity: DEFAULT_VIEWER_ACTIVITY,
      unreadCount: 0,
      hasUnreadActivity: false,
    };

    mockedUseClubsScreen.mockReturnValue({
      ...baseHookState,
      activeContentState: 'list',
      isMyClubsEmpty: false,
      myClubs: [myClub],
      myClubsContentState: 'list',
    });

    const { getByText } = render(<ClubsScreen />);

    fireEvent.press(getByText('Clube Real do Usuario'));

    expect(mockRouterPush).toHaveBeenCalledWith('/clubs/my-real-club-id');
  });

  it('exibe badge discreto para clube com atividade nova', () => {
    const myClub = {
      id: 'club-with-unread',
      name: 'Clube com Atividade',
      description: 'Clube vindo da API com notificacoes nao lidas.',
      memberCount: 3,
      membersLabel: '3 membros',
      statusLabel: 'Membro',
      iconName: 'groups',
      isActive: true,
      viewerActivity: {
        unreadCount: 4,
        lastSeenAt: '2026-05-23T10:00:00.000Z',
        mutedUntil: null,
        isMuted: false,
      },
      unreadCount: 4,
      hasUnreadActivity: true,
    };

    mockedUseClubsScreen.mockReturnValue({
      ...baseHookState,
      activeContentState: 'list',
      isMyClubsEmpty: false,
      myClubs: [myClub],
      myClubsContentState: 'list',
    });

    const { getByTestId, getByText } = render(<ClubsScreen />);

    expect(getByText('Clube com Atividade')).toBeTruthy();
    expect(getByTestId('club-unread-badge')).toBeTruthy();
    expect(getByText('4')).toBeTruthy();
  });

  it('nao exibe badge quando clube nao tem atividade nova', () => {
    const myClub = {
      id: 'club-without-unread',
      name: 'Clube sem Atividade',
      description: 'Clube vindo da API sem notificacoes novas.',
      memberCount: 3,
      membersLabel: '3 membros',
      statusLabel: 'Membro',
      iconName: 'groups',
      isActive: true,
      viewerActivity: DEFAULT_VIEWER_ACTIVITY,
      unreadCount: 0,
      hasUnreadActivity: false,
    };

    mockedUseClubsScreen.mockReturnValue({
      ...baseHookState,
      activeContentState: 'list',
      isMyClubsEmpty: false,
      myClubs: [myClub],
      myClubsContentState: 'list',
    });

    const { queryByTestId } = render(<ClubsScreen />);

    expect(queryByTestId('club-unread-badge')).toBeNull();
  });

  it('navega para a criacao ao pressionar Criar grupo', () => {
    mockedUseClubsScreen.mockReturnValue(baseHookState);

    const { getByText } = render(<ClubsScreen />);

    fireEvent.press(getByText('Criar grupo'));

    expect(mockRouterPush).toHaveBeenCalledWith('/create-group');
  });

  it('navega para o detalhe ao pressionar um card de Descobrir', () => {
    const discoverItem = {
      id: 'discover-real-club-id',
      name: 'Clube Publico Navegavel',
      description: 'Clube publico vindo da API.',
      memberCount: 8,
      membersLabel: '8 membros',
      badgeLabel: 'Sugestao',
      iconName: 'explore',
      isTrending: false,
      isMember: false,
      membershipStatus: null,
    };

    mockedUseClubsScreen.mockReturnValue({
      ...baseHookState,
      activeTab: 'discover',
      activeContentState: 'list',
      discoverClubs: [discoverItem],
      discoverContentState: 'list',
      filteredDiscoverClubs: [discoverItem],
      isDiscoverEmpty: false,
      visibleDiscoverClubs: [discoverItem],
    });

    const { getByText } = render(<ClubsScreen />);

    fireEvent.press(getByText('Clube Publico Navegavel'));

    expect(mockRouterPush).toHaveBeenCalledWith('/clubs/discover-real-club-id');
  });

  it('pressionar Entrar nao navega e chama a acao de entrada', () => {
    const discoverItem = {
      id: 'join-without-navigation',
      name: 'Clube para Entrar',
      description: 'Clube publico com acao independente.',
      memberCount: 4,
      membersLabel: '4 membros',
      badgeLabel: 'Novo',
      iconName: 'explore',
      isTrending: false,
      isMember: false,
      membershipStatus: null,
    };
    const handleJoinClub = jest.fn();

    mockedUseClubsScreen.mockReturnValue({
      ...baseHookState,
      activeTab: 'discover',
      activeContentState: 'list',
      discoverClubs: [discoverItem],
      discoverContentState: 'list',
      filteredDiscoverClubs: [discoverItem],
      handleJoinClub,
      isDiscoverEmpty: false,
      visibleDiscoverClubs: [discoverItem],
    });

    const { getByTestId } = render(<ClubsScreen />);

    fireEvent.press(getByTestId('club-discover-join-join-without-navigation'));

    expect(handleJoinClub).toHaveBeenCalledWith(discoverItem);
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('renderiza resultados de busca remota na aba Descobrir', () => {
    const searchItem = {
      id: 'club-search-1',
      name: 'Clube Encontrado',
      description: 'Resultado vindo da API de busca.',
      memberCount: 9,
      membersLabel: '9 membros',
      badgeLabel: 'Busca',
      iconName: 'search',
      isTrending: false,
      isMember: false,
      membershipStatus: null,
    };

    mockedUseClubsScreen.mockReturnValue({
      ...baseHookState,
      activeTab: 'discover',
      activeContentState: 'search-results',
      discoverContentState: 'search-results',
      filteredDiscoverClubs: [searchItem],
      hasSearchQuery: true,
      isDiscoverEmpty: false,
      query: 'encontrado',
      searchResults: [searchItem],
      visibleDiscoverClubs: [searchItem],
    });

    const { getByText, queryByText } = render(<ClubsScreen />);

    expect(getByText('Clube Encontrado')).toBeTruthy();
    expect(getByText('Resultado vindo da API de busca.')).toBeTruthy();
    expect(getByText('9 membros')).toBeTruthy();
    expect(getByText('Busca')).toBeTruthy();
    expect(queryByText('Nenhum clube encontrado')).toBeNull();
  });

  it('navega para o detalhe ao pressionar um resultado de busca', () => {
    const searchItem = {
      id: 'search-real-club-id',
      name: 'Clube Encontrado Navegavel',
      description: 'Resultado vindo da API de busca.',
      memberCount: 9,
      membersLabel: '9 membros',
      badgeLabel: 'Busca',
      iconName: 'search',
      isTrending: false,
      isMember: false,
      membershipStatus: null,
    };

    mockedUseClubsScreen.mockReturnValue({
      ...baseHookState,
      activeTab: 'discover',
      activeContentState: 'search-results',
      discoverContentState: 'search-results',
      filteredDiscoverClubs: [searchItem],
      hasSearchQuery: true,
      isDiscoverEmpty: false,
      query: 'encontrado',
      searchResults: [searchItem],
      visibleDiscoverClubs: [searchItem],
    });

    const { getByText } = render(<ClubsScreen />);

    fireEvent.press(getByText('Clube Encontrado Navegavel'));

    expect(mockRouterPush).toHaveBeenCalledWith('/clubs/search-real-club-id');
  });

  it('renderiza retry visivel no estado de erro', () => {
    const handleRetry = jest.fn();

    mockedUseClubsScreen.mockReturnValue({
      ...baseHookState,
      activeContentState: 'error',
      errorMessage: 'Falha de rede',
      handleRetry,
      myClubsContentState: 'error',
    });

    const { getByText } = render(<ClubsScreen />);

    expect(getByText('Falha de rede')).toBeTruthy();

    fireEvent.press(getByText('Tentar novamente'));

    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
