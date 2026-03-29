import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import SignupScreen from '../app/signup-screen';
import { signup } from '../services/api';

jest.mock('../services/api', () => ({
  signup: jest.fn(),
}));

describe('SignupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve começar com o botão desabilitado', () => {
    const { getByTestId } = render(<SignupScreen />);

    const button = getByTestId('signup-button');

    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('deve habilitar o botão quando os campos estiverem preenchidos e os termos aceitos', () => {
    const { getByPlaceholderText, getByText, getByTestId } = render(<SignupScreen />);

    fireEvent.changeText(getByPlaceholderText('Nome completo'), 'Pedro Roberto');
    fireEvent.changeText(getByPlaceholderText('nome@exemplo.com'), 'labre@test.com');
    fireEvent.changeText(getByPlaceholderText('Senha'), '123456');

    fireEvent.press(getByText(/Eu concordo com os/i));

    const button = getByTestId('signup-button');

    expect(button.props.accessibilityState?.disabled).toBe(false);
  });

  it('deve chamar signup com os dados corretos', async () => {
    (signup as jest.Mock).mockResolvedValue({
      user: {
        id: '1',
        name: 'Pedro Roberto',
        email: 'labre@test.com',
        createdAt: '2026-03-29T00:00:00.000Z',
      },
      token: 'fake-token',
    });

    const { getByPlaceholderText, getByText } = render(<SignupScreen />);

    fireEvent.changeText(getByPlaceholderText('Nome completo'), 'Pedro Roberto');
    fireEvent.changeText(getByPlaceholderText('nome@exemplo.com'), 'labre@test.com');
    fireEvent.changeText(getByPlaceholderText('Senha'), '123456');

    fireEvent.press(getByText(/Eu concordo com os/i));
    fireEvent.press(getByText('COMEÇAR A JOGAR'));

    await waitFor(() => {
      expect(signup).toHaveBeenCalledWith({
        name: 'Pedro Roberto',
        email: 'labre@test.com',
        password: '123456',
      });
    });
  });

  it('deve mostrar alerta quando a API retornar erro', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    (signup as jest.Mock).mockRejectedValue(
      new Error('Já existe uma conta com este e-mail')
    );

    const { getByPlaceholderText, getByText } = render(<SignupScreen />);

    fireEvent.changeText(getByPlaceholderText('Nome completo'), 'Pedro Roberto');
    fireEvent.changeText(getByPlaceholderText('nome@exemplo.com'), 'labre@test.com');
    fireEvent.changeText(getByPlaceholderText('Senha'), '123456');

    fireEvent.press(getByText(/Eu concordo com os/i));
    fireEvent.press(getByText('COMEÇAR A JOGAR'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Erro no cadastro',
        'Já existe uma conta com este e-mail'
      );
    });

    alertSpy.mockRestore();
  });
});