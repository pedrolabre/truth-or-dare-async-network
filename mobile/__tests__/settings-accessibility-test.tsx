import React from 'react';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

import { DARK, LIGHT } from '../app/settings';
import AccountMenuRow from '../components/account/AccountMenuRow';
import SettingsChangeEmailModal from '../components/settings/SettingsChangeEmailModal';
import SettingsModalShell from '../components/settings/SettingsModalShell';
import SettingsPrivateAccountConfirmModal from '../components/settings/SettingsPrivateAccountConfirmModal';
import SettingsSwitchRow from '../components/settings/SettingsSwitchRow';

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
    isDark: false,
  }),
}));

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((value) => parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.03928
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4,
    );

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(first: string, second: string) {
  const [lightest, darkest] = [luminance(first), luminance(second)].sort(
    (left, right) => right - left,
  );

  return (lightest + 0.05) / (darkest + 0.05);
}

describe('Settings accessibility', () => {
  it('anuncia o titulo do modal e usa protecao contra teclado', async () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => undefined);
    const { getByTestId } = render(
      <SettingsModalShell visible title="Novo e-mail" onClose={jest.fn()}>
        <></>
      </SettingsModalShell>,
    );

    await waitFor(() => {
      expect(announceSpy).toHaveBeenCalledWith('Novo e-mail');
    });
    expect(getByTestId('settings-modal-keyboard-avoiding-view')).toBeTruthy();
  });

  it('expoe labels uteis em linha de menu, switch e botao de formulario', () => {
    const menu = render(
      <AccountMenuRow
        icon="info-outline"
        label="Sobre o App"
        backgroundColor="#ffffff"
        textColor="#171d1a"
        subTextColor="#56645e"
        iconColor="#426A4B"
        borderColor="#d7ddd9"
        onPress={jest.fn()}
      />,
    );
    expect(menu.getByLabelText('Sobre o App')).toBeTruthy();

    const toggle = render(
      <SettingsSwitchRow
        icon="dark-mode"
        title="Modo Escuro"
        value={false}
        disabled
        onValueChange={jest.fn()}
        backgroundColor="#eaefea"
        textColor="#171d1a"
        subTextColor="#56645e"
        iconColor="#426A4B"
        borderColor="#d7ddd9"
        trackColor={{ false: '#c4cbc6', true: '#426A4B' }}
        thumbColor="#ffffff"
      />,
    );
    const switchRow = toggle.getAllByLabelText('Modo Escuro')[0];
    expect(switchRow.props.accessibilityState).toEqual({
      checked: false,
      disabled: true,
    });
    expect(StyleSheet.flatten(switchRow.props.style).opacity).toBe(0.52);

    const emailModal = render(
      <SettingsChangeEmailModal
        visible
        email=""
        confirmEmail=""
        password=""
        onChangeEmail={jest.fn()}
        onChangeConfirmEmail={jest.fn()}
        onChangePassword={jest.fn()}
        onSubmit={jest.fn()}
        onBack={jest.fn()}
        isSubmitting
      />,
    );
    const confirmEmailButton = emailModal.getByLabelText(
      'Confirmar mudanca de e-mail',
    );
    expect(confirmEmailButton.props.accessibilityState).toEqual({
      disabled: true,
      busy: true,
    });
    expect(
      StyleSheet.flatten(confirmEmailButton.props.style).opacity,
    ).toBe(0.68);

  });

  it('exibe loading e erro acessiveis na confirmacao de conta privada', () => {
    const { getByTestId, getByText } = render(
      <SettingsPrivateAccountConfirmModal
        visible
        willBePrivate
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        isSubmitting
        errorMessage="Nao foi possivel atualizar a privacidade da conta."
      />,
    );

    expect(getByTestId('settings-private-account-loading')).toBeTruthy();
    expect(
      getByText('Nao foi possivel atualizar a privacidade da conta.'),
    ).toBeTruthy();
  });

  it('mantem contraste WCAG AA nos textos principais dos dois temas', () => {
    expect(contrastRatio(LIGHT.text, LIGHT.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(LIGHT.sub, LIGHT.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(DARK.text, DARK.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(DARK.sub, DARK.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(LIGHT.white, LIGHT.green)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(DARK.white, DARK.green)).toBeGreaterThanOrEqual(4.5);
  });
});
