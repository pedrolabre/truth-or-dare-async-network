import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useClubSettings } from '../hooks/useClubSettings';
import { publishMyClubsUpsert } from '../services/clubsLocalUpdates';
import type { ClubDetail } from '../types/clubs';
import type { ClubDetailsApi } from '../types/clubsApi';

jest.mock('../services/clubsLocalUpdates', () => ({
  publishMyClubsUpsert: jest.fn(),
}));

const mockedPublishMyClubsUpsert =
  publishMyClubsUpsert as jest.MockedFunction<typeof publishMyClubsUpsert>;

function makeClubDetail(overrides: Partial<ClubDetail> = {}): ClubDetail {
  return {
    id: 'club-1',
    slug: 'bons-desafios',
    name: 'Bons Desafios',
    description: 'Um clube para desafios leves.',
    descriptionText: 'Um clube para desafios leves.',
    iconName: 'sports-esports',
    avatarUrl: null,
    coverUrl: null,
    visibility: 'public',
    visibilityLabel: 'Publico',
    status: 'active',
    statusLabel: 'Ativo',
    memberCount: 4,
    membersLabel: '4 membros',
    promptCount: 7,
    promptsLabel: '7 prompts',
    lastActivityAt: '2026-05-21T12:00:00.000Z',
    rules: 'Sem spam.',
    tags: ['games'],
    createdAt: '2026-05-20T12:00:00.000Z',
    updatedAt: '2026-05-21T12:00:00.000Z',
    archivedAt: null,
    deletedAt: null,
    joinPolicy: 'open',
    viewerMembership: {
      isMember: true,
      role: 'admin',
      status: 'active',
    },
    viewerActivity: {
      unreadCount: 0,
      lastSeenAt: null,
      mutedUntil: null,
      isMuted: false,
    },
    membershipLabel: 'Admin',
    permissions: {
      canViewFeed: true,
      canPostPrompt: true,
      canInviteMembers: true,
      canManageMembers: true,
      canEditClub: true,
      canArchiveClub: false,
      canTransferOwnership: false,
    },
    ...overrides,
  };
}

function makeClubDetails(
  overrides: Partial<ClubDetailsApi> = {},
): ClubDetailsApi {
  return {
    id: 'club-1',
    slug: 'bons-desafios',
    name: 'Bons Desafios Editado',
    description: 'Descricao editada.',
    iconName: 'favorite',
    avatarUrl: null,
    visibility: 'private',
    status: 'active',
    memberCount: 4,
    promptCount: 7,
    lastActivityAt: '2026-05-21T12:00:00.000Z',
    viewerMembership: {
      isMember: true,
      role: 'admin',
      status: 'active',
    },
    coverUrl: null,
    rules: 'Sem spoilers.',
    tags: ['music'],
    createdAt: '2026-05-20T12:00:00.000Z',
    updatedAt: '2026-05-21T13:00:00.000Z',
    archivedAt: null,
    deletedAt: null,
    joinPolicy: 'approval_required',
    permissions: {
      canViewFeed: true,
      canPostPrompt: true,
      canInviteMembers: true,
      canManageMembers: true,
      canEditClub: true,
      canArchiveClub: false,
      canTransferOwnership: false,
    },
    ...overrides,
  };
}

describe('useClubSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('salva identidade, regras, privacidade e tags com PATCH real', async () => {
    const submitUpdateClub = jest.fn().mockResolvedValue(makeClubDetails());
    const onUpdated = jest.fn();

    const { result } = renderHook(() =>
      useClubSettings({
        club: makeClubDetail(),
        visible: true,
        canEdit: true,
        submitUpdateClub,
        onUpdated,
      }),
    );

    await waitFor(() => {
      expect(result.current.name).toBe('Bons Desafios');
    });

    act(() => {
      result.current.setName('Bons Desafios Editado');
      result.current.setDescription('Descricao editada.');
      result.current.setRules('Sem spoilers.');
      result.current.setVisibility('private');
      result.current.selectIcon('favorite');
      result.current.toggleTag('games');
      result.current.toggleTag('music');
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(submitUpdateClub).toHaveBeenCalledWith('club-1', {
      name: 'Bons Desafios Editado',
      description: 'Descricao editada.',
      iconName: 'favorite',
      visibility: 'private',
      rules: 'Sem spoilers.',
      tags: ['music'],
    });
    expect(onUpdated).toHaveBeenCalledWith(makeClubDetails());
    expect(mockedPublishMyClubsUpsert).toHaveBeenCalledWith(makeClubDetails());
    expect(result.current.saveSuccessMessage).toBe('Configuracoes salvas.');
  });

  it('bloqueia salvar quando usuario nao pode editar', async () => {
    const submitUpdateClub = jest.fn().mockResolvedValue(makeClubDetails());

    const { result } = renderHook(() =>
      useClubSettings({
        club: makeClubDetail(),
        visible: true,
        canEdit: false,
        submitUpdateClub,
      }),
    );

    await waitFor(() => {
      expect(result.current.name).toBe('Bons Desafios');
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(submitUpdateClub).not.toHaveBeenCalled();
    expect(result.current.canSave).toBe(false);
  });
});
