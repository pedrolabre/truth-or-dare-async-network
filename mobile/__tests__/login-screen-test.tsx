import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import LoginScreen from '../app/login';
import { login } from '../services/api';

jest.mock('../services/api', () => ({
  login: jest.fn(),
}));

// helper pra encontrar o botão real
function getButtonByText(tree: any, text: string) {
  const nodes = tree.getAllByText(text);

  for (const node of nodes) {
    let current = node.parent;

    while (current) {
      if (current.props?.accessibilityState) {
        return current;
      }
      current = current.parent;
    }
  }

  throw new Error('Botão não encontrado');
}

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve começar com o botão desabilitado', () => {
    const tree = render(<LoginScreen />);

    const button = getButtonByText(tree, 'ENTRAR');

    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('deve habilitar o botão quando os campos estiverem preenchidos', () => {
    const tree = render(<LoginScreen />);

    fireEvent.changeText(tree.getByPlaceholderText('E-mail'), 'teste@mail.com');
    fireEvent.changeText(tree.getByPlaceholderText('Senha'), '123456');

    const button = getButtonByText(tree, 'ENTRAR');

    expect(button.props.accessibilityState.disabled).toBe(false);
  });

  it('deve chamar login com os dados corretos', async () => {
    (login as jest.Mock).mockResolvedValue({
      user: {
        id: '1',
        name: 'Pedro',
        email: 'teste@mail.com',
        createdAt: '2026-03-29T00:00:00.000Z',
      },
      token: 'fake-token',
    });

    const tree = render(<LoginScreen />);

    fireEvent.changeText(tree.getByPlaceholderText('E-mail'), 'teste@mail.com');
    fireEvent.changeText(tree.getByPlaceholderText('Senha'), '123456');

    fireEvent.press(tree.getByText('ENTRAR'));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'teste@mail.com',
        password: '123456',
      });
    });
  });

  it('deve mostrar alerta quando a API retornar erro', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    (login as jest.Mock).mockRejectedValue(
      new Error('E-mail ou senha inválidos')
    );

    const tree = render(<LoginScreen />);

    fireEvent.changeText(tree.getByPlaceholderText('E-mail'), 'teste@mail.com');
    fireEvent.changeText(tree.getByPlaceholderText('Senha'), '123456');

    fireEvent.press(tree.getByText('ENTRAR'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Erro no login',
        'E-mail ou senha inválidos'
      );
    });

    alertSpy.mockRestore();
  });
});