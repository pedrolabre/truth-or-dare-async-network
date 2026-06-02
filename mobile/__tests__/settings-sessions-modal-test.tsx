import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import SettingsSessionsModal from '../components/settings/SettingsSessionsModal';
import type { UserSession } from '../types/settings';

jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

function makeSession(overrides: Partial<UserSession> = {}): UserSession {
  return {
    id: 'session-1',
    userId: 'user-1',
    deviceName: 'iPhone 15',
    platform: 'ios',
    ipAddress: '203.0.113.10',
    lastActiveAt: '2026-06-02T12:00:00.000Z',
    createdAt: '2026-06-02T12:00:00.000Z',
    revokedAt: null,
    isCurrent: true,
    ...overrides,
  };
}

function renderModal(overrides: Partial<React.ComponentProps<typeof SettingsSessionsModal>> = {}) {
  return render(
    <SettingsSessionsModal
      visible
      sessions={[makeSession()]}
      isLoading={false}
      errorMessage={null}
      successMessage={null}
      revokingSessionId={null}
      isRevokingOtherSessions={false}
      onRefresh={jest.fn()}
      onRevokeSession={jest.fn()}
      onRevokeOtherSessions={jest.fn()}
      onClose={jest.fn()}
      {...overrides}
    />,
  );
}

describe('SettingsSessionsModal', () => {
  it('exibe loading enquanto carrega sessoes', () => {
    const { getByTestId, getByText } = renderModal({
      isLoading: true,
      sessions: [],
    });

    expect(getByTestId('settings-sessions-loading')).toBeTruthy();
    expect(getByText('Carregando sessoes...')).toBeTruthy();
  });

  it('exibe estado vazio quando nao ha sessoes ativas', () => {
    const { getByTestId, getByText } = renderModal({
      sessions: [],
    });

    expect(getByTestId('settings-sessions-empty')).toBeTruthy();
    expect(getByText('Nenhuma sessao ativa encontrada.')).toBeTruthy();
  });

  it('lista sessoes e delega revogacao individual', () => {
    const onRevokeSession = jest.fn();
    const { getByText, getByTestId } = renderModal({
      onRevokeSession,
    });

    expect(getByText('iPhone 15')).toBeTruthy();
    expect(getByText('SESSAO ATUAL')).toBeTruthy();

    fireEvent.press(getByTestId('settings-session-revoke-session-1'));

    expect(onRevokeSession).toHaveBeenCalledWith('session-1');
  });

  it('permite revogar outras sessoes quando ha sessao nao atual', () => {
    const onRevokeOtherSessions = jest.fn();
    const { getByText } = renderModal({
      sessions: [
        makeSession(),
        makeSession({
          id: 'session-2',
          deviceName: 'Notebook',
          platform: 'web',
          isCurrent: false,
        }),
      ],
      onRevokeOtherSessions,
    });

    fireEvent.press(getByText('REVOGAR OUTRAS SESSOES'));

    expect(onRevokeOtherSessions).toHaveBeenCalledTimes(1);
  });

  it('exibe feedback de erro e sucesso', () => {
    const { getByTestId, getByText } = renderModal({
      errorMessage: 'Falha ao carregar sessoes.',
      successMessage: 'Sessao revogada com sucesso.',
    });

    expect(getByTestId('settings-sessions-error')).toBeTruthy();
    expect(getByTestId('settings-sessions-success')).toBeTruthy();
    expect(getByText('Falha ao carregar sessoes.')).toBeTruthy();
    expect(getByText('Sessao revogada com sucesso.')).toBeTruthy();
  });
});
