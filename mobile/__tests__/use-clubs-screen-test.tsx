import { renderHook, waitFor } from '@testing-library/react-native';

import { useClubsScreen } from '../hooks/useClubsScreen';
import { getMyClubs } from '../services/clubsApi';
import type { ClubSummaryApi } from '../types/clubsApi';

jest.mock('../services/clubsApi', () => ({
  getMyClubs: jest.fn(),
}));

const mockedGetMyClubs = getMyClubs as jest.MockedFunction<typeof getMyClubs>;

type ClubSummaryOverrides = Partial<Omit<ClubSummaryApi, 'viewerMembership'>> & {
  viewerMembership?: Partial<ClubSummaryApi['viewerMembership']>;
};

function makeClubSummary(overrides: ClubSummaryOverrides = {}): ClubSummaryApi {
  const baseClub: ClubSummaryApi = {
    id: 'club-1',
    slug: 'bons-desafios',
    name: 'Bons Desafios',
    description: 'Um clube para desafios leves.',
    iconName: 'sports-esports',
    avatarUrl: null,
    visibility: 'public',
    status: 'active',
    memberCount: 2,
    promptCount: 4,
    lastActivityAt: '2026-05-18T12:00:00.000Z',
    viewerMembership: {
      isMember: true,
      role: 'owner',
      status: 'active',
    },
  };

  return {
    ...baseClub,
    ...overrides,
    viewerMembership: {
      ...baseClub.viewerMembership,
      ...overrides.viewerMembership,
    },
  };
}

describe('useClubsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('carrega Meus Clubes ao abrir a tela', async () => {
    mockedGetMyClubs.mockResolvedValue([makeClubSummary()]);

    const { result } = renderHook(() => useClubsScreen());

    expect(result.current.isInitialLoading).toBe(true);
    expect(result.current.activeContentState).toBe('loading');

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('list');
    });

    expect(mockedGetMyClubs).toHaveBeenCalledTimes(1);
    expect(result.current.myClubs).toEqual([
      {
        id: 'club-1',
        name: 'Bons Desafios',
        description: 'Um clube para desafios leves.',
        membersLabel: '2 membros',
        statusLabel: 'Dono',
        iconName: 'sports-esports',
        isActive: true,
      },
    ]);
    expect(result.current.activeContentState).toBe('list');
  });

  it('representa resposta vazia em Meus Clubes', async () => {
    mockedGetMyClubs.mockResolvedValue([]);

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('empty');
    });

    expect(result.current.myClubs).toEqual([]);
    expect(result.current.isMyClubsEmpty).toBe(true);
    expect(result.current.errorMessage).toBeNull();
  });

  it('representa erro ao carregar Meus Clubes', async () => {
    mockedGetMyClubs.mockRejectedValue(new Error('Falha de rede'));

    const { result } = renderHook(() => useClubsScreen());

    await waitFor(() => {
      expect(result.current.myClubsContentState).toBe('error');
    });

    expect(result.current.myClubs).toEqual([]);
    expect(result.current.errorMessage).toBe('Falha de rede');
    expect(result.current.activeContentState).toBe('error');
  });
});
