import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  CREATE_GROUP_MEMBER_SEARCH_DEBOUNCE_MS,
  CREATE_GROUP_NAME_MAX_LENGTH,
  useCreateGroupScreen,
} from '../hooks/useCreateGroupScreen';
import { CREATE_GROUP_ICON_OPTIONS } from '../constants/createGroupIcons';
import { CREATE_GROUP_TAG_OPTIONS } from '../constants/createGroupTags';
import type { ChallengeUser } from '../services/api';
import type { ClubDetailsApi } from '../types/clubsApi';
import type { CreateGroupSubmitPayload } from '../types/createGroup';

jest.mock('../services/api', () => ({
  getUsers: jest.fn(),
}));

jest.mock('../services/clubsApi', () => ({
  createClub: jest.fn(),
}));

function makeUser(overrides: Partial<ChallengeUser> = {}): ChallengeUser {
  return {
    id: 'user-1',
    name: 'Ana Souza',
    email: 'ana@example.com',
    ...overrides,
  };
}

function makeClubDetails(
  overrides: Partial<ClubDetailsApi> = {},
): ClubDetailsApi {
  return {
    id: 'club-created-1',
    slug: 'clube-criado',
    name: 'Clube Criado',
    description: 'Descricao do clube criado.',
    iconName: 'favorite',
    avatarUrl: null,
    visibility: 'private',
    status: 'active',
    memberCount: 3,
    promptCount: 0,
    lastActivityAt: '2026-05-21T12:00:00.000Z',
    viewerMembership: {
      isMember: true,
      role: 'owner',
      status: 'active',
    },
    coverUrl: null,
    rules: null,
    tags: [],
    createdAt: '2026-05-21T12:00:00.000Z',
    updatedAt: '2026-05-21T12:00:00.000Z',
    archivedAt: null,
    deletedAt: null,
    joinPolicy: 'invite_only',
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

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return {
    promise,
    reject,
    resolve,
  };
}

function makePendingSearchUsers() {
  return jest.fn<Promise<ChallengeUser[]>, [string?]>(
    () => new Promise<ChallengeUser[]>(() => {}),
  );
}

async function advanceMemberSearchDebounce() {
  await act(async () => {
    jest.advanceTimersByTime(CREATE_GROUP_MEMBER_SEARCH_DEBOUNCE_MS);
    await Promise.resolve();
  });
}

describe('useCreateGroupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('bloqueia nome invalido por minimo', () => {
    const { result } = renderHook(() =>
      useCreateGroupScreen({
        memberSearchDebounceMs: 0,
        searchUsers: makePendingSearchUsers(),
      }),
    );

    act(() => {
      result.current.setName('ab');
    });

    expect(result.current.nameError).toBe('Use pelo menos 3 caracteres.');
    expect(result.current.canCreate).toBe(false);
  });

  it('bloqueia nome invalido por maximo', () => {
    const { result } = renderHook(() =>
      useCreateGroupScreen({
        memberSearchDebounceMs: 0,
        searchUsers: makePendingSearchUsers(),
      }),
    );

    act(() => {
      result.current.setName('a'.repeat(CREATE_GROUP_NAME_MAX_LENGTH + 1));
    });

    expect(result.current.nameError).toBe('Use no maximo 80 caracteres.');
    expect(result.current.canCreate).toBe(false);
  });

  it('habilita o formulario com nome valido conforme as regras finais', () => {
    const { result } = renderHook(() =>
      useCreateGroupScreen({
        memberSearchDebounceMs: 0,
        searchUsers: makePendingSearchUsers(),
      }),
    );

    act(() => {
      result.current.setName('Clube Valido');
    });

    expect(result.current.nameError).toBeNull();
    expect(result.current.descriptionError).toBeNull();
    expect(result.current.rulesError).toBeNull();
    expect(result.current.canCreate).toBe(true);
  });

  it('bloqueia descricao acima de 280 caracteres', () => {
    const { result } = renderHook(() =>
      useCreateGroupScreen({
        memberSearchDebounceMs: 0,
        searchUsers: makePendingSearchUsers(),
      }),
    );

    act(() => {
      result.current.setName('Clube Valido');
      result.current.setDescription('d'.repeat(281));
    });

    expect(result.current.descriptionError).toBe(
      'Use no maximo 280 caracteres.',
    );
    expect(result.current.canCreate).toBe(false);
  });

  it('mantem descricao vazia permitida e descricao curta como aviso nao bloqueante', () => {
    const { result } = renderHook(() =>
      useCreateGroupScreen({
        memberSearchDebounceMs: 0,
        searchUsers: makePendingSearchUsers(),
      }),
    );

    act(() => {
      result.current.setName('Clube Valido');
    });

    expect(result.current.description).toBe('');
    expect(result.current.descriptionWarning).toBeNull();
    expect(result.current.canCreate).toBe(true);
    expect(result.current.buildPayload().description).toBeNull();

    act(() => {
      result.current.setDescription('Curta');
    });

    expect(result.current.descriptionError).toBeNull();
    expect(result.current.descriptionWarning).toBe(
      'Dica: uma descricao com pelo menos 20 caracteres ajuda o clube a ficar claro.',
    );
    expect(result.current.canCreate).toBe(true);
  });

  it('normaliza regras vazias, privacidade, tags, icone e membros no payload', () => {
    const { result } = renderHook(() =>
      useCreateGroupScreen({
        memberSearchDebounceMs: 0,
        searchUsers: makePendingSearchUsers(),
      }),
    );

    act(() => {
      result.current.setName('  Clube de Testes  ');
      result.current.setDescription('  Descricao final  ');
      result.current.setRules('   ');
      result.current.setVisibility('invite_only');
      result.current.toggleTag(' Friends ');
      result.current.toggleTag('friends');
      CREATE_GROUP_TAG_OPTIONS.forEach((tag) => {
        result.current.toggleTag(tag.value);
      });
      result.current.selectIcon('invalid-icon' as never);
      result.current.selectIcon('favorite');
      result.current.toggleMember('user-1');
      result.current.toggleMember('user-2');
      result.current.toggleMember('user-1');
      result.current.toggleMember('user-1');
    });

    const payload = result.current.buildPayload();

    expect(payload).toEqual({
      name: 'Clube de Testes',
      description: 'Descricao final',
      iconName: 'favorite',
      visibility: 'invite_only',
      rules: null,
      tags: CREATE_GROUP_TAG_OPTIONS.slice(0, 10).map((tag) => tag.value),
      initialMemberIds: ['user-2', 'user-1'],
    });
    expect(result.current.selectedTags).toHaveLength(10);
    expect(result.current.selectedIcon).toBe('favorite');
    expect(CREATE_GROUP_ICON_OPTIONS).toContain(payload.iconName);
  });

  it('busca membros com debounce usando getUsers/searchUsers', async () => {
    jest.useFakeTimers();
    const searchUsers = jest.fn().mockResolvedValue([makeUser()]);

    const { result } = renderHook(() =>
      useCreateGroupScreen({
        searchUsers,
      }),
    );

    act(() => {
      result.current.setFriendQuery('  ana  ');
    });

    expect(searchUsers).not.toHaveBeenCalled();

    await advanceMemberSearchDebounce();

    await waitFor(() => {
      expect(result.current.memberOptions).toEqual([
        {
          id: 'user-1',
          name: 'Ana Souza',
          email: 'ana@example.com',
        },
      ]);
    });

    expect(searchUsers).toHaveBeenCalledTimes(1);
    expect(searchUsers).toHaveBeenCalledWith('ana');
    expect(result.current.isLoadingMembers).toBe(false);
    expect(result.current.memberSearchError).toBeNull();
  });

  it('representa loading, vazio, erro e retry na busca de membros', async () => {
    jest.useFakeTimers();
    const firstSearch = createDeferred<ChallengeUser[]>();
    const searchUsers = jest
      .fn()
      .mockReturnValueOnce(firstSearch.promise)
      .mockRejectedValueOnce(new Error('Falha de busca'))
      .mockResolvedValueOnce([]);

    const { result } = renderHook(() =>
      useCreateGroupScreen({
        searchUsers,
      }),
    );

    await advanceMemberSearchDebounce();

    expect(searchUsers).toHaveBeenCalledWith('');
    expect(result.current.isLoadingMembers).toBe(true);

    await act(async () => {
      firstSearch.resolve([]);
      await firstSearch.promise;
    });

    await waitFor(() => {
      expect(result.current.isLoadingMembers).toBe(false);
    });
    expect(result.current.memberOptions).toEqual([]);
    expect(result.current.memberSearchError).toBeNull();

    act(() => {
      result.current.setFriendQuery('erro');
    });

    await advanceMemberSearchDebounce();

    await waitFor(() => {
      expect(result.current.memberSearchError).toBe('Falha de busca');
    });

    act(() => {
      result.current.retryMemberSearch();
    });

    await advanceMemberSearchDebounce();

    await waitFor(() => {
      expect(result.current.memberSearchError).toBeNull();
    });

    expect(searchUsers).toHaveBeenCalledTimes(3);
    expect(searchUsers).toHaveBeenLastCalledWith('erro');
    expect(result.current.memberOptions).toEqual([]);
  });

  it('seleciona usuario por id real e mantem initialMemberIds deduplicado', async () => {
    jest.useFakeTimers();
    const searchUsers = jest.fn().mockResolvedValue([
      makeUser({ id: 'user-1' }),
      makeUser({ id: 'user-1', name: 'Ana Duplicada' }),
      makeUser({ id: 'user-2', name: 'Bruno Lima' }),
    ]);

    const { result } = renderHook(() =>
      useCreateGroupScreen({
        searchUsers,
      }),
    );

    await advanceMemberSearchDebounce();

    await waitFor(() => {
      expect(result.current.memberOptions).toHaveLength(2);
    });

    act(() => {
      result.current.setName('Clube Valido');
      result.current.toggleMember('user-1');
      result.current.toggleMember('user-2');
      result.current.toggleMember('user-1');
      result.current.toggleMember('user-1');
    });

    expect(result.current.selectedMembers).toEqual(['user-2', 'user-1']);
    expect(result.current.buildPayload().initialMemberIds).toEqual([
      'user-2',
      'user-1',
    ]);
  });

  it('submit chama createClub/submitCreateClub com payload real e retorna o clube criado', async () => {
    const createdClub = makeClubDetails();
    const submitCreateClub = jest.fn().mockResolvedValue(createdClub);

    const { result } = renderHook(() =>
      useCreateGroupScreen({
        memberSearchDebounceMs: 0,
        searchUsers: makePendingSearchUsers(),
        submitCreateClub,
      }),
    );

    act(() => {
      result.current.setName(' Clube Final ');
      result.current.setDescription(' Descricao final do clube ');
      result.current.setVisibility('private');
      result.current.setRules(' Regra principal ');
      result.current.toggleTag('games');
      result.current.selectIcon('favorite');
      result.current.toggleMember('user-1');
    });

    let returnedClub: ClubDetailsApi | null = null;

    await act(async () => {
      returnedClub = await result.current.handleCreateGroup();
    });

    expect(submitCreateClub).toHaveBeenCalledTimes(1);
    expect(submitCreateClub).toHaveBeenCalledWith({
      name: 'Clube Final',
      description: 'Descricao final do clube',
      iconName: 'favorite',
      visibility: 'private',
      rules: 'Regra principal',
      tags: ['games'],
      initialMemberIds: ['user-1'],
    });
    expect(returnedClub).toBe(createdClub);
    expect(result.current.createGroupError).toBeNull();
  });

  it('isSubmitting bloqueia duplo envio', async () => {
    const createdClub = makeClubDetails();
    const submitDeferred = createDeferred<ClubDetailsApi>();
    const submitCreateClub = jest.fn().mockReturnValue(submitDeferred.promise);

    const { result } = renderHook(() =>
      useCreateGroupScreen({
        memberSearchDebounceMs: 0,
        searchUsers: makePendingSearchUsers(),
        submitCreateClub,
      }),
    );

    act(() => {
      result.current.setName('Clube Valido');
    });

    let firstSubmit!: Promise<ClubDetailsApi | null>;
    let secondSubmit!: Promise<ClubDetailsApi | null>;

    act(() => {
      firstSubmit = result.current.handleCreateGroup();
      secondSubmit = result.current.handleCreateGroup();
    });

    expect(submitCreateClub).toHaveBeenCalledTimes(1);
    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      submitDeferred.resolve(createdClub);
      await firstSubmit;
      await secondSubmit;
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(submitCreateClub).toHaveBeenCalledTimes(1);
  });

  it('erro de API preserva formulario e retry usa o ultimo payload valido', async () => {
    const submitCreateClub = jest
      .fn<Promise<ClubDetailsApi>, [CreateGroupSubmitPayload]>()
      .mockRejectedValueOnce(new Error('Falha da API'))
      .mockResolvedValueOnce(makeClubDetails({ id: 'retry-club' }));

    const { result } = renderHook(() =>
      useCreateGroupScreen({
        memberSearchDebounceMs: 0,
        searchUsers: makePendingSearchUsers(),
        submitCreateClub,
      }),
    );

    act(() => {
      result.current.setName('Clube Original');
      result.current.setDescription('Descricao original');
      result.current.setVisibility('private');
      result.current.setRules('Regra original');
      result.current.toggleTag('music');
      result.current.selectIcon('nightlife');
      result.current.toggleMember('user-1');
    });

    await act(async () => {
      await result.current.handleCreateGroup();
    });

    expect(result.current.createGroupError).toBe(
      'Nao foi possivel criar o clube. Falha da API',
    );
    expect(result.current.name).toBe('Clube Original');
    expect(result.current.description).toBe('Descricao original');
    expect(result.current.rules).toBe('Regra original');
    expect(result.current.selectedTags).toEqual(['music']);
    expect(result.current.selectedIcon).toBe('nightlife');
    expect(result.current.selectedMembers).toEqual(['user-1']);
    expect(result.current.canRetryCreateGroup).toBe(true);

    act(() => {
      result.current.setName('Clube Editado Depois do Erro');
      result.current.toggleMember('user-2');
    });

    await act(async () => {
      await result.current.retryCreateGroup();
    });

    expect(submitCreateClub).toHaveBeenCalledTimes(2);
    expect(submitCreateClub).toHaveBeenLastCalledWith({
      name: 'Clube Original',
      description: 'Descricao original',
      iconName: 'nightlife',
      visibility: 'private',
      rules: 'Regra original',
      tags: ['music'],
      initialMemberIds: ['user-1'],
    });
    expect(result.current.createGroupError).toBeNull();
  });
});
