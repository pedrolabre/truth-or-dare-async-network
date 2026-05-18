import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ClubsScreen from '../app/clubs';
import { useClubsScreen } from '../hooks/useClubsScreen';

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
    push: jest.fn(),
    replace: jest.fn(),
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

const mockedUseClubsScreen = useClubsScreen as jest.MockedFunction<
  typeof useClubsScreen
>;

const baseHookState: ReturnType<typeof useClubsScreen> = {
  activeTab: 'my-clubs',
  activeContentState: 'empty',
  discoverClubs: [],
  discoverContentState: 'empty',
  errorMessage: null,
  filteredDiscoverClubs: [],
  handleChangeTab: jest.fn(),
  handleRefresh: jest.fn(),
  handleRetry: jest.fn(),
  hasSearchQuery: false,
  isDiscoverEmpty: true,
  isInitialLoading: false,
  isLoading: false,
  isMyClubsEmpty: true,
  isRefreshing: false,
  isSearchLoading: false,
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
      membersLabel: '5 membros',
      badgeLabel: 'Popular',
      iconName: 'explore',
      isTrending: true,
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

    const { getByText, queryByText } = render(<ClubsScreen />);

    expect(getByText('Clube Público Real')).toBeTruthy();
    expect(getByText('Desafios rápidos para jogar em grupo.')).toBeTruthy();
    expect(getByText('5 membros')).toBeTruthy();
    expect(getByText('Popular')).toBeTruthy();
    expect(getByText('Explorar')).toBeTruthy();
    expect(queryByText('Abrir clube')).toBeNull();
  });

  it('renderiza resultados de busca remota na aba Descobrir', () => {
    const searchItem = {
      id: 'club-search-1',
      name: 'Clube Encontrado',
      description: 'Resultado vindo da API de busca.',
      membersLabel: '9 membros',
      badgeLabel: 'Busca',
      iconName: 'search',
      isTrending: false,
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
