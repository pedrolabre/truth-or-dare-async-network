import {
  mapApiClubToItem,
  mapApiUserToItem,
} from '../services/searchMappers';
import type { SearchApiClubItem, SearchApiUserItem } from '../types/search';

function makeApiUser(
  overrides: Partial<SearchApiUserItem> = {},
): SearchApiUserItem {
  return {
    id: 'user-1',
    name: 'Marina Busca',
    username: 'marina_busca',
    bio: 'Gosta de desafios em grupo.',
    avatarUrl: 'https://example.com/avatar.png',
    level: 4,
    mutualCount: 2,
    ...overrides,
  };
}

function makeApiClub(
  overrides: Partial<SearchApiClubItem> = {},
): SearchApiClubItem {
  return {
    id: 'club-1',
    slug: 'noite-dos-desafios',
    name: 'Noite dos Desafios',
    description: 'Clube para desafios leves.',
    iconName: 'celebration',
    avatarUrl: 'https://example.com/club.png',
    memberCount: 42,
    isTrending: true,
    tags: ['noite', 'desafio'],
    ...overrides,
  };
}

describe('search mappers', () => {
  it('mapeia usuario com avatar e level numerico para item de tela', () => {
    const item = mapApiUserToItem(makeApiUser());

    expect(item).toEqual({
      id: 'user-1',
      name: 'Marina Busca',
      username: 'marina_busca',
      bio: 'Gosta de desafios em grupo.',
      level: 4,
      levelLabel: 'Nivel 4',
      avatarUrl: 'https://example.com/avatar.png',
      isOnline: false,
      mutualCount: 2,
    });
  });

  it('mapeia usuario sem avatar e sem level com fallbacks seguros', () => {
    const item = mapApiUserToItem(
      makeApiUser({
        id: 'fallback',
        name: '  ',
        username: null,
        bio: null,
        avatarUrl: null,
        level: null,
        mutualCount: -1,
      }),
    );

    expect(item).toEqual({
      id: 'fallback',
      name: 'Usuario',
      username: 'usuario',
      bio: undefined,
      level: null,
      levelLabel: 'Nivel inicial',
      avatarUrl: undefined,
      isOnline: false,
      mutualCount: 0,
    });
  });

  it('remove arroba do username recebido da API sem depender da tela', () => {
    const item = mapApiUserToItem(
      makeApiUser({
        username: '@usuario_formatado',
      }),
    );

    expect(item.username).toBe('usuario_formatado');
  });

  it('mapeia clube com imagem, icone e labels derivados', () => {
    const item = mapApiClubToItem(makeApiClub());

    expect(item).toEqual({
      id: 'club-1',
      slug: 'noite-dos-desafios',
      name: 'Noite dos Desafios',
      memberCount: 42,
      memberCountLabel: '42 membros',
      description: 'Clube para desafios leves.',
      iconName: 'celebration',
      imageUrl: 'https://example.com/club.png',
      badgeLabel: 'Em alta',
      isTrending: true,
      tags: ['noite', 'desafio'],
    });
  });

  it('mapeia clube sem imagem e sem icone usando fallback visual', () => {
    const item = mapApiClubToItem(
      makeApiClub({
        name: '',
        description: null,
        iconName: null,
        avatarUrl: null,
        memberCount: 1,
        isTrending: false,
        tags: [],
      }),
    );

    expect(item).toEqual({
      id: 'club-1',
      slug: 'noite-dos-desafios',
      name: 'Clube',
      memberCount: 1,
      memberCountLabel: '1 membro',
      description: 'Clube sem descricao por enquanto.',
      iconName: 'groups',
      imageUrl: undefined,
      badgeLabel: undefined,
      isTrending: false,
      tags: [],
    });
  });

  it('normaliza campos opcionais ou nulos sem quebrar item futuro de tela', () => {
    const userItem = mapApiUserToItem(
      makeApiUser({
        avatarUrl: '   ',
        bio: '   ',
        level: Number.NaN,
        mutualCount: Number.POSITIVE_INFINITY,
      }),
    );
    const clubItem = mapApiClubToItem(
      makeApiClub({
        description: '   ',
        iconName: 'icone-inexistente' as SearchApiClubItem['iconName'],
        avatarUrl: '   ',
        memberCount: Number.NaN,
        tags: null as unknown as SearchApiClubItem['tags'],
      }),
    );

    expect(userItem.avatarUrl).toBeUndefined();
    expect(userItem.bio).toBeUndefined();
    expect(userItem.level).toBeNull();
    expect(userItem.levelLabel).toBe('Nivel inicial');
    expect(userItem.mutualCount).toBe(0);
    expect(clubItem.description).toBe('Clube sem descricao por enquanto.');
    expect(clubItem.iconName).toBe('groups');
    expect(clubItem.imageUrl).toBeUndefined();
    expect(clubItem.memberCount).toBe(0);
    expect(clubItem.memberCountLabel).toBe('0 membros');
    expect(clubItem.tags).toEqual([]);
  });

  it('normaliza numeros negativos ou decimais antes de expor labels', () => {
    const userItem = mapApiUserToItem(
      makeApiUser({
        level: 4.9,
        mutualCount: -5,
      }),
    );
    const clubItem = mapApiClubToItem(
      makeApiClub({
        memberCount: 12.8,
      }),
    );

    expect(userItem.level).toBe(4);
    expect(userItem.levelLabel).toBe('Nivel 4');
    expect(userItem.mutualCount).toBe(0);
    expect(clubItem.memberCount).toBe(12);
    expect(clubItem.memberCountLabel).toBe('12 membros');
  });
});
