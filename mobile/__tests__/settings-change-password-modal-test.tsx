import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import SettingsChangePasswordModal from '../components/settings/SettingsChangePasswordModal';

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

describe('SettingsChangePasswordModal', () => {
  it('exibe confirmacao de senha e indicador de forca', () => {
    const screen = render(
      <SettingsChangePasswordModal
        visible
        currentPassword=""
        newPassword="curta"
        confirmNewPassword=""
        onChangeCurrentPassword={jest.fn()}
        onChangeNewPassword={jest.fn()}
        onChangeConfirmNewPassword={jest.fn()}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByPlaceholderText('Senha Atual')).toBeTruthy();
    expect(screen.getByPlaceholderText('Nova Senha')).toBeTruthy();
    expect(screen.getByPlaceholderText('Confirme a nova senha')).toBeTruthy();
    expect(screen.getByTestId('settings-change-password-strength')).toBeTruthy();
    expect(screen.getByText('FRACA')).toBeTruthy();

    screen.rerender(
      <SettingsChangePasswordModal
        visible
        currentPassword=""
        newPassword="senha123"
        confirmNewPassword=""
        onChangeCurrentPassword={jest.fn()}
        onChangeNewPassword={jest.fn()}
        onChangeConfirmNewPassword={jest.fn()}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.getByText('MEDIA')).toBeTruthy();

    screen.rerender(
      <SettingsChangePasswordModal
        visible
        currentPassword=""
        newPassword="SenhaNova123!"
        confirmNewPassword=""
        onChangeCurrentPassword={jest.fn()}
        onChangeNewPassword={jest.fn()}
        onChangeConfirmNewPassword={jest.fn()}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.getByText('FORTE')).toBeTruthy();
  });

  it('exibe mensagens de validacao por campo', () => {
    const { getByTestId, getByText } = render(
      <SettingsChangePasswordModal
        visible
        currentPassword=""
        newPassword="curta"
        confirmNewPassword="diferente"
        onChangeCurrentPassword={jest.fn()}
        onChangeNewPassword={jest.fn()}
        onChangeConfirmNewPassword={jest.fn()}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        fieldErrors={{
          currentPassword: 'Informe sua senha atual.',
          newPassword: 'A nova senha precisa ter pelo menos 8 caracteres.',
          confirmNewPassword: 'As senhas precisam ser iguais.',
        }}
      />,
    );

    expect(getByTestId('settings-change-password-current-error')).toBeTruthy();
    expect(getByTestId('settings-change-password-new-error')).toBeTruthy();
    expect(getByTestId('settings-change-password-confirm-error')).toBeTruthy();
    expect(getByText('Informe sua senha atual.')).toBeTruthy();
    expect(
      getByText('A nova senha precisa ter pelo menos 8 caracteres.'),
    ).toBeTruthy();
    expect(getByText('As senhas precisam ser iguais.')).toBeTruthy();
  });

  it('desabilita envio e exibe loading durante submissao', () => {
    const onSubmit = jest.fn();
    const { getByTestId, getByText } = render(
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
        isSubmitting
      />,
    );

    expect(getByTestId('settings-change-password-loading')).toBeTruthy();

    fireEvent.press(getByText('CANCELAR'));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('encaminha alteracoes dos campos para os callbacks corretos', () => {
    const onChangeCurrentPassword = jest.fn();
    const onChangeNewPassword = jest.fn();
    const onChangeConfirmNewPassword = jest.fn();
    const { getByTestId } = render(
      <SettingsChangePasswordModal
        visible
        currentPassword=""
        newPassword=""
        confirmNewPassword=""
        onChangeCurrentPassword={onChangeCurrentPassword}
        onChangeNewPassword={onChangeNewPassword}
        onChangeConfirmNewPassword={onChangeConfirmNewPassword}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    fireEvent.changeText(
      getByTestId('settings-change-password-current-input'),
      'senha-atual',
    );
    fireEvent.changeText(
      getByTestId('settings-change-password-new-input'),
      'senha-nova1',
    );
    fireEvent.changeText(
      getByTestId('settings-change-password-confirm-input'),
      'senha-nova1',
    );

    expect(onChangeCurrentPassword).toHaveBeenCalledWith('senha-atual');
    expect(onChangeNewPassword).toHaveBeenCalledWith('senha-nova1');
    expect(onChangeConfirmNewPassword).toHaveBeenCalledWith('senha-nova1');
  });

  it('alterna visibilidade dos campos de senha sem perder valores', () => {
    const { getAllByDisplayValue, getByDisplayValue, getByTestId } = render(
      <SettingsChangePasswordModal
        visible
        currentPassword="senha-atual"
        newPassword="senha-nova1"
        confirmNewPassword="senha-nova1"
        onChangeCurrentPassword={jest.fn()}
        onChangeNewPassword={jest.fn()}
        onChangeConfirmNewPassword={jest.fn()}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(
      getByTestId('settings-change-password-current-input').props
        .secureTextEntry,
    ).toBe(true);
    expect(
      getByTestId('settings-change-password-new-input').props.secureTextEntry,
    ).toBe(true);
    expect(
      getByTestId('settings-change-password-confirm-input').props
        .secureTextEntry,
    ).toBe(true);

    fireEvent.press(
      getByTestId('settings-change-password-current-input-visibility-toggle'),
    );
    fireEvent.press(
      getByTestId('settings-change-password-new-input-visibility-toggle'),
    );
    fireEvent.press(
      getByTestId('settings-change-password-confirm-input-visibility-toggle'),
    );

    expect(
      getByTestId('settings-change-password-current-input').props
        .secureTextEntry,
    ).toBe(false);
    expect(
      getByTestId('settings-change-password-new-input').props.secureTextEntry,
    ).toBe(false);
    expect(
      getByTestId('settings-change-password-confirm-input').props
        .secureTextEntry,
    ).toBe(false);
    expect(getByDisplayValue('senha-atual')).toBeTruthy();
    expect(getAllByDisplayValue('senha-nova1')).toHaveLength(2);
  });

  it('exibe erro de API sem esconder o formulario', () => {
    const { getByPlaceholderText, getByTestId, getByText } = render(
      <SettingsChangePasswordModal
        visible
        currentPassword="senha-atual"
        newPassword="senha-nova1"
        confirmNewPassword="senha-nova1"
        onChangeCurrentPassword={jest.fn()}
        onChangeNewPassword={jest.fn()}
        onChangeConfirmNewPassword={jest.fn()}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        errorMessage="Senha atual incorreta"
      />,
    );

    expect(getByTestId('settings-change-password-error')).toBeTruthy();
    expect(getByText('Senha atual incorreta')).toBeTruthy();
    expect(getByPlaceholderText('Senha Atual')).toBeTruthy();
    expect(getByPlaceholderText('Confirme a nova senha')).toBeTruthy();
  });
});
