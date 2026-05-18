import {
  mapClubSummaryToDiscoverItem,
  mapClubSummaryToListItem,
} from '../services/clubsMappers';
import type { ClubSummaryApi } from '../types/clubsApi';

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

describe('clubs mappers', () => {
  it('mapeia ClubSummaryApi para ClubListItem preservando campos e status ativo', () => {
    const item = mapClubSummaryToListItem(makeClubSummary());

    expect(item).toEqual({
      id: 'club-1',
      name: 'Bons Desafios',
      description: 'Um clube para desafios leves.',
      memberCount: 2,
      membersLabel: '2 membros',
      statusLabel: 'Dono',
      iconName: 'sports-esports',
      isActive: true,
    });
  });

  it('usa fallbacks amigáveis para descrição e ícone quando necessário', () => {
    const item = mapClubSummaryToListItem(
      makeClubSummary({
        description: null,
        iconName: '   ',
        memberCount: 1,
        viewerMembership: {
          role: 'member',
        },
      }),
    );

    expect(item.description).toBe('Clube sem descrição por enquanto.');
    expect(item.iconName).toBe('groups');
    expect(item.memberCount).toBe(1);
    expect(item.membersLabel).toBe('1 membro');
    expect(item.statusLabel).toBe('Membro');
  });

  it('marca ClubListItem como inativo quando clube ou membership nao estao ativos', () => {
    const requestedMembershipItem = mapClubSummaryToListItem(
      makeClubSummary({
        viewerMembership: {
          role: null,
          status: 'requested',
        },
      }),
    );
    const archivedClubItem = mapClubSummaryToListItem(
      makeClubSummary({
        status: 'archived',
      }),
    );

    expect(requestedMembershipItem.statusLabel).toBe('Pendente');
    expect(requestedMembershipItem.isActive).toBe(false);
    expect(archivedClubItem.statusLabel).toBe('Arquivado');
    expect(archivedClubItem.isActive).toBe(false);
  });

  it('mapeia origem da descoberta para badge e trending', () => {
    const suggested = mapClubSummaryToDiscoverItem(
      makeClubSummary(),
      'suggested',
    );
    const popular = mapClubSummaryToDiscoverItem(makeClubSummary(), 'popular');
    const recent = mapClubSummaryToDiscoverItem(makeClubSummary(), 'recent');
    const search = mapClubSummaryToDiscoverItem(makeClubSummary(), 'search');

    expect(suggested.badgeLabel).toBe('Sugestão');
    expect(suggested.memberCount).toBe(2);
    expect(suggested.isMember).toBe(true);
    expect(suggested.membershipStatus).toBe('active');
    expect(suggested.isTrending).toBe(false);
    expect(popular.badgeLabel).toBe('Popular');
    expect(popular.isTrending).toBe(true);
    expect(recent.badgeLabel).toBe('Novo');
    expect(recent.isTrending).toBe(false);
    expect(search.badgeLabel).toBe('Busca');
    expect(search.isTrending).toBe(false);
  });
});
