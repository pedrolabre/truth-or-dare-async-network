import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useClubSettings } from '../hooks/useClubSettings';
import { useCreateGroupScreen } from '../hooks/useCreateGroupScreen';
import type { ChallengeUser } from '../services/api';
import type { ClubDetail } from '../types/clubs';
import type { ClubDetailsApi } from '../types/clubsApi';

const avatarDraft = {
  localUri: 'file:///club-avatar.jpg',
  fileName: 'club-avatar.jpg',
  mimeType: 'image/jpeg',
  sizeBytes: 1234,
};

const coverDraft = {
  localUri: 'file:///club-cover.png',
  fileName: 'club-cover.png',
  mimeType: 'image/png',
  sizeBytes: 4321,
};

function makeClubDetails(
  overrides: Partial<ClubDetailsApi> = {},
): ClubDetailsApi {
  return {
    id: 'club-1',
    slug: 'club-1',
    name: 'Clube de Midia',
    description: 'Descricao do clube.',
    iconName: 'groups',
    avatarUrl: null,
    visibility: 'public',
    status: 'active',
    memberCount: 1,
    promptCount: 0,
    lastActivityAt: '2026-06-08T12:00:00.000Z',
    viewerMembership: {
      isMember: true,
      role: 'owner',
      status: 'active',
    },
    coverUrl: null,
    rules: null,
    tags: [],
    createdAt: '2026-06-08T12:00:00.000Z',
    updatedAt: '2026-06-08T12:00:00.000Z',
    archivedAt: null,
    deletedAt: null,
    joinPolicy: 'open',
    permissions: {
      canViewFeed: true,
      canPostPrompt: true,
      canInviteMembers: true,
      canManageMembers: true,
      canEditClub: true,
      canArchiveClub: true,
      canTransferOwnership: true,
    },
    ...overrides,
  };
}

function makeClubDetail(overrides: Partial<ClubDetail> = {}): ClubDetail {
  return {
    id: 'club-1',
    slug: 'club-1',
    name: 'Clube de Midia',
    description: 'Descricao do clube.',
    descriptionText: 'Descricao do clube.',
    iconName: 'groups',
    avatarUrl: 'https://cdn.example.com/old-avatar.jpg',
    coverUrl: 'https://cdn.example.com/old-cover.jpg',
    visibility: 'public',
    visibilityLabel: 'Publico',
    status: 'active',
    statusLabel: 'Ativo',
    memberCount: 1,
    membersLabel: '1 membro',
    promptCount: 0,
    promptsLabel: '0 prompts',
    lastActivityAt: '2026-06-08T12:00:00.000Z',
    rules: null,
    tags: [],
    createdAt: '2026-06-08T12:00:00.000Z',
    updatedAt: '2026-06-08T12:00:00.000Z',
    archivedAt: null,
    deletedAt: null,
    joinPolicy: 'open',
    viewerMembership: {
      isMember: true,
      role: 'owner',
      status: 'active',
    },
    viewerActivity: {
      unreadCount: 0,
      lastSeenAt: null,
      mutedUntil: null,
      isMuted: false,
    },
    membershipLabel: 'Dono',
    permissions: {
      canViewFeed: true,
      canPostPrompt: true,
      canInviteMembers: true,
      canManageMembers: true,
      canEditClub: true,
      canArchiveClub: true,
      canTransferOwnership: true,
    },
    ...overrides,
  };
}

function makePendingSearchUsers() {
  return jest.fn<Promise<ChallengeUser[]>, [string?]>(
    () => new Promise<ChallengeUser[]>(() => {}),
  );
}

