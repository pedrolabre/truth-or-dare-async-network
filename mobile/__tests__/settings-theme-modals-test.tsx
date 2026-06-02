import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

import SettingsAboutModal from '../components/settings/SettingsAboutModal';
import SettingsChangeEmailModal from '../components/settings/SettingsChangeEmailModal';
import SettingsChangePasswordModal from '../components/settings/SettingsChangePasswordModal';
import SettingsEmailSuccessModal from '../components/settings/SettingsEmailSuccessModal';
import SettingsHelpModal from '../components/settings/SettingsHelpModal';
import SettingsLogoutModal from '../components/settings/SettingsLogoutModal';
import SettingsPasswordSuccessModal from '../components/settings/SettingsPasswordSuccessModal';
import SettingsPrivacyModal from '../components/settings/SettingsPrivacyModal';
import SettingsPrivateAccountConfirmModal from '../components/settings/SettingsPrivateAccountConfirmModal';
import SettingsPrivateAccountModal from '../components/settings/SettingsPrivateAccountModal';

let mockIsDark = false;
const mockToggleManualTheme = jest.fn();

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    MaterialIcons: ({ name }: { name: string }) =>
      React.createElement(Text, null, name),
  };
});

jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: mockIsDark,
    useSystemTheme: false,
    setUseSystemTheme: jest.fn(),
    toggleManualTheme: mockToggleManualTheme,
  }),
}));

const noop = jest.fn();

type FlattenedStyle = {
  backgroundColor?: string;
  color?: string;
};

function getFlattenedStyle(node: { props: { style: unknown } }) {
  return StyleSheet.flatten(node.props.style) as FlattenedStyle;
}

describe('Settings theme modals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDark = false;
  });

  it('sincroniza o shell e um modal aberto quando o tema manual muda', () => {
    const screen = render(
      <SettingsChangeEmailModal
        visible
        email=""
        password=""
        onChangeEmail={noop}
        onChangePassword={noop}
        onSubmit={noop}
        onBack={noop}
      />,
    );

    expect(
      getFlattenedStyle(screen.getByTestId('settings-modal-card'))
        .backgroundColor,
    ).toBe('#ffffff');
    expect(getFlattenedStyle(screen.getByText('NOVO E-MAIL')).color).toBe(
      '#171d1a',
    );

    mockIsDark = true;
    screen.rerender(
      <SettingsChangeEmailModal
        visible
        email=""
        password=""
        onChangeEmail={noop}
        onChangePassword={noop}
        onSubmit={noop}
        onBack={noop}
      />,
    );

    expect(
      getFlattenedStyle(screen.getByTestId('settings-modal-card'))
        .backgroundColor,
    ).toBe('#1c1f1d');
    expect(getFlattenedStyle(screen.getByText('NOVO E-MAIL')).color).toBe(
      '#f5fbf6',
    );
  });

  it('renderiza todos os modais de configuracoes com tema claro e escuro via contexto', () => {
    const modalCases = [
      {
        title: 'TRUTH OR DARE',
        render: () => <SettingsAboutModal visible onClose={noop} />,
      },
      {
        title: 'NOVO E-MAIL',
        render: () => (
          <SettingsChangeEmailModal
            visible
            email=""
            password=""
            onChangeEmail={noop}
            onChangePassword={noop}
            onSubmit={noop}
            onBack={noop}
          />
        ),
      },
      {
        title: 'NOVA SENHA',
        render: () => (
          <SettingsChangePasswordModal
            visible
            currentPassword=""
            newPassword=""
            onChangeCurrentPassword={noop}
            onChangeNewPassword={noop}
            onSubmit={noop}
            onCancel={noop}
          />
        ),
      },
      {
        title: 'E-MAIL ATUALIZADO!',
        render: () => <SettingsEmailSuccessModal visible onClose={noop} />,
      },
      {
        title: 'SUPORTE',
        render: () => (
          <SettingsHelpModal
            visible
            onClose={noop}
            onPressReportAbuse={noop}
            onPressContactDevs={noop}
          />
        ),
      },
      {
        title: 'Deseja sair?',
        render: () => (
          <SettingsLogoutModal
            visible
            onConfirm={noop}
            onCancel={noop}
          />
        ),
      },
      {
        title: 'SENHA ALTERADA!',
        render: () => <SettingsPasswordSuccessModal visible onClose={noop} />,
      },
      {
        title: 'PRIVACIDADE',
        render: () => (
          <SettingsPrivacyModal
            visible
            currentEmail="real@test.com"
            onClose={noop}
            onPressChangeEmail={noop}
          />
        ),
      },
      {
        title: 'TORNAR CONTA PRIVADA?',
        render: () => (
          <SettingsPrivateAccountConfirmModal
            visible
            willBePrivate
            onConfirm={noop}
            onCancel={noop}
          />
        ),
      },
      {
        title: 'TORNAR CONTA PRIVADA?',
        render: () => (
          <SettingsPrivateAccountModal
            visible
            onConfirm={noop}
            onCancel={noop}
          />
        ),
      },
    ];

    modalCases.forEach((modalCase) => {
      mockIsDark = false;
      const screen = render(modalCase.render());

      expect(getFlattenedStyle(screen.getByText(modalCase.title)).color).toBe(
        '#171d1a',
      );

      mockIsDark = true;
      screen.rerender(modalCase.render());

      expect(getFlattenedStyle(screen.getByText(modalCase.title)).color).toBe(
        '#f5fbf6',
      );
      screen.unmount();
    });
  });
});
