import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import SettingsChangeEmailModal from '../components/settings/SettingsChangeEmailModal';

jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

describe('SettingsChangeEmailModal', () => {
  it('exibe campo de confirmacao e aviso de confirmacao por e-mail', () => {
    const { getByPlaceholderText, getByTestId } = render(
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
      />,
    );

    expect(getByPlaceholderText('Novo e-mail')).toBeTruthy();
    expect(getByPlaceholderText('Confirme o novo e-mail')).toBeTruthy();
    expect(getByPlaceholderText('Confirme sua senha')).toBeTruthy();
    expect(getByTestId('settings-change-email-confirmation-info')).toBeTruthy();
  });

  it('exibe mensagens de validacao por campo', () => {
    const { getByTestId, getByText } = render(
      <SettingsChangeEmailModal
        visible
        email="email-invalido"
        confirmEmail="outro@test.com"
        password=""
        onChangeEmail={jest.fn()}
        onChangeConfirmEmail={jest.fn()}
        onChangePassword={jest.fn()}
        onSubmit={jest.fn()}
        onBack={jest.fn()}
        fieldErrors={{
          newEmail: 'Informe um e-mail valido.',
          confirmEmail: 'Os e-mails precisam ser iguais.',
          currentPassword: 'Informe sua senha atual.',
        }}
      />,
    );

    expect(getByTestId('settings-change-email-new-email-error')).toBeTruthy();
    expect(getByTestId('settings-change-email-confirm-email-error')).toBeTruthy();
    expect(getByTestId('settings-change-email-password-error')).toBeTruthy();
    expect(getByText('Informe um e-mail valido.')).toBeTruthy();
    expect(getByText('Os e-mails precisam ser iguais.')).toBeTruthy();
    expect(getByText('Informe sua senha atual.')).toBeTruthy();
  });

  it('desabilita envio e exibe loading durante submissao', () => {
    const onSubmit = jest.fn();
    const { getByTestId, getByText } = render(
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
        isSubmitting
      />,
    );

    expect(getByTestId('settings-change-email-loading')).toBeTruthy();

    fireEvent.press(getByText('VOLTAR'));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('encaminha alteracoes dos campos para os callbacks corretos', () => {
    const onChangeEmail = jest.fn();
    const onChangeConfirmEmail = jest.fn();
    const onChangePassword = jest.fn();
    const { getByTestId } = render(
      <SettingsChangeEmailModal
        visible
        email=""
        confirmEmail=""
        password=""
        onChangeEmail={onChangeEmail}
        onChangeConfirmEmail={onChangeConfirmEmail}
        onChangePassword={onChangePassword}
        onSubmit={jest.fn()}
        onBack={jest.fn()}
      />,
    );

    fireEvent.changeText(
      getByTestId('settings-change-email-new-email-input'),
      'novo@test.com',
    );
    fireEvent.changeText(
      getByTestId('settings-change-email-confirm-email-input'),
      'novo@test.com',
    );
    fireEvent.changeText(
      getByTestId('settings-change-email-password-input'),
      'senha-atual',
    );

    expect(onChangeEmail).toHaveBeenCalledWith('novo@test.com');
    expect(onChangeConfirmEmail).toHaveBeenCalledWith('novo@test.com');
    expect(onChangePassword).toHaveBeenCalledWith('senha-atual');
  });

  it('exibe erro de API sem esconder o formulario', () => {
    const { getByPlaceholderText, getByTestId, getByText } = render(
      <SettingsChangeEmailModal
        visible
        email="duplicado@test.com"
        confirmEmail="duplicado@test.com"
        password="senha-atual"
        onChangeEmail={jest.fn()}
        onChangeConfirmEmail={jest.fn()}
        onChangePassword={jest.fn()}
        onSubmit={jest.fn()}
        onBack={jest.fn()}
        errorMessage="E-mail ja esta em uso"
      />,
    );

    expect(getByTestId('settings-change-email-error')).toBeTruthy();
    expect(getByText('E-mail ja esta em uso')).toBeTruthy();
    expect(getByPlaceholderText('Novo e-mail')).toBeTruthy();
    expect(getByPlaceholderText('Confirme o novo e-mail')).toBeTruthy();
  });
});