describe('club media flow', () => {
  it('cria clube sem midia, envia avatar/capa com o clubId e persiste URLs finais', async () => {
    const createdClub = makeClubDetails({ id: 'club-created' });
    const updatedClub = makeClubDetails({
      id: 'club-created',
      avatarUrl: 'https://cdn.example.com/avatar.jpg',
      coverUrl: 'https://cdn.example.com/cover.png',
    });
    const submitCreateClub = jest.fn().mockResolvedValue(createdClub);
    const submitUpdateClub = jest.fn().mockResolvedValue(updatedClub);
    const uploadFile = jest
      .fn()
      .mockResolvedValueOnce({
        bucket: 'uploads',
        path: 'club-avatars/club-created/avatar.jpg',
        fileUrl: 'https://cdn.example.com/avatar.jpg',
      })
      .mockResolvedValueOnce({
        bucket: 'uploads',
        path: 'club-covers/club-created/cover.png',
        fileUrl: 'https://cdn.example.com/cover.png',
      });
    const pickGalleryImage = jest
      .fn()
      .mockResolvedValueOnce(avatarDraft)
      .mockResolvedValueOnce(coverDraft);

    const { result } = renderHook(() =>
      useCreateGroupScreen({
        memberSearchDebounceMs: 0,
        searchUsers: makePendingSearchUsers(),
        submitCreateClub,
        submitUpdateClub,
        uploadFile,
        pickGalleryImage,
      }),
    );

    act(() => {
      result.current.setName('Clube de Midia');
    });

    await act(async () => {
      await result.current.pickAvatarFromGallery();
      await result.current.pickCoverFromGallery();
    });

    let returnedClub: ClubDetailsApi | null = null;

    await act(async () => {
      returnedClub = await result.current.handleCreateGroup();
    });

    expect(submitCreateClub).toHaveBeenCalledWith({
      name: 'Clube de Midia',
      description: null,
      iconName: 'groups',
      visibility: 'public',
      rules: null,
      tags: [],
      initialMemberIds: [],
    });
    expect(uploadFile).toHaveBeenNthCalledWith(1, {
      localUri: avatarDraft.localUri,
      fileName: avatarDraft.fileName,
      mimeType: avatarDraft.mimeType,
      usage: 'club-avatar',
      entityId: 'club-created',
      sizeBytes: avatarDraft.sizeBytes,
    });
    expect(uploadFile).toHaveBeenNthCalledWith(2, {
      localUri: coverDraft.localUri,
      fileName: coverDraft.fileName,
      mimeType: coverDraft.mimeType,
      usage: 'club-cover',
      entityId: 'club-created',
      sizeBytes: coverDraft.sizeBytes,
    });
    expect(submitUpdateClub).toHaveBeenCalledWith('club-created', {
      avatarUrl: 'https://cdn.example.com/avatar.jpg',
      coverUrl: 'https://cdn.example.com/cover.png',
    });
    expect(returnedClub).toBe(updatedClub);
    expect(result.current.mediaErrorMessage).toBeNull();
  });

  it('mantem clube criado quando upload de midia falha depois da criacao', async () => {
    const createdClub = makeClubDetails({ id: 'club-created' });
    const submitCreateClub = jest.fn().mockResolvedValue(createdClub);
    const submitUpdateClub = jest.fn();
    const uploadFile = jest.fn().mockRejectedValue(new Error('signed url failed'));
    const pickGalleryImage = jest.fn().mockResolvedValue(avatarDraft);

    const { result } = renderHook(() =>
      useCreateGroupScreen({
        memberSearchDebounceMs: 0,
        searchUsers: makePendingSearchUsers(),
        submitCreateClub,
        submitUpdateClub,
        uploadFile,
        pickGalleryImage,
      }),
    );

    act(() => {
      result.current.setName('Clube de Midia');
    });

    await act(async () => {
      await result.current.pickAvatarFromGallery();
    });

    let returnedClub: ClubDetailsApi | null = null;

    await act(async () => {
      returnedClub = await result.current.handleCreateGroup();
    });

    expect(returnedClub).toBe(createdClub);
    expect(submitUpdateClub).not.toHaveBeenCalled();
    expect(result.current.createGroupError).toBeNull();
    expect(result.current.mediaErrorMessage).toBe(
      'Clube criado, mas o avatar nao foi enviado. Voce pode tentar novamente nas configuracoes.',
    );
  });

  it('edita avatar e capa do clube com upload assinado antes do PATCH', async () => {
    const updatedClub = makeClubDetails({
      avatarUrl: 'https://cdn.example.com/new-avatar.jpg',
      coverUrl: 'https://cdn.example.com/new-cover.png',
    });
    const submitUpdateClub = jest.fn().mockResolvedValue(updatedClub);
    const uploadFile = jest
      .fn()
      .mockResolvedValueOnce({
        bucket: 'uploads',
        path: 'club-avatars/club-1/new-avatar.jpg',
        fileUrl: 'https://cdn.example.com/new-avatar.jpg',
      })
      .mockResolvedValueOnce({
        bucket: 'uploads',
        path: 'club-covers/club-1/new-cover.png',
        fileUrl: 'https://cdn.example.com/new-cover.png',
      });
    const pickGalleryImage = jest
      .fn()
      .mockResolvedValueOnce(avatarDraft)
      .mockResolvedValueOnce(coverDraft);

    const { result } = renderHook(() =>
      useClubSettings({
        club: makeClubDetail(),
        visible: true,
        canEdit: true,
        submitUpdateClub,
        uploadFile,
        pickGalleryImage,
      }),
    );

    await waitFor(() => {
      expect(result.current.name).toBe('Clube de Midia');
    });

    await act(async () => {
      await result.current.pickAvatarFromGallery();
      await result.current.pickCoverFromGallery();
    });

    await waitFor(() => {
      expect(result.current.avatarDraft).not.toBeNull();
      expect(result.current.coverDraft).not.toBeNull();
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(uploadFile).toHaveBeenNthCalledWith(1, {
      localUri: avatarDraft.localUri,
      fileName: avatarDraft.fileName,
      mimeType: avatarDraft.mimeType,
      usage: 'club-avatar',
      entityId: 'club-1',
      sizeBytes: avatarDraft.sizeBytes,
    });
    expect(uploadFile).toHaveBeenNthCalledWith(2, {
      localUri: coverDraft.localUri,
      fileName: coverDraft.fileName,
      mimeType: coverDraft.mimeType,
      usage: 'club-cover',
      entityId: 'club-1',
      sizeBytes: coverDraft.sizeBytes,
    });
    expect(submitUpdateClub).toHaveBeenCalledWith(
      'club-1',
      expect.objectContaining({
        avatarUrl: 'https://cdn.example.com/new-avatar.jpg',
        coverUrl: 'https://cdn.example.com/new-cover.png',
      }),
    );
  });

  it('remove avatar e capa persistindo null no PATCH de configuracoes', async () => {
    const updatedClub = makeClubDetails({
      avatarUrl: null,
      coverUrl: null,
    });
    const submitUpdateClub = jest.fn().mockResolvedValue(updatedClub);

    const { result } = renderHook(() =>
      useClubSettings({
        club: makeClubDetail(),
        visible: true,
        canEdit: true,
        submitUpdateClub,
      }),
    );

    await waitFor(() => {
      expect(result.current.avatarUrl).toBe('https://cdn.example.com/old-avatar.jpg');
    });

    act(() => {
      result.current.removeAvatar();
      result.current.removeCover();
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(submitUpdateClub).toHaveBeenCalledWith(
      'club-1',
      expect.objectContaining({
        avatarUrl: null,
        coverUrl: null,
      }),
    );
  });
});
