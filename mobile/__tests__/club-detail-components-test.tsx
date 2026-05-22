import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ClubActionBar from '../components/clubs/ClubActionBar';
import ClubHeaderCard from '../components/clubs/ClubHeaderCard';
import { LIGHT_CLUBS_COLORS } from '../constants/clubsTheme';
import type { ClubDetail } from '../types/clubs';

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

describe('club detail components', () => {
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
});
