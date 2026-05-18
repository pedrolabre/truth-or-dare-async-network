import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ClubDetailShellScreen from '../app/clubs/[id]';

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

describe('ClubDetailShellScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({
      id: 'club-real-123',
    });
  });

  it('recebe e renderiza o id da rota de detalhe', () => {
    const { getByTestId, getByText } = render(<ClubDetailShellScreen />);

    expect(getByText('Detalhe do clube')).toBeTruthy();
    expect(getByTestId('club-detail-id').props.children).toBe(
      'ID: club-real-123',
    );
  });

  it('mantem navegacao de volta no shell', () => {
    const { getByLabelText } = render(<ClubDetailShellScreen />);

    fireEvent.press(getByLabelText('Voltar'));

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });
});
