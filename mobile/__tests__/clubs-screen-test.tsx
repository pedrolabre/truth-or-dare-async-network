import React from 'react';
import { render } from '@testing-library/react-native';

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

describe('ClubsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza skeleton no carregamento inicial', () => {
    mockedUseClubsScreen.mockReturnValue({
      activeTab: 'my-clubs',
      activeContentState: 'loading',
      discoverClubs: [],
      discoverContentState: 'empty',
      errorMessage: null,
      filteredDiscoverClubs: [],
      handleChangeTab: jest.fn(),
      hasSearchQuery: false,
      isDiscoverEmpty: true,
      isInitialLoading: true,
      isLoading: true,
      isMyClubsEmpty: false,
      myClubs: [],
      myClubsContentState: 'loading',
      query: '',
      searchResults: [],
      setQuery: jest.fn(),
      visibleDiscoverClubs: [],
    });

    const { getByTestId, getAllByTestId, queryByText } = render(
      <ClubsScreen />,
    );

    expect(getByTestId('clubs-skeleton-list')).toBeTruthy();
    expect(getAllByTestId('clubs-skeleton-card')).toHaveLength(3);
    expect(queryByText('Você ainda não participa de clubes')).toBeNull();
  });
});
