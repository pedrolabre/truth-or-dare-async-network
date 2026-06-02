import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import SettingsAboutModal from '../components/settings/SettingsAboutModal';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    MaterialIcons: ({ name }: { name: string }) =>
      React.createElement(Text, null, name),
  };
});

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      version: '1.2.3',
    },
    manifest: null,
  },
}));

jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

describe('SettingsAboutModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exibe versoes reais, status da API e remove texto generico de desenvolvimento', () => {
    const { getByText, queryByText } = render(
      <SettingsAboutModal
        visible
        onClose={jest.fn()}
        appInfo={{
          apiVersion: '2.0.0',
          environment: 'test',
          status: 'ok',
        }}
      />,
    );

    expect(getByText('Versao do app: 1.2.3')).toBeTruthy();
    expect(getByText('Versao da API: 2.0.0')).toBeTruthy();
    expect(getByText('Status da API: ok')).toBeTruthy();
    expect(getByText('Ambiente da API: test')).toBeTruthy();
    expect(queryByText(/desenvolvimento/i)).toBeNull();
  });

  it('exibe fallback quando informacoes da API nao carregam', () => {
    const { getByText, getByTestId } = render(
      <SettingsAboutModal
        visible
        onClose={jest.fn()}
        appInfo={null}
        appInfoError="Falha ao carregar API"
      />,
    );

    expect(getByText('Versao da API: indisponivel')).toBeTruthy();
    expect(getByText('Status da API: indisponivel')).toBeTruthy();
    expect(getByTestId('settings-about-api-error')).toBeTruthy();
  });

  it('abre Termos de Uso e Politica de Privacidade no browser nativo', () => {
    const openURLSpy = jest
      .spyOn(Linking, 'openURL')
      .mockResolvedValue(undefined);

    const { getByText } = render(
      <SettingsAboutModal visible onClose={jest.fn()} />,
    );

    fireEvent.press(getByText('Termos de Uso'));
    fireEvent.press(getByText('Politica de Privacidade'));

    expect(openURLSpy).toHaveBeenNthCalledWith(
      1,
      'https://truthordare.app/termos-de-uso',
    );
    expect(openURLSpy).toHaveBeenNthCalledWith(
      2,
      'https://truthordare.app/politica-de-privacidade',
    );

    openURLSpy.mockRestore();
  });
});
