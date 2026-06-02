import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import SettingsDeleteAccountModal from '../components/settings/SettingsDeleteAccountModal';

jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

function renderModal(overrides = {}) {
  const props = {
    visible: true,
    step: 1 as const,
    currentPassword: '',
    onChangeCurrentPassword: jest.fn(),
    onContinue: jest.fn(),
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    ...overrides,
  };

  return {
    props,
    screen: render(<SettingsDeleteAccountModal {...props} />),
  };
}

describe('SettingsDeleteAccountModal', () => {
  it('exibe confirmacao de intencao no primeiro passo', () => {
    const { screen } = renderModal();

    expect(screen.getByText('EXCLUIR CONTA')).toBeTruthy();
    expect(screen.getByText('CONTINUAR')).toBeTruthy();

    fireEvent.press(screen.getByText('CONTINUAR'));
  });

  it('chama onContinue ao confirmar o primeiro passo', () => {
    const { props, screen } = renderModal();

    fireEvent.press(screen.getByText('CONTINUAR'));

    expect(props.onContinue).toHaveBeenCalledTimes(1);
  });

  it('exibe senha atual e envia no segundo passo', () => {
    const { props, screen } = renderModal({
      step: 2,
      currentPassword: 'senha-atual',
    });

    expect(
      screen.getByTestId('settings-delete-account-password-input').props.value,
    ).toBe('senha-atual');

    fireEvent.changeText(
      screen.getByTestId('settings-delete-account-password-input'),
      'senha-corrigida',
    );
    fireEvent.press(screen.getByText('EXCLUIR DEFINITIVAMENTE'));

    expect(props.onChangeCurrentPassword).toHaveBeenCalledWith(
      'senha-corrigida',
    );
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('exibe erros preservando o campo de senha', () => {
    const { screen } = renderModal({
      step: 2,
      currentPassword: 'senha-atual',
      fieldErrors: {
        currentPassword: 'Informe sua senha atual.',
      },
      errorMessage: 'Senha atual incorreta',
    });

    expect(screen.getByTestId('settings-delete-account-password-error')).toBeTruthy();
    expect(screen.getByTestId('settings-delete-account-error')).toBeTruthy();
    expect(
      screen.getByTestId('settings-delete-account-password-input').props.value,
    ).toBe('senha-atual');
  });

  it('desabilita envio e exibe loading durante submissao', () => {
    const { screen } = renderModal({
      step: 2,
      isSubmitting: true,
    });

    expect(screen.getByTestId('settings-delete-account-loading')).toBeTruthy();
  });
});
