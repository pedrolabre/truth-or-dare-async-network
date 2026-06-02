import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import SettingsReportAbuseModal from '../components/settings/SettingsReportAbuseModal';

jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

function renderModal(overrides = {}) {
  const props = {
    visible: true,
    category: 'spam' as const,
    description: '',
    onChangeCategory: jest.fn(),
    onChangeDescription: jest.fn(),
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    ...overrides,
  };

  return {
    props,
    screen: render(<SettingsReportAbuseModal {...props} />),
  };
}

describe('SettingsReportAbuseModal', () => {
  it('exibe categorias e campo de descricao', () => {
    const { screen } = renderModal({
      description: 'Descricao inicial',
    });

    expect(screen.getByText('DENUNCIAR ABUSO')).toBeTruthy();
    expect(screen.getByText('Spam')).toBeTruthy();
    expect(screen.getByText('Odio')).toBeTruthy();
    expect(screen.getByText('Violencia')).toBeTruthy();
    expect(screen.getByText('Nudez')).toBeTruthy();
    expect(screen.getByText('Outro')).toBeTruthy();
    expect(
      screen.getByTestId('settings-report-abuse-description-input').props.value,
    ).toBe('Descricao inicial');
  });

  it('encaminha alteracao de categoria e descricao', () => {
    const { props, screen } = renderModal();

    fireEvent.press(screen.getByTestId('settings-report-abuse-category-hate'));
    fireEvent.changeText(
      screen.getByTestId('settings-report-abuse-description-input'),
      'Mensagem ofensiva enviada no feed.',
    );

    expect(props.onChangeCategory).toHaveBeenCalledWith('hate');
    expect(props.onChangeDescription).toHaveBeenCalledWith(
      'Mensagem ofensiva enviada no feed.',
    );
  });

  it('exibe erros por campo e erro de API preservando formulario', () => {
    const { screen } = renderModal({
      description: 'curta',
      fieldErrors: {
        description: 'Descreva com pelo menos 10 caracteres.',
      },
      errorMessage: 'Nao foi possivel enviar a denuncia.',
    });

    expect(screen.getByTestId('settings-report-abuse-description-error')).toBeTruthy();
    expect(screen.getByTestId('settings-report-abuse-error')).toBeTruthy();
    expect(
      screen.getByTestId('settings-report-abuse-description-input').props.value,
    ).toBe('curta');
  });

  it('exibe confirmacao apos envio bem-sucedido', () => {
    const { screen } = renderModal({
      successMessage: 'Denuncia enviada.',
    });

    expect(screen.getByTestId('settings-report-abuse-success')).toBeTruthy();
  });

  it('desabilita envio e exibe loading durante submissao', () => {
    const { screen } = renderModal({
      isSubmitting: true,
    });

    expect(screen.getByTestId('settings-report-abuse-loading')).toBeTruthy();
  });
});
