import {
  ClubMemberStatus,
  ClubStatus,
  ClubVisibility,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import {
  searchClubs,
  SearchServiceError,
  searchUsers,
} from '../src/services/search/search.service';
import {
  addUserToClub,
  createTestClub,
  createTestUser,
  resetFeedData,
} from '../src/test-utils/factories';
import { applyTestDatabaseHooks } from './test-db';

describe('search.service', () => {
  applyTestDatabaseHooks({
    resetBeforeEach: false,
    resetAfterAll: false,
    disconnectAfterAll: false,
  });

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  afterAll(async () => {
    await resetFeedData({ deleteUsers: true });
    await prisma.$disconnect();
  });

  it('rejeita busca vazia ou curta com erro padronizado', async () => {
    const viewer = await createTestUser();

    await expect(searchUsers('', { userId: viewer.id })).rejects.toMatchObject<
      Partial<SearchServiceError>
    >({
      code: 'SEARCH_QUERY_TOO_SHORT',
      statusCode: 400,
    });

    await expect(searchClubs('a', { userId: viewer.id })).rejects.toMatchObject<
      Partial<SearchServiceError>
    >({
      code: 'SEARCH_QUERY_TOO_SHORT',
      statusCode: 400,
    });
  });

  it('rejeita busca longa com erro padronizado', async () => {
    const viewer = await createTestUser();
    const longQuery = 'x'.repeat(81);

    await expect(
      searchUsers(longQuery, { userId: viewer.id }),
    ).rejects.toMatchObject<Partial<SearchServiceError>>({
      code: 'SEARCH_QUERY_TOO_LONG',
      statusCode: 400,
    });
  });

  it('busca usuarios por nome, username e bio retornando somente campos publicos', async () => {
    const viewer = await createTestUser();
    const userByName = await createTestUser({
      name: 'Marina Busca',
      email: 'marina-search-service@test.com',
      username: 'maresia',
    });
    const userByUsername = await createTestUser({
      name: 'Usuario Comum',
      email: 'username-search-service@test.com',
      username: 'desafio_total',
    });
    const userByBio = await createTestUser({
      name: 'Biografia Publica',
      email: 'bio-search-service@test.com',
      username: 'biografia-publica',
    });
    await prisma.user.update({
      where: {
        id: userByBio.id,
      },
      data: {
        bio: 'Gosta de desafios criativos em grupo',
      },
    });

    const nameResult = await searchUsers('Marina', { userId: viewer.id });
    const usernameResult = await searchUsers('desafio_total', {
      userId: viewer.id,
    });
    const bioResult = await searchUsers('criativos', { userId: viewer.id });

    expect(nameResult.items).toEqual([
      expect.objectContaining({
        id: userByName.id,
        name: 'Marina Busca',
        username: 'maresia',
        bio: null,
        avatarUrl: null,
        level: null,
        mutualCount: 0,
      }),
    ]);
    expect(usernameResult.items[0].id).toBe(userByUsername.id);
    expect(bioResult.items[0].id).toBe(userByBio.id);
    expect(nameResult.items[0]).not.toHaveProperty('email');
    expect(nameResult.items[0]).not.toHaveProperty('passwordHash');
  });

  it('retorna lista vazia quando nao ha resultados', async () => {
    const viewer = await createTestUser();

    const users = await searchUsers('semresultado', { userId: viewer.id });
    const clubs = await searchClubs('semresultado', { userId: viewer.id });

    expect(users).toEqual({
      items: [],
      nextCursor: null,
    });
    expect(clubs).toEqual({
      items: [],
      nextCursor: null,
    });
  });

  it('pagina resultados por cursor e offset', async () => {
    const viewer = await createTestUser();
    await createTestUser({
      name: 'Busca Paginada A',
      email: 'search-page-a@test.com',
    });
    await createTestUser({
      name: 'Busca Paginada B',
      email: 'search-page-b@test.com',
    });
    await createTestUser({
      name: 'Busca Paginada C',
      email: 'search-page-c@test.com',
    });

    const firstPage = await searchUsers('Busca Paginada', {
      userId: viewer.id,
      limit: 2,
    });
    const secondPage = await searchUsers('Busca Paginada', {
      userId: viewer.id,
      limit: 2,
      cursor: firstPage.nextCursor,
    });
    const offsetPage = await searchUsers('Busca Paginada', {
      userId: viewer.id,
      limit: 2,
      offset: 2,
    });

    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.nextCursor).toBe(firstPage.items[1].id);
    expect(secondPage.items).toHaveLength(1);
    expect(secondPage.nextCursor).toBeNull();
    expect(offsetPage.items.map((item) => item.id)).toEqual(
      secondPage.items.map((item) => item.id),
    );
  });

  it('filtra clubes por visibilidade, status publico e bloqueio do viewer', async () => {
    const viewer = await createTestUser();
    const owner = await createTestUser();
    const publicClub = await createTestClub({
      createdById: owner.id,
      name: 'Noite das Verdades',
      description: 'Perguntas intensas para amigos',
      slug: 'noite-das-verdades',
      tags: ['noite'],
      memberCount: 30,
    });
    await createTestClub({
      createdById: owner.id,
      name: 'Noite Privada',
      visibility: ClubVisibility.private,
      tags: ['noite'],
    });
    await createTestClub({
      createdById: owner.id,
      name: 'Noite Arquivada',
      status: ClubStatus.archived,
      tags: ['noite'],
    });
    const blockedClub = await createTestClub({
      createdById: owner.id,
      name: 'Noite Bloqueada',
      tags: ['noite'],
    });
    await addUserToClub(blockedClub.id, viewer.id, {
      status: ClubMemberStatus.blocked,
    });

    const result = await searchClubs('noite', { userId: viewer.id });

    expect(result.items).toEqual([
      expect.objectContaining({
        id: publicClub.id,
        name: 'Noite das Verdades',
        slug: 'noite-das-verdades',
        description: 'Perguntas intensas para amigos',
        iconName: 'groups',
        avatarUrl: null,
        memberCount: 30,
        tags: ['noite'],
      }),
    ]);
  });

  it('calcula mutualCount por clubes ativos em comum no schema atual', async () => {
    const viewer = await createTestUser();
    const owner = await createTestUser();
    const target = await createTestUser({
      name: 'Usuario Mutual',
      email: 'mutual-target@test.com',
    });
    const otherTarget = await createTestUser({
      name: 'Usuario Mutual Dois',
      email: 'mutual-other@test.com',
    });
    const firstClub = await createTestClub({
      createdById: owner.id,
      name: 'Mutual Clube Um',
    });
    const secondClub = await createTestClub({
      createdById: owner.id,
      name: 'Mutual Clube Dois',
    });
    const otherClub = await createTestClub({
      createdById: owner.id,
      name: 'Mutual Clube Tres',
    });

    await addUserToClub(firstClub.id, viewer.id);
    await addUserToClub(firstClub.id, target.id);
    await addUserToClub(secondClub.id, viewer.id);
    await addUserToClub(secondClub.id, target.id);
    await addUserToClub(otherClub.id, otherTarget.id);

    const result = await searchUsers('Usuario Mutual', { userId: viewer.id });

    expect(result.items).toEqual([
      expect.objectContaining({
        id: target.id,
        mutualCount: 2,
      }),
      expect.objectContaining({
        id: otherTarget.id,
        mutualCount: 0,
      }),
    ]);
  });

  it('calcula isTrending por crescimento de membros nas ultimas 48 horas', async () => {
    const now = new Date('2026-05-29T15:00:00.000Z');
    const viewer = await createTestUser();
    const owner = await createTestUser();
    const recentMemberOne = await createTestUser();
    const recentMemberTwo = await createTestUser();
    const oldMember = await createTestUser();
    const trendingClub = await createTestClub({
      createdById: owner.id,
      name: 'Clube Tendencia',
      tags: ['tendencia'],
    });
    const stableClub = await createTestClub({
      createdById: owner.id,
      name: 'Clube Estavel',
      tags: ['tendencia'],
    });

    await addUserToClub(trendingClub.id, recentMemberOne.id, {
      joinedAt: new Date('2026-05-29T10:00:00.000Z'),
    });
    await addUserToClub(trendingClub.id, recentMemberTwo.id, {
      joinedAt: new Date('2026-05-28T10:00:00.000Z'),
    });
    await addUserToClub(stableClub.id, oldMember.id, {
      joinedAt: new Date('2026-05-20T10:00:00.000Z'),
    });

    const result = await searchClubs('tendencia', {
      userId: viewer.id,
      now,
      trendingMemberGrowthThreshold: 2,
    });

    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: trendingClub.id,
          isTrending: true,
        }),
        expect.objectContaining({
          id: stableClub.id,
          isTrending: false,
        }),
      ]),
    );
  });

  it('traduz falhas de persistencia para SEARCH_UNAVAILABLE', async () => {
    const viewer = await createTestUser();
    const findManySpy = jest
      .spyOn(prisma.user, 'findMany')
      .mockRejectedValueOnce(new Error('database unavailable') as never);

    await expect(searchUsers('falha', { userId: viewer.id })).rejects.toMatchObject<
      Partial<SearchServiceError>
    >({
      code: 'SEARCH_UNAVAILABLE',
      statusCode: 503,
    });

    findManySpy.mockRestore();
  });
});
