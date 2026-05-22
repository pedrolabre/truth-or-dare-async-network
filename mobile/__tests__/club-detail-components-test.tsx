import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ClubActionBar from '../components/clubs/ClubActionBar';
import ClubAboutPanel from '../components/clubs/ClubAboutPanel';
import ClubDetailTabs from '../components/clubs/ClubDetailTabs';
import ClubFeedPanel from '../components/clubs/ClubFeedPanel';
import ClubHeaderCard from '../components/clubs/ClubHeaderCard';
import ClubPromptCard from '../components/clubs/ClubPromptCard';
import ClubRankingPanel from '../components/clubs/ClubRankingPanel';
import { LIGHT_CLUBS_COLORS } from '../constants/clubsTheme';
import type { ClubDetail, ClubFeedScreenState } from '../types/clubs';
import type { ClubFeedItemApi } from '../types/clubsApi';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    MaterialIcons: ({ name }: { name: string }) =>
      React.createElement(Text, null, name),
  };
});

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
    tags: ['games', 'party'],
    createdAt: '2026-05-20T12:00:00.000Z',
    updatedAt: '2026-05-21T12:00:00.000Z',
    archivedAt: null,
    deletedAt: null,
    joinPolicy: 'open',
    viewerMembership: {
      isMember: true,
      role: 'owner',
      status: 'active',
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

function makeFeedItem(overrides: Partial<ClubFeedItemApi> = {}): ClubFeedItemApi {
  return {
    id: 'prompt-truth-1',
    clubId: 'club-1',
    authorId: 'user-1',
    authorName: 'Ana',
    type: 'truth',
    status: 'published',
    content: 'Qual foi a melhor surpresa da semana?',
    difficulty: 'leve',
    attachments: [],
    maxAttempts: null,
    expiresAt: null,
    publishedAt: '2026-05-21T12:30:00.000Z',
    answersCount: 2,
    commentsCount: 1,
    likesCount: 4,
    isPinned: false,
    isMembersOnly: false,
    createdAt: '2026-05-21T12:00:00.000Z',
    updatedAt: '2026-05-21T12:30:00.000Z',
    viewerState: {
      likedByMe: false,
      answeredByMe: false,
      canAnswer: true,
    },
    recentResponses: [
      {
        id: 'response-1',
        clubId: 'club-1',
        promptId: 'prompt-truth-1',
        userId: 'user-2',
        userName: 'Bia',
        text: 'Ganhei um bolo de surpresa.',
        mediaUrl: null,
        mediaType: null,
        dareProofId: null,
        attemptsUsed: 1,
        completedAt: '2026-05-21T13:00:00.000Z',
        likesCount: 1,
        commentsCount: 0,
        createdAt: '2026-05-21T13:00:00.000Z',
        updatedAt: '2026-05-21T13:00:00.000Z',
      },
    ],
    ...overrides,
  };
}

function makeFeedState(
  overrides: Partial<ClubFeedScreenState> = {},
): ClubFeedScreenState {
  return {
    items: [makeFeedItem()],
    contentState: 'ready',
    isInitialLoading: false,
    isRefreshing: false,
    errorMessage: null,
    canRetry: true,
    hasRealPromptPagination: false,
    handleRetry: jest.fn().mockResolvedValue(undefined),
    handleRefresh: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('club detail components', () => {
  it('renderiza abas internas e comunica troca de aba', () => {
    const onChangeTab = jest.fn();
    const { getByTestId, getByText } = render(
      <ClubDetailTabs
        activeTab="feed"
        colors={LIGHT_CLUBS_COLORS}
        onChangeTab={onChangeTab}
      />,
    );

    expect(getByTestId('club-detail-tabs')).toBeTruthy();
    expect(getByText('Feed')).toBeTruthy();
    expect(getByText('Membros')).toBeTruthy();
    expect(getByText('Ranking')).toBeTruthy();
    expect(getByText('Sobre')).toBeTruthy();

    fireEvent.press(getByTestId('club-detail-tab-about'));

    expect(onChangeTab).toHaveBeenCalledWith('about');
  });

  it('renderiza header com identidade, badges, tags e contadores', () => {
    const { getAllByText, getByText, getByTestId } = render(
      <ClubHeaderCard club={makeClubDetail()} colors={LIGHT_CLUBS_COLORS} />,
    );

    expect(getByTestId('club-header-card')).toBeTruthy();
    expect(getByText('Bons Desafios')).toBeTruthy();
    expect(getByText('Um clube para desafios leves.')).toBeTruthy();
    expect(getByText('Ativo')).toBeTruthy();
    expect(getByText('Publico')).toBeTruthy();
    expect(getAllByText('Dono')).toHaveLength(2);
    expect(getByText('#games')).toBeTruthy();
    expect(getByText('4 membros')).toBeTruthy();
    expect(getByText('7 prompts')).toBeTruthy();
  });

  it('mostra entrada para visitante publico e oculta acoes administrativas', () => {
    const onJoin = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <ClubActionBar
        club={makeClubDetail({
          viewerMembership: {
            isMember: false,
            role: null,
            status: null,
          },
          membershipLabel: 'Visitante',
          permissions: {
            canViewFeed: true,
            canPostPrompt: false,
            canInviteMembers: false,
            canManageMembers: false,
            canEditClub: false,
            canArchiveClub: false,
            canTransferOwnership: false,
          },
        })}
        colors={LIGHT_CLUBS_COLORS}
        pendingAction={null}
        isMuted={false}
        onJoin={onJoin}
        onLeave={jest.fn()}
        onInvite={jest.fn()}
        onPostPrompt={jest.fn()}
        onToggleMute={jest.fn()}
        onOpenSettings={jest.fn()}
      />,
    );

    fireEvent.press(getByTestId('club-action-join'));

    expect(onJoin).toHaveBeenCalledTimes(1);
    expect(queryByTestId('club-action-settings')).toBeNull();
    expect(queryByTestId('club-action-invite')).toBeNull();
    expect(queryByTestId('club-action-post')).toBeNull();
  });

  it('mostra acoes de owner/admin conforme permissoes', () => {
    const onPostPrompt = jest.fn();
    const onInvite = jest.fn();
    const onOpenSettings = jest.fn();
    const onLeave = jest.fn();
    const onToggleMute = jest.fn();
    const { getByTestId } = render(
      <ClubActionBar
        club={makeClubDetail()}
        colors={LIGHT_CLUBS_COLORS}
        pendingAction={null}
        isMuted={false}
        onJoin={jest.fn()}
        onLeave={onLeave}
        onInvite={onInvite}
        onPostPrompt={onPostPrompt}
        onToggleMute={onToggleMute}
        onOpenSettings={onOpenSettings}
      />,
    );

    fireEvent.press(getByTestId('club-action-post'));
    fireEvent.press(getByTestId('club-action-invite'));
    fireEvent.press(getByTestId('club-action-settings'));
    fireEvent.press(getByTestId('club-action-leave'));
    fireEvent.press(getByTestId('club-action-mute'));

    expect(onPostPrompt).toHaveBeenCalledTimes(1);
    expect(onInvite).toHaveBeenCalledTimes(1);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(onToggleMute).toHaveBeenCalledTimes(1);
  });

  it('renderiza Sobre com dados reais do detalhe do clube', () => {
    const { getAllByText, getByText, getByTestId } = render(
      <ClubAboutPanel club={makeClubDetail()} colors={LIGHT_CLUBS_COLORS} />,
    );

    expect(getByTestId('club-about-panel')).toBeTruthy();
    expect(getByText('Um clube para desafios leves.')).toBeTruthy();
    expect(getByText('Sem spam.')).toBeTruthy();
    expect(getByText('#games')).toBeTruthy();
    expect(getByText('#party')).toBeTruthy();
    expect(getByText('Publico')).toBeTruthy();
    expect(getByText('Ativo')).toBeTruthy();
    expect(getByText('Entrada aberta')).toBeTruthy();
    expect(getByText('4 membros')).toBeTruthy();
    expect(getByText('7 prompts')).toBeTruthy();
    expect(getByText('20/05/2026')).toBeTruthy();
    expect(getAllByText('21/05/2026')).toHaveLength(2);
  });

  it('renderiza Sobre com regras e tags vazias sem inventar conteudo', () => {
    const { getByTestId, getByText } = render(
      <ClubAboutPanel
        club={makeClubDetail({
          descriptionText: '',
          rules: null,
          tags: [],
          lastActivityAt: null,
        })}
        colors={LIGHT_CLUBS_COLORS}
      />,
    );

    expect(getByText('Sem descricao publicada.')).toBeTruthy();
    expect(getByText('Sem regras publicadas.')).toBeTruthy();
    expect(getByTestId('club-about-tags-empty')).toBeTruthy();
    expect(getByText('Sem tags publicadas.')).toBeTruthy();
    expect(getByText('Sem atividade registrada')).toBeTruthy();
  });

  it('renderiza Ranking como indisponivel sem leaderboard local', () => {
    const { getByTestId, getByText, queryByTestId, queryByText } = render(
      <ClubRankingPanel colors={LIGHT_CLUBS_COLORS} />,
    );

    expect(getByTestId('club-ranking-unavailable')).toBeTruthy();
    expect(getByText('Ranking indisponivel')).toBeTruthy();
    expect(queryByTestId('club-ranking-leaderboard')).toBeNull();
    expect(queryByText('999 pontos')).toBeNull();
  });

  it('renderiza card de prompt de verdade com dados reais e respostas recentes', () => {
    const { getByTestId, getByText } = render(
      <ClubPromptCard item={makeFeedItem()} colors={LIGHT_CLUBS_COLORS} />,
    );

    expect(getByTestId('club-prompt-card-prompt-truth-1')).toBeTruthy();
    expect(getByTestId('club-prompt-type-prompt-truth-1')).toBeTruthy();
    expect(getByText('Verdade')).toBeTruthy();
    expect(getByText('Ana')).toBeTruthy();
    expect(getByText('Qual foi a melhor surpresa da semana?')).toBeTruthy();
    expect(getByText('Sem prazo')).toBeTruthy();
    expect(getByText('leve')).toBeTruthy();
    expect(getByText('2 respostas')).toBeTruthy();
    expect(getByText('1 comentario')).toBeTruthy();
    expect(getByText('4 curtidas')).toBeTruthy();
    expect(getByText('Pode responder')).toBeTruthy();
    expect(getByText('Bia')).toBeTruthy();
    expect(getByText('Ganhei um bolo de surpresa.')).toBeTruthy();
  });

  it('renderiza card de desafio expirado e respondido sem criar resposta falsa', () => {
    const { getByText, queryByTestId } = render(
      <ClubPromptCard
        item={makeFeedItem({
          id: 'prompt-dare-1',
          type: 'dare',
          content: 'Cante o refrao de uma musica.',
          maxAttempts: 2,
          expiresAt: '2020-01-01T09:00:00.000Z',
          difficulty: null,
          viewerState: {
            likedByMe: true,
            answeredByMe: true,
            canAnswer: false,
          },
          recentResponses: [],
        })}
        colors={LIGHT_CLUBS_COLORS}
      />,
    );

    expect(getByText('Desafio')).toBeTruthy();
    expect(getByText('Cante o refrao de uma musica.')).toBeTruthy();
    expect(getByText('Prazo encerrado em 01/01/2020 as 09:00')).toBeTruthy();
    expect(getByText('Dificuldade nao informada')).toBeTruthy();
    expect(getByText('Respondido por voce')).toBeTruthy();
    expect(queryByTestId('club-prompt-recent-responses-prompt-dare-1')).toBeNull();
  });

  it('renderiza feed com prompts reais e aviso de ausencia de paginacao', () => {
    const { getByTestId, getByText, queryByText } = render(
      <ClubFeedPanel colors={LIGHT_CLUBS_COLORS} feed={makeFeedState()} />,
    );

    expect(getByTestId('club-feed-panel')).toBeTruthy();
    expect(getByText('Prompts do clube')).toBeTruthy();
    expect(getByTestId('club-prompt-card-prompt-truth-1')).toBeTruthy();
    expect(getByTestId('club-feed-pagination-notice')).toBeTruthy();
    expect(
      getByText(/sem paginacao real/i),
    ).toBeTruthy();
    expect(queryByText('Carregar mais')).toBeNull();
  });

  it('renderiza estados de feed vazio, erro e acesso indisponivel', () => {
    const handleRefresh = jest.fn().mockResolvedValue(undefined);
    const handleRetry = jest.fn().mockResolvedValue(undefined);
    const emptyFeed = makeFeedState({
      items: [],
      contentState: 'empty',
      handleRefresh,
    });
    const errorFeed = makeFeedState({
      items: [],
      contentState: 'error',
      errorMessage: 'Falha ao buscar prompts',
      handleRetry,
    });
    const blockedFeed = makeFeedState({
      items: [],
      contentState: 'access-denied',
      canRetry: false,
    });

    const { getByText, getByTestId, rerender } = render(
      <ClubFeedPanel colors={LIGHT_CLUBS_COLORS} feed={emptyFeed} />,
    );

    expect(getByTestId('club-feed-empty')).toBeTruthy();
    expect(getByText('Nenhum prompt publicado')).toBeTruthy();

    fireEvent.press(getByText('Atualizar feed'));
    expect(handleRefresh).toHaveBeenCalledTimes(1);

    rerender(<ClubFeedPanel colors={LIGHT_CLUBS_COLORS} feed={errorFeed} />);
    expect(getByTestId('club-feed-error')).toBeTruthy();
    expect(getByText('Falha ao buscar prompts')).toBeTruthy();

    fireEvent.press(getByText('Tentar novamente'));
    expect(handleRetry).toHaveBeenCalledTimes(1);

    rerender(<ClubFeedPanel colors={LIGHT_CLUBS_COLORS} feed={blockedFeed} />);
    expect(getByTestId('club-feed-access-unavailable')).toBeTruthy();
    expect(getByText('Feed indisponivel')).toBeTruthy();
  });
});
