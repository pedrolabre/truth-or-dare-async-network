import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import CreateGroupScreen from '../app/create-group';
import { useCreateGroupScreen } from '../hooks/useCreateGroupScreen';
import { publishMyClubsUpsert } from '../services/clubsLocalUpdates';
import type { ClubDetailsApi } from '../types/clubsApi';

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    MaterialIcons: ({ name }: { name: string }) =>
      React.createElement(Text, null, name),
  };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }),
}));

jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock('../hooks/useCreateGroupScreen', () => ({
  useCreateGroupScreen: jest.fn(),
}));

jest.mock('../services/clubsLocalUpdates', () => ({
  publishMyClubsUpsert: jest.fn(),
}));

const mockedUseCreateGroupScreen = useCreateGroupScreen as jest.MockedFunction<
  typeof useCreateGroupScreen
>;
const mockedPublishMyClubsUpsert =
  publishMyClubsUpsert as jest.MockedFunction<typeof publishMyClubsUpsert>;

function makeClubDetails(
  overrides: Partial<ClubDetailsApi> = {},
): ClubDetailsApi {
  return {
    id: 'club-created-real',
    slug: 'clube-criado-real',
    name: 'Clube Criado Real',
    description: 'Descricao criada pela API.',
    iconName: 'favorite',
    avatarUrl: null,
    visibility: 'private',
    status: 'active',
    memberCount: 2,
    promptCount: 0,
    lastActivityAt: '2026-05-21T12:00:00.000Z',
    viewerMembership: {
      isMember: true,
      role: 'owner',
      status: 'active',
    },
    coverUrl: null,
    rules: null,
    tags: ['games'],
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

function makeHookState(
  overrides: Partial<ReturnType<typeof useCreateGroupScreen>> = {},
): ReturnType<typeof useCreateGroupScreen> {
  return {
    name: 'Clube Valido',
    description: 'Descricao valida do clube.',
    visibility: 'public',
    rules: '',
    selectedTags: [],
    friendQuery: '',
    selectedMembers: [],
    selectedIcon: 'groups',
    iconModalVisible: false,
    memberOptions: [
      {
        id: 'user-1',
        name: 'Ana Souza',
        email: 'ana@example.com',
      },
    ],
    isLoadingMembers: false,
    memberSearchError: null,
    isSubmitting: false,
    createGroupError: null,
    selectedCount: 0,
    nameError: null,
    descriptionError: null,
    descriptionWarning: null,
    descriptionCharacterCount: 26,
    descriptionMaxLength: 280,
    rulesError: null,
    rulesCharacterCount: 0,
    rulesMaxLength: 2000,
    tagMaxCount: 10,
    canCreate: true,
    canRetryCreateGroup: false,
    setName: jest.fn(),
    setDescription: jest.fn(),
    setVisibility: jest.fn(),
    setRules: jest.fn(),
    setFriendQuery: jest.fn(),
    toggleMember: jest.fn(),
    retryMemberSearch: jest.fn(),
    toggleTag: jest.fn(),
    openIconModal: jest.fn(),
    closeIconModal: jest.fn(),
    selectIcon: jest.fn(),
    buildPayload: jest.fn(),
    handleCreateGroup: jest.fn().mockResolvedValue(null),
    retryCreateGroup: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

describe('CreateGroupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockedUseCreateGroupScreen.mockReturnValue(makeHookState());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renderiza campos principais da criacao', () => {
    const { getByPlaceholderText, getByText } = render(<CreateGroupScreen />);

    expect(getByText('Novo Clube')).toBeTruthy();
    expect(getByText('Nome do Grupo')).toBeTruthy();
    expect(getByPlaceholderText('Ex: Galera do Truth or Dare')).toBeTruthy();
    expect(getByPlaceholderText('O que define esse grupo?')).toBeTruthy();
    expect(getByText('Adicionar Membros')).toBeTruthy();
    expect(getByText('Criar Grupo')).toBeTruthy();
  });

  it('renderiza contador e erro de descricao', () => {
    mockedUseCreateGroupScreen.mockReturnValue(
      makeHookState({
        description: 'd'.repeat(281),
        descriptionCharacterCount: 281,
        descriptionError: 'Use no maximo 280 caracteres.',
        canCreate: false,
      }),
    );

    const { getByText } = render(<CreateGroupScreen />);

    expect(getByText('281/280')).toBeTruthy();
    expect(getByText('Use no maximo 280 caracteres.')).toBeTruthy();
  });

  it('renderiza privacidade, regras e tags', () => {
    mockedUseCreateGroupScreen.mockReturnValue(
      makeHookState({
        rules: 'Sem spam.',
        rulesCharacterCount: 9,
        selectedTags: ['games'],
        visibility: 'private',
      }),
    );

    const { getByPlaceholderText, getByText } = render(<CreateGroupScreen />);

    expect(getByText('Privacidade')).toBeTruthy();
    expect(getByText('Publico')).toBeTruthy();
    expect(getByText('Privado')).toBeTruthy();
    expect(getByText('Convite')).toBeTruthy();
    expect(getByText('Regras do Clube')).toBeTruthy();
    expect(getByPlaceholderText('Combinados, limites e preferencias do clube.')).toBeTruthy();
    expect(getByText('Categorias')).toBeTruthy();
    expect(getByText('Games')).toBeTruthy();
    expect(getByText('1/10')).toBeTruthy();
  });

  it('renderiza estados de membros: loading, vazio e erro com retry', () => {
    const retryMemberSearch = jest.fn();
    mockedUseCreateGroupScreen.mockReturnValue(
      makeHookState({
        isLoadingMembers: true,
        memberOptions: [],
      }),
    );

    const { getByText, queryByText, rerender } = render(<CreateGroupScreen />);

    expect(getByText('Buscando usuarios...')).toBeTruthy();

    mockedUseCreateGroupScreen.mockReturnValue(
      makeHookState({
        memberOptions: [],
      }),
    );
    rerender(<CreateGroupScreen />);

    expect(getByText('Nenhum usuario encontrado')).toBeTruthy();
    expect(queryByText('Buscando usuarios...')).toBeNull();

    mockedUseCreateGroupScreen.mockReturnValue(
      makeHookState({
        memberOptions: [],
        memberSearchError: 'Falha de rede',
        retryMemberSearch,
      }),
    );
    rerender(<CreateGroupScreen />);

    expect(getByText('Nao foi possivel carregar usuarios')).toBeTruthy();
    expect(getByText('Falha de rede')).toBeTruthy();

    fireEvent.press(getByText('Tentar novamente'));

    expect(retryMemberSearch).toHaveBeenCalledTimes(1);
  });

  it('desabilita botao de criar quando invalido ou enviando', () => {
    const handleCreateGroup = jest.fn();
    mockedUseCreateGroupScreen.mockReturnValue(
      makeHookState({
        canCreate: false,
        handleCreateGroup,
        nameError: 'Use pelo menos 3 caracteres.',
      }),
    );

    const { getByText, rerender } = render(<CreateGroupScreen />);

    fireEvent.press(getByText('Criar Grupo'));

    expect(handleCreateGroup).not.toHaveBeenCalled();

    mockedUseCreateGroupScreen.mockReturnValue(
      makeHookState({
        canCreate: true,
        handleCreateGroup,
        isSubmitting: true,
      }),
    );
    rerender(<CreateGroupScreen />);

    fireEvent.press(getByText('Criando Grupo...'));

    expect(handleCreateGroup).not.toHaveBeenCalled();
  });

  it('mostra erro de API abaixo do botao e chama retry de submit', () => {
    const retryCreateGroup = jest.fn().mockResolvedValue(null);
    mockedUseCreateGroupScreen.mockReturnValue(
      makeHookState({
        canRetryCreateGroup: true,
        createGroupError: 'Nao foi possivel criar o clube. Falha da API',
        retryCreateGroup,
      }),
    );

    const { getByText } = render(<CreateGroupScreen />);

    expect(
      getByText('Nao foi possivel criar o clube. Falha da API'),
    ).toBeTruthy();

    fireEvent.press(getByText('Tentar novamente'));

    expect(retryCreateGroup).toHaveBeenCalledTimes(1);
  });

  it('sucesso exibe feedback, publica upsert local e navega com o id retornado', async () => {
    jest.useFakeTimers();
    const createdClub = makeClubDetails({
      id: 'club-real-retornado',
    });
    const handleCreateGroup = jest.fn().mockResolvedValue(createdClub);

    mockedUseCreateGroupScreen.mockReturnValue(
      makeHookState({
        handleCreateGroup,
      }),
    );

    const { getByText } = render(<CreateGroupScreen />);

    fireEvent.press(getByText('Criar Grupo'));

    await waitFor(() => {
      expect(getByText('Clube criado. Abrindo detalhes...')).toBeTruthy();
    });

    expect(mockedPublishMyClubsUpsert).toHaveBeenCalledTimes(1);
    expect(mockedPublishMyClubsUpsert).toHaveBeenCalledWith(createdClub);
    expect(getByText('Clube criado')).toBeTruthy();
    expect(mockRouterReplace).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(700);
      await Promise.resolve();
    });

    expect(mockRouterReplace).toHaveBeenCalledWith('/clubs/club-real-retornado');
  });

  it('modal de icones permite selecionar icone valido', () => {
    const selectIcon = jest.fn();
    mockedUseCreateGroupScreen.mockReturnValue(
      makeHookState({
        iconModalVisible: true,
        selectIcon,
      }),
    );

    const { getByText } = render(<CreateGroupScreen />);

    fireEvent.press(getByText('favorite'));

    expect(selectIcon).toHaveBeenCalledWith('favorite');
  });
});
