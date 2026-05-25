import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useClubDetailsScreen } from '../hooks/useClubDetailsScreen';
import type {
  ClubDetailsApi,
  ClubJoinRequestApi,
  ClubMemberApi,
  ClubPromptApi,
} from '../types/clubsApi';

function makeClubDetails(
  overrides: Partial<ClubDetailsApi> = {},
): ClubDetailsApi {
  return {
    id: 'club-1',
    slug: 'bons-desafios',
    name: 'Bons Desafios',
    description: 'Um clube para desafios leves.',
    iconName: 'sports-esports',
    avatarUrl: null,
    visibility: 'public',
    status: 'active',
    memberCount: 4,
    promptCount: 7,
    lastActivityAt: '2026-05-21T12:00:00.000Z',
    viewerMembership: {
      isMember: true,
      role: 'member',
      status: 'active',
    },
    coverUrl: null,
    rules: 'Sem spam.',
    tags: ['games'],
    createdAt: '2026-05-20T12:00:00.000Z',
    updatedAt: '2026-05-21T12:00:00.000Z',
    archivedAt: null,
    deletedAt: null,
    joinPolicy: 'open',
    permissions: {
      canViewFeed: true,
      canPostPrompt: true,
      canInviteMembers: false,
      canManageMembers: false,
      canEditClub: false,
      canArchiveClub: false,
      canTransferOwnership: false,
    },
    viewerActivity: {
      unreadCount: 0,
      lastSeenAt: null,
      mutedUntil: null,
      isMuted: false,
    },
    ...overrides,
  };
}

function makeClubMember(overrides: Partial<ClubMemberApi> = {}): ClubMemberApi {
  return {
    id: 'member-1',
    clubId: 'club-1',
    userId: 'user-1',
    name: 'Pedro',
    username: 'pedro',
    role: 'member',
    status: 'active',
    joinedAt: '2026-05-21T12:00:00.000Z',
    lastSeenAt: null,
    mutedUntil: null,
    postingSuspendedUntil: null,
    createdAt: '2026-05-21T12:00:00.000Z',
    updatedAt: '2026-05-21T12:00:00.000Z',
    ...overrides,
  };
}

function makeJoinRequest(
  overrides: Partial<ClubJoinRequestApi> = {},
): ClubJoinRequestApi {
  return {
    id: 'request-1',
    clubId: 'club-1',
    userId: 'user-1',
    status: 'requested',
    message: null,
    reviewedById: null,
    reviewedAt: null,
    approvedAt: null,
    rejectedAt: null,
    cancelledAt: null,
    createdAt: '2026-05-21T12:00:00.000Z',
    updatedAt: '2026-05-21T12:00:00.000Z',
    ...overrides,
  };
}

function makePrompt(overrides: Partial<ClubPromptApi> = {}): ClubPromptApi {
  return {
    id: 'prompt-1',
    clubId: 'club-1',
    authorId: 'user-1',
    authorName: 'Pedro',
    type: 'truth',
    status: 'published',
    content: 'Qual foi a melhor parte da semana?',
    difficulty: null,
    attachments: [],
    maxAttempts: null,
    expiresAt: null,
    publishedAt: '2026-05-21T12:00:00.000Z',
    answersCount: 0,
    commentsCount: 0,
    likesCount: 0,
    isPinned: false,
    isMembersOnly: true,
    createdAt: '2026-05-21T12:00:00.000Z',
    updatedAt: '2026-05-21T12:00:00.000Z',
    ...overrides,
  };
}

