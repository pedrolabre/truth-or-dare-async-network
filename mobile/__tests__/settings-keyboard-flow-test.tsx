import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import SettingsChangeEmailModal from '../components/settings/SettingsChangeEmailModal';
import SettingsChangePasswordModal from '../components/settings/SettingsChangePasswordModal';
import SettingsDeleteAccountModal from '../components/settings/SettingsDeleteAccountModal';

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

describe('Settings keyboard flow', () => {
  it('configura Proximo e Confirmar no formulario de e-mail', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <SettingsChangeEmailModal
        visible
        email="novo@test.com"
        confirmEmail="novo@test.com"
        password="senha-atual"
        onChangeEmail={jest.fn()}
        onChangeConfirmEmail={jest.fn()}
        onChangePassword={jest.fn()}
        onSubmit={onSubmit}
        onBack={jest.fn()}
      />,
    );
    const newEmail = getByTestId('settings-change-email-new-email-input');
    const confirmEmail = getByTestId(
      'settings-change-email-confirm-email-input',
    );
    const password = getByTestId('settings-change-email-password-input');

    expect(newEmail.props.returnKeyType).toBe('next');
    expect(confirmEmail.props.returnKeyType).toBe('next');
    expect(password.props.returnKeyType).toBe('done');

    fireEvent(password, 'submitEditing');

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('configura Proximo e Confirmar no formulario de senha', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <SettingsChangePasswordModal
        visible
        currentPassword="senha-atual"
        newPassword="senha-nova1"
        confirmNewPassword="senha-nova1"
        onChangeCurrentPassword={jest.fn()}
        onChangeNewPassword={jest.fn()}
        onChangeConfirmNewPassword={jest.fn()}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />,
    );
    const currentPassword = getByTestId(
      'settings-change-password-current-input',
    );
    const newPassword = getByTestId('settings-change-password-new-input');
    const confirmPassword = getByTestId(
      'settings-change-password-confirm-input',
    );

    expect(currentPassword.props.returnKeyType).toBe('next');
    expect(newPassword.props.returnKeyType).toBe('next');
    expect(confirmPassword.props.returnKeyType).toBe('done');

    fireEvent(confirmPassword, 'submitEditing');

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('submete exclusao de conta pelo Confirmar do teclado', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <SettingsDeleteAccountModal
        visible
        step={2}
        currentPassword="senha-atual"
        onChangeCurrentPassword={jest.fn()}
        onContinue={jest.fn()}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />,
    );
    const password = getByTestId('settings-delete-account-password-input');

    expect(password.props.returnKeyType).toBe('done');

    fireEvent(password, 'submitEditing');

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
