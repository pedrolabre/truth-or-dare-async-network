import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import PublicProfileScreen from '../app/profile/[id]';
import { getPublicUserProfile } from '../services/api';

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

jest.mock('../services/api', () => ({
  getPublicUserProfile: jest.fn(),
}));

const mockedGetPublicUserProfile = getPublicUserProfile as jest.MockedFunction<
  typeof getPublicUserProfile
>;

describe('PublicProfileScreen privacy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({
      id: 'private-user-1',
    });
  });

  it('renderiza perfil restrito sem CTA, username inventado ou estatisticas', async () => {
    mockedGetPublicUserProfile.mockResolvedValue({
      id: 'private-user-1',
      name: 'Perfil privado',
      username: null,
      bio: null,
      avatarUrl: null,
      level: null,
      levelLabel: 'Perfil privado',
      stats: {
        createdTruthsCount: 0,
        createdDaresCount: 0,
        activePublicClubsCount: 0,
        publishedClubPromptsCount: 0,
      },
      publicClubs: [],
    });

    const { getByText, queryByText } = render(<PublicProfileScreen />);

    await waitFor(() => {
      expect(getByText('Perfil privado')).toBeTruthy();
    });

    expect(
      getByText('Este perfil nao exibe dados publicos para sua conta.'),
    ).toBeTruthy();
    expect(queryByText('@usuario')).toBeNull();
    expect(queryByText('Desafiar')).toBeNull();
    expect(queryByText('Verdades criadas')).toBeNull();
    expect(queryByText('Prompts publicados')).toBeNull();
  });
});