describe('useClubDetailsScreen actions', () => {
  it('entra em clube publico usando endpoint real e recarrega detalhe', async () => {
    const loadClubDetails = jest
      .fn()
      .mockResolvedValueOnce(
        makeClubDetails({
          viewerMembership: {
            isMember: false,
            role: null,
            status: null,
          },
          permissions: {
            ...makeClubDetails().permissions,
            canPostPrompt: false,
          },
        }),
      )
      .mockResolvedValueOnce(makeClubDetails());
    const joinClubAction = jest.fn().mockResolvedValue(makeClubMember());

    const { result } = renderHook(() =>
      useClubDetailsScreen({
        clubId: 'club-1',
        loadClubDetails,
        joinClubAction,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    await act(async () => {
      await result.current.handleJoinClub();
    });

    expect(joinClubAction).toHaveBeenCalledWith('club-1');
    expect(loadClubDetails).toHaveBeenCalledTimes(2);
    expect(result.current.club?.viewerMembership.isMember).toBe(true);
    expect(result.current.actionSuccessMessage).toBe('Voce entrou no clube.');
  });

  it('solicita entrada quando politica exige aprovacao', async () => {
    const requestedClub = makeClubDetails({
      visibility: 'private',
      joinPolicy: 'approval_required',
      viewerMembership: {
        isMember: false,
        role: null,
        status: 'requested',
      },
    });
    const loadClubDetails = jest
      .fn()
      .mockResolvedValueOnce(
        makeClubDetails({
          visibility: 'private',
          joinPolicy: 'approval_required',
          viewerMembership: {
            isMember: false,
            role: null,
            status: null,
          },
          permissions: {
            ...makeClubDetails().permissions,
            canPostPrompt: false,
          },
        }),
      )
      .mockResolvedValueOnce(requestedClub);
    const requestClubJoinAction = jest
      .fn()
      .mockResolvedValue(makeJoinRequest());

    const { result } = renderHook(() =>
      useClubDetailsScreen({
        clubId: 'club-1',
        loadClubDetails,
        requestClubJoinAction,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    await act(async () => {
      await result.current.handleJoinClub();
    });

    expect(requestClubJoinAction).toHaveBeenCalledWith('club-1', null);
    expect(loadClubDetails).toHaveBeenCalledTimes(2);
    expect(result.current.actionSuccessMessage).toBe(
      'Solicitacao de entrada enviada.',
    );
  });

  it('bloqueia saida de owner antes de chamar endpoint', async () => {
    const loadClubDetails = jest.fn().mockResolvedValue(
      makeClubDetails({
        viewerMembership: {
          isMember: true,
          role: 'owner',
          status: 'active',
        },
      }),
    );
    const leaveClubAction = jest.fn();

    const { result } = renderHook(() =>
      useClubDetailsScreen({
        clubId: 'club-1',
        loadClubDetails,
        leaveClubAction,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    await act(async () => {
      await result.current.handleLeaveClub();
    });

    expect(leaveClubAction).not.toHaveBeenCalled();
    expect(result.current.actionErrorMessage).toBe(
      'Dono do clube precisa transferir a posse antes de sair.',
    );
  });

  it('inicializa silencio a partir da atividade retornada pelo backend', async () => {
    const loadClubDetails = jest.fn().mockResolvedValue(
      makeClubDetails({
        viewerActivity: {
          unreadCount: 2,
          lastSeenAt: null,
          mutedUntil: '9999-12-31T23:59:59.999Z',
          isMuted: true,
        },
      }),
    );

    const { result } = renderHook(() =>
      useClubDetailsScreen({
        clubId: 'club-1',
        loadClubDetails,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    expect(result.current.isMuted).toBe(true);
    expect(result.current.club?.viewerActivity.unreadCount).toBe(2);
  });

  it('silencia e remove silencio com endpoints reais', async () => {
    const loadClubDetails = jest
      .fn()
      .mockResolvedValueOnce(makeClubDetails())
      .mockResolvedValueOnce(
        makeClubDetails({
          viewerActivity: {
            unreadCount: 0,
            lastSeenAt: null,
            mutedUntil: '9999-12-31T23:59:59.999Z',
            isMuted: true,
          },
        }),
      )
      .mockResolvedValueOnce(makeClubDetails());
    const muteClubAction = jest.fn().mockResolvedValue(
      makeClubMember({
        mutedUntil: '9999-12-31T23:59:59.999Z',
      }),
    );
    const unmuteClubAction = jest.fn().mockResolvedValue(makeClubMember());

    const { result } = renderHook(() =>
      useClubDetailsScreen({
        clubId: 'club-1',
        loadClubDetails,
        muteClubAction,
        unmuteClubAction,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    await act(async () => {
      await result.current.handleToggleMute();
    });

    expect(muteClubAction).toHaveBeenCalledWith('club-1');
    expect(loadClubDetails).toHaveBeenCalledTimes(2);
    expect(result.current.isMuted).toBe(true);

    await act(async () => {
      await result.current.handleToggleMute();
    });

    expect(unmuteClubAction).toHaveBeenCalledWith('club-1');
    expect(loadClubDetails).toHaveBeenCalledTimes(3);
    expect(result.current.isMuted).toBe(false);
  });

  it('posta prompt respeitando permissao e payload real', async () => {
    const loadClubDetails = jest.fn().mockResolvedValue(makeClubDetails());
    const createClubPromptAction = jest.fn().mockResolvedValue(makePrompt());

    const { result } = renderHook(() =>
      useClubDetailsScreen({
        clubId: 'club-1',
        loadClubDetails,
        createClubPromptAction,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    await act(async () => {
      await result.current.handleCreatePrompt({
        type: 'dare',
        content: 'Dance por 10 segundos',
        difficulty: 'leve',
        maxAttempts: 3,
        expiresAt: null,
        isMembersOnly: true,
      });
    });

    expect(createClubPromptAction).toHaveBeenCalledWith('club-1', {
      type: 'dare',
      content: 'Dance por 10 segundos',
      difficulty: 'leve',
      expiresAt: null,
      isMembersOnly: true,
      maxAttempts: 3,
    });
    expect(result.current.actionSuccessMessage).toBe(
      'Prompt publicado no clube.',
    );
  });
});
