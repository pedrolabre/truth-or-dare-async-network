import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  CLUB_INVITE_USER_SEARCH_DEBOUNCE_MS,
  useClubInvites,
} from '../hooks/useClubInvites';
import type { ChallengeUser } from '../services/api';
import type { ClubInviteApi } from '../types/clubsApi';

function makeUser(overrides: Partial<ChallengeUser> = {}): ChallengeUser {
  return {
    id: 'user-1',
    name: 'Ana Silva',
    email: 'ana@example.com',
    ...overrides,
  };
}

function makeInvite(overrides: Partial<ClubInviteApi> = {}): ClubInviteApi {
  return {
    id: 'invite-1',
    clubId: 'club-1',
    inviteeId: 'user-1',
    inviterId: 'owner-1',
    status: 'invited',
    message: null,
    expiresAt: null,
    acceptedAt: null,
    declinedAt: null,
    cancelledAt: null,
    createdAt: '2026-05-21T12:00:00.000Z',
    updatedAt: '2026-05-21T12:00:00.000Z',
    ...overrides,
  };
}

async function advanceInviteSearchDebounce() {
  await act(async () => {
    jest.advanceTimersByTime(CLUB_INVITE_USER_SEARCH_DEBOUNCE_MS);
    await Promise.resolve();
  });
}

describe('useClubInvites', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('busca usuarios reais com debounce e envia convite pelo endpoint', async () => {
    const searchUsers = jest.fn().mockResolvedValue([makeUser()]);
    const sendClubInvite = jest.fn().mockResolvedValue(makeInvite());

    const { result } = renderHook(() =>
      useClubInvites({
        clubId: 'club-1',
        enabled: true,
        canInvite: true,
        searchUsers,
        sendClubInvite,
      }),
    );

    act(() => {
      result.current.setQuery('ana');
    });

    await advanceInviteSearchDebounce();

    await waitFor(() => {
      expect(result.current.users).toEqual([
        {
          id: 'user-1',
          name: 'Ana Silva',
          email: 'ana@example.com',
        },
      ]);
    });

    expect(searchUsers).toHaveBeenCalledWith('ana');

    await act(async () => {
      await result.current.inviteUser('user-1');
    });

    expect(sendClubInvite).toHaveBeenCalledWith('club-1', 'user-1', null);
    expect(result.current.invitedUserIds).toEqual(['user-1']);
    expect(result.current.inviteSuccessMessage).toBe('Convite enviado.');
  });

  it('nao busca nem envia quando permissao de convite esta bloqueada', async () => {
    const searchUsers = jest.fn().mockResolvedValue([makeUser()]);
    const sendClubInvite = jest.fn().mockResolvedValue(makeInvite());

    const { result } = renderHook(() =>
      useClubInvites({
        clubId: 'club-1',
        enabled: true,
        canInvite: false,
        searchUsers,
        sendClubInvite,
      }),
    );

    await advanceInviteSearchDebounce();

    await act(async () => {
      await result.current.inviteUser('user-1');
    });

    expect(searchUsers).not.toHaveBeenCalled();
    expect(sendClubInvite).not.toHaveBeenCalled();
    expect(result.current.users).toEqual([]);
  });
});
