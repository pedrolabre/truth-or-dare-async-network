import express from 'express';
import request from 'supertest';
import {
  ClubMemberStatus,
  ClubPromptType,
  ClubStatus,
  ClubVisibility,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import searchRoutes from '../src/routes/search/search.routes';
import {
  addUserToClub,
  createTestClub,
  createTestClubPrompt,
  createTestDare,
  createTestTruth,
  createTestUser,
  resetFeedData,
} from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { applyTestDatabaseHooks } from './test-db';

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use('/search', searchRoutes);

  return app;
}

function authTokenFor(user: { id: string; email: string; name: string }) {
  return generateToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });
}

describe('search.routes', () => {
  const app = createTestApp();
  let consoleInfoSpy: jest.SpyInstance;

  applyTestDatabaseHooks({
    resetBeforeEach: false,
    resetAfterAll: false,
    disconnectAfterAll: false,
  });

  beforeEach(async () => {
    consoleInfoSpy = jest
      .spyOn(console, 'info')
      .mockImplementation(() => undefined);
    await resetFeedData({ deleteUsers: true });
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
  });

  afterAll(async () => {
    await resetFeedData({ deleteUsers: true });
    await prisma.$disconnect();
  });

  it('exige autenticacao nos endpoints de busca', async () => {
    const usersResponse = await request(app)
      .get('/search/users')
      .query({ query: 'rota' });
    const clubsResponse = await request(app)
      .get('/search/clubs')
      .query({ query: 'rota' });
    const contentResponse = await request(app)
      .get('/search/content')
      .query({ query: 'rota' });
    const recommendedResponse = await request(app).get(
      '/search/recommended/users',
    );
    const trendingResponse = await request(app).get('/search/trending/clubs');
    const allResponse = await request(app).get('/search').query({
      query: 'rota',
    });

    expect(usersResponse.status).toBe(401);
    expect(clubsResponse.status).toBe(401);
    expect(contentResponse.status).toBe(401);
    expect(recommendedResponse.status).toBe(401);
    expect(trendingResponse.status).toBe(401);
    expect(allResponse.status).toBe(401);
  });

  it('retorna erro padronizado para query curta', async () => {
    const viewer = await createTestUser();

    const response = await request(app)
      .get('/search/users')
      .query({ query: 'a' })
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'SEARCH_QUERY_TOO_SHORT',
      error: expect.any(String),
    });
  });

  it('retorna erro padronizado para query longa', async () => {
    const viewer = await createTestUser();

    const response = await request(app)
      .get('/search/clubs')
      .query({ query: 'x'.repeat(81) })
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'SEARCH_QUERY_TOO_LONG',
      error: expect.any(String),
    });
  });

  it('GET /search/users retorna usuarios com contrato publico', async () => {
    const viewer = await createTestUser();
    const target = await createTestUser({
      name: 'Marina Busca Rota',
      email: 'marina-search-routes@test.com',
      username: 'marina_rota',
    });
    await prisma.user.update({
      where: {
        id: target.id,
      },
      data: {
        bio: 'Participa de desafios da busca',
      },
    });

    const response = await request(app)
      .get('/search/users')
      .query({ query: 'Marina Busca' })
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [
        expect.objectContaining({
          id: target.id,
          name: 'Marina Busca Rota',
          username: 'marina_rota',
          bio: 'Participa de desafios da busca',
          avatarUrl: null,
          level: null,
          mutualCount: 0,
        }),
      ],
      nextCursor: null,
    });
    expect(response.body.items[0]).not.toHaveProperty('email');
    expect(response.body.items[0]).not.toHaveProperty('passwordHash');
  });

  it('GET /search/users retorna lista vazia sem resultados', async () => {
    const viewer = await createTestUser();

    const response = await request(app)
      .get('/search/users')
      .query({ query: 'semresultado' })
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [],
      nextCursor: null,
    });
  });

  it('GET /search/users pagina por cursor', async () => {
    const viewer = await createTestUser();
    await createTestUser({
      name: 'Busca Rota Usuario A',
      email: 'search-route-user-a@test.com',
    });
    await createTestUser({
      name: 'Busca Rota Usuario B',
      email: 'search-route-user-b@test.com',
    });
    await createTestUser({
      name: 'Busca Rota Usuario C',
      email: 'search-route-user-c@test.com',
    });

    const token = authTokenFor(viewer);
    const firstPage = await request(app)
      .get('/search/users')
      .query({ query: 'Busca Rota Usuario', limit: 2 })
      .set('Authorization', `Bearer ${token}`);
    const secondPage = await request(app)
      .get('/search/users')
      .query({
        query: 'Busca Rota Usuario',
        limit: 2,
        cursor: firstPage.body.nextCursor,
      })
      .set('Authorization', `Bearer ${token}`);

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.items).toHaveLength(2);
    expect(firstPage.body.nextCursor).toBe(firstPage.body.items[1].id);
    expect(secondPage.status).toBe(200);
    expect(secondPage.body.items).toHaveLength(1);
    expect(secondPage.body.nextCursor).toBeNull();
  });

  it('GET /search/clubs retorna clubes com contrato publico', async () => {
    const viewer = await createTestUser();
    const owner = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      name: 'Noite das Rotas',
      description: 'Clube para validar busca em rota',
      slug: 'noite-das-rotas',
      tags: ['noite'],
      memberCount: 24,
    });

    const response = await request(app)
      .get('/search/clubs')
      .query({ query: 'noite' })
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [
        expect.objectContaining({
          id: club.id,
          name: 'Noite das Rotas',
          slug: 'noite-das-rotas',
          description: 'Clube para validar busca em rota',
          iconName: 'groups',
          avatarUrl: null,
          memberCount: 24,
          isTrending: false,
          tags: ['noite'],
        }),
      ],
      nextCursor: null,
    });
  });

  it('GET /search/clubs retorna lista vazia sem resultados', async () => {
    const viewer = await createTestUser();

    const response = await request(app)
      .get('/search/clubs')
      .query({ query: 'semresultado' })
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [],
      nextCursor: null,
    });
  });

  it('GET /search/clubs pagina por cursor', async () => {
    const viewer = await createTestUser();
    const owner = await createTestUser();
    await createTestClub({
      createdById: owner.id,
      name: 'Clube Paginado A',
      tags: ['paginado'],
      memberCount: 30,
    });
    await createTestClub({
      createdById: owner.id,
      name: 'Clube Paginado B',
      tags: ['paginado'],
      memberCount: 20,
    });
    await createTestClub({
      createdById: owner.id,
      name: 'Clube Paginado C',
      tags: ['paginado'],
      memberCount: 10,
    });

    const token = authTokenFor(viewer);
    const firstPage = await request(app)
      .get('/search/clubs')
      .query({ query: 'paginado', limit: 2 })
      .set('Authorization', `Bearer ${token}`);
    const secondPage = await request(app)
      .get('/search/clubs')
      .query({
        query: 'paginado',
        limit: 2,
        cursor: firstPage.body.nextCursor,
      })
      .set('Authorization', `Bearer ${token}`);

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.items).toHaveLength(2);
    expect(firstPage.body.nextCursor).toBe(firstPage.body.items[1].id);
    expect(secondPage.status).toBe(200);
    expect(secondPage.body.items).toHaveLength(1);
    expect(secondPage.body.nextCursor).toBeNull();
  });

  it('GET /search/clubs aplica filtros de visibilidade e status', async () => {
    const viewer = await createTestUser();
    const owner = await createTestUser();
    const publicClub = await createTestClub({
      createdById: owner.id,
      name: 'Visibilidade Busca Publica',
      tags: ['visibilidade'],
    });
    await createTestClub({
      createdById: owner.id,
      name: 'Visibilidade Busca Privada',
      visibility: ClubVisibility.private,
      tags: ['visibilidade'],
    });
    await createTestClub({
      createdById: owner.id,
      name: 'Visibilidade Busca Arquivada',
      status: ClubStatus.archived,
      tags: ['visibilidade'],
    });
    const blockedClub = await createTestClub({
      createdById: owner.id,
      name: 'Visibilidade Busca Bloqueada',
      tags: ['visibilidade'],
    });
    await addUserToClub(blockedClub.id, viewer.id, {
      status: ClubMemberStatus.blocked,
    });

    const response = await request(app)
      .get('/search/clubs')
      .query({ query: 'visibilidade' })
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([
      expect.objectContaining({
        id: publicClub.id,
      }),
    ]);
  });

  it('GET /search retorna payload unificado com paginacao por categoria', async () => {
    const viewer = await createTestUser();
    const owner = await createTestUser();
    const user = await createTestUser({
      name: 'Resultado Unificado Usuario',
      email: 'search-route-unified-user@test.com',
    });
    const club = await createTestClub({
      createdById: owner.id,
      name: 'Resultado Unificado Clube',
      tags: ['unificado'],
    });
    const truth = await createTestTruth({
      authorId: owner.id,
      targetUserId: viewer.id,
      content: 'Resultado unificado conteudo',
    });

    const response = await request(app)
      .get('/search')
      .query({ query: 'unificado', limit: 3 })
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      users: {
        items: [
          expect.objectContaining({
            id: user.id,
          }),
        ],
        nextCursor: null,
      },
      clubs: {
        items: [
          expect.objectContaining({
            id: club.id,
          }),
        ],
        nextCursor: null,
      },
      content: {
        items: [
          expect.objectContaining({
            id: `truth:${truth.id}`,
            sourceType: 'truth',
          }),
        ],
        nextCursor: null,
      },
    });
  });

  it('GET /search/users aplica filtros de nivel e onlineOnly', async () => {
    const now = new Date();
    const viewer = await createTestUser();
    const owner = await createTestUser();
    const onlineUser = await createTestUser({
      name: 'Filtro Rota Usuario Online',
      email: 'search-route-filter-online@test.com',
    });
    const lowLevelUser = await createTestUser({
      name: 'Filtro Rota Usuario Baixo',
      email: 'search-route-filter-low@test.com',
    });
    const club = await createTestClub({
      createdById: owner.id,
      name: 'Filtro Rota Online Clube',
    });

    await addUserToClub(club.id, onlineUser.id, {
      lastSeenAt: now,
    });
    await createTestTruth({
      authorId: onlineUser.id,
      targetUserId: viewer.id,
      content: 'Atividade publica um.',
    });
    await createTestDare({
      authorId: onlineUser.id,
      targetUserId: viewer.id,
      content: 'Atividade publica dois.',
    });
    await createTestTruth({
      authorId: lowLevelUser.id,
      targetUserId: viewer.id,
      content: 'Atividade insuficiente.',
    });

    const response = await request(app)
      .get('/search/users')
      .query({
        query: 'Filtro Rota Usuario',
        minLevel: 2,
        onlineOnly: 'true',
      })
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([
      expect.objectContaining({
        id: onlineUser.id,
        level: 2,
        isOnline: true,
      }),
    ]);
  });

  it('GET /search/clubs aplica filtros de visibilidade publica e tag', async () => {
    const viewer = await createTestUser();
    const owner = await createTestUser();
    const taggedClub = await createTestClub({
      createdById: owner.id,
      name: 'Filtro Rota Clube Noite',
      tags: ['noite'],
    });
    await createTestClub({
      createdById: owner.id,
      name: 'Filtro Rota Clube Escola',
      tags: ['escola'],
    });
    await createTestClub({
      createdById: owner.id,
      name: 'Filtro Rota Clube Privado',
      visibility: ClubVisibility.private,
      tags: ['noite'],
    });

    const response = await request(app)
      .get('/search/clubs')
      .query({
        query: 'Filtro Rota Clube',
        clubVisibility: 'public',
        clubTag: 'noite',
      })
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([
      expect.objectContaining({
        id: taggedClub.id,
        tags: ['noite'],
      }),
    ]);
  });

  it('GET /search/content retorna conteudo permitido com contrato publico', async () => {
    const viewer = await createTestUser();
    const owner = await createTestUser({
      name: 'Autora Rota Conteudo',
      email: 'search-route-content-author@test.com',
    });
    const truth = await createTestTruth({
      authorId: owner.id,
      targetUserId: viewer.id,
      content: 'Conteudo rota verdade encontrado.',
    });
    const club = await createTestClub({
      createdById: owner.id,
      name: 'Clube Rota Conteudo',
      visibility: ClubVisibility.public,
    });
    const prompt = await createTestClubPrompt({
      clubId: club.id,
      authorId: owner.id,
      type: ClubPromptType.dare,
      content: 'Conteudo rota desafio de clube.',
    });
    await prisma.clubPrompt.update({
      where: {
        id: prompt.id,
      },
      data: {
        isMembersOnly: false,
      },
    });

    const response = await request(app)
      .get('/search/content')
      .query({ query: 'conteudo rota', limit: 10 })
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: `truth:${truth.id}`,
          sourceType: 'truth',
          contentType: 'truth',
          parentId: truth.id,
          clubId: null,
          badgeLabel: 'Verdade',
          authorName: 'Autora Rota Conteudo',
          route: 'feed-comments',
        }),
        expect.objectContaining({
          id: `club_prompt:${prompt.id}`,
          sourceType: 'club_prompt',
          contentType: 'dare',
          clubId: club.id,
          clubName: 'Clube Rota Conteudo',
          route: 'club-detail',
        }),
      ]),
    );
    expect(response.body.items[0]).not.toHaveProperty('email');
    expect(response.body.items[0]).not.toHaveProperty('passwordHash');
  });

  it('GET /search/content retorna vazio sem resultados', async () => {
    const viewer = await createTestUser();

    const response = await request(app)
      .get('/search/content')
      .query({ query: 'semconteudo' })
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [],
      nextCursor: null,
    });
  });

  it('GET /search/content exclui conteudo privado, removido e indisponivel', async () => {
    const now = new Date();
    const viewer = await createTestUser();
    const owner = await createTestUser();
    const publicClub = await createTestClub({
      createdById: owner.id,
      name: 'Conteudo Permitido Rota',
      visibility: ClubVisibility.public,
    });
    const visiblePrompt = await createTestClubPrompt({
      clubId: publicClub.id,
      authorId: owner.id,
      content: 'Filtro rota conteudo permitido.',
    });
    await prisma.clubPrompt.update({
      where: {
        id: visiblePrompt.id,
      },
      data: {
        isMembersOnly: false,
      },
    });
    const privateClub = await createTestClub({
      createdById: owner.id,
      name: 'Conteudo Privado Rota',
      visibility: ClubVisibility.private,
    });
    await createTestClubPrompt({
      clubId: privateClub.id,
      authorId: owner.id,
      content: 'Filtro rota conteudo privado.',
    });
    const removedPrompt = await createTestClubPrompt({
      clubId: publicClub.id,
      authorId: owner.id,
      content: 'Filtro rota conteudo removido.',
    });
    await prisma.clubPrompt.update({
      where: {
        id: removedPrompt.id,
      },
      data: {
        removedAt: now,
      },
    });
    await createTestDare({
      authorId: owner.id,
      targetUserId: viewer.id,
      content: 'Filtro rota conteudo expirado.',
      expiresAt: new Date(now.getTime() - 60_000),
    });

    const response = await request(app)
      .get('/search/content')
      .query({ query: 'filtro rota conteudo', limit: 10 })
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([
      expect.objectContaining({
        id: `club_prompt:${visiblePrompt.id}`,
      }),
    ]);
  });

  it('registra logs estruturados seguros para buscas por tipo sem expor termo bruto ou dados privados', async () => {
    const viewer = await createTestUser({
      email: 'viewer-log-seguro@test.com',
    });
    const owner = await createTestUser({
      email: 'owner-log-seguro@test.com',
    });
    await createTestUser({
      name: 'Log Seguro Usuario',
      email: 'private-log-user-secret@test.com',
      username: 'log_seguro_usuario',
    });
    await createTestClub({
      createdById: owner.id,
      name: 'Log Seguro Clube',
      description: 'Clube para observabilidade segura',
      tags: ['observabilidade'],
    });

    const token = authTokenFor(viewer);

    await request(app)
      .get('/search/users')
      .query({ query: 'Log Seguro', limit: 1 })
      .set('Authorization', `Bearer ${token}`);
    await request(app)
      .get('/search/clubs')
      .query({ query: 'observabilidade', limit: 1 })
      .set('Authorization', `Bearer ${token}`);
    await request(app)
      .get('/search')
      .query({ query: 'Log Seguro Usuario', limit: 1 })
      .set('Authorization', `Bearer ${token}`);

    const logs = consoleInfoSpy.mock.calls
      .map(([payload]) => payload)
      .filter(
        (payload) =>
          typeof payload === 'object' &&
          payload !== null &&
          (payload as { event?: string }).event === 'search.query_executed',
      );

    expect(logs).toHaveLength(3);
    expect(logs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'search.query_executed',
          searchType: 'users',
          userId: viewer.id,
          queryLength: 'Log Seguro'.length,
          limit: 1,
          cursorPresent: false,
          resultCount: 1,
          nextCursorPresent: false,
          durationMs: expect.any(Number),
        }),
        expect.objectContaining({
          event: 'search.query_executed',
          searchType: 'clubs',
          userId: viewer.id,
          queryLength: 'observabilidade'.length,
          limit: 1,
          cursorPresent: false,
          resultCount: 1,
          nextCursorPresent: false,
          durationMs: expect.any(Number),
        }),
        expect.objectContaining({
          event: 'search.query_executed',
          searchType: 'unified',
          userId: viewer.id,
          queryLength: 'Log Seguro Usuario'.length,
          limit: 1,
          cursorPresent: false,
          resultCount: 1,
          usersResultCount: 1,
          clubsResultCount: 0,
          nextCursorPresent: false,
          durationMs: expect.any(Number),
        }),
      ]),
    );

    const serializedLogs = JSON.stringify(logs);

    expect(serializedLogs).not.toContain('Log Seguro');
    expect(serializedLogs).not.toContain('observabilidade');
    expect(serializedLogs).not.toContain('private-log-user-secret@test.com');
    expect(serializedLogs).not.toContain('viewer-log-seguro@test.com');
    expect(serializedLogs).not.toContain('passwordHash');
    expect(serializedLogs).not.toContain('Authorization');
    expect(serializedLogs).not.toContain(token);
  });

  it('GET /search/recommended/users retorna recomendados com contrato publico', async () => {
    const viewer = await createTestUser();
    const owner = await createTestUser();
    const recommended = await createTestUser({
      name: 'Recomendada Rota Busca',
      email: 'recommended-search-routes@test.com',
      username: 'recomendada_rota',
    });
    await prisma.user.update({
      where: {
        id: recommended.id,
      },
      data: {
        bio: 'Perfil publico recomendado pela busca',
      },
    });
    const sharedClub = await createTestClub({
      createdById: owner.id,
      name: 'Recomendacao Rota Clube',
    });

    await addUserToClub(sharedClub.id, viewer.id);
    await addUserToClub(sharedClub.id, recommended.id);

    const response = await request(app)
      .get('/search/recommended/users')
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toEqual([
      expect.objectContaining({
        id: recommended.id,
        name: 'Recomendada Rota Busca',
        username: 'recomendada_rota',
        bio: 'Perfil publico recomendado pela busca',
        avatarUrl: null,
        level: null,
        mutualCount: 1,
      }),
    ]);
    expect(response.body[0]).not.toHaveProperty('email');
    expect(response.body[0]).not.toHaveProperty('passwordHash');
  });

  it('GET /search/recommended/users retorna array vazio estavel sem dados suficientes', async () => {
    const viewer = await createTestUser();

    const response = await request(app)
      .get('/search/recommended/users')
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('GET /search/trending/clubs retorna clubes publicos ativos em alta', async () => {
    const viewer = await createTestUser();
    const owner = await createTestUser();
    const recentMember = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      name: 'Alta Busca Rotas',
      description: 'Clube publico em alta para rota',
      tags: ['alta-rota'],
      memberCount: 5,
    });

    await addUserToClub(club.id, recentMember.id, {
      joinedAt: new Date(),
    });
    await createTestClubPrompt({
      clubId: club.id,
      authorId: owner.id,
      content: 'Prompt recente para rota em alta.',
    });
    await prisma.club.update({
      where: {
        id: club.id,
      },
      data: {
        promptCount: 1,
        lastActivityAt: new Date(),
      },
    });

    const response = await request(app)
      .get('/search/trending/clubs')
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toEqual([
      expect.objectContaining({
        id: club.id,
        name: 'Alta Busca Rotas',
        slug: club.slug,
        description: 'Clube publico em alta para rota',
        iconName: 'groups',
        avatarUrl: null,
        memberCount: 5,
        isTrending: true,
        tags: ['alta-rota'],
      }),
    ]);
  });

  it('GET /search/trending/clubs nao retorna clubes privados, inativos ou bloqueados para o viewer', async () => {
    const viewer = await createTestUser();
    const owner = await createTestUser();
    const recentMember = await createTestUser();
    const publicClub = await createTestClub({
      createdById: owner.id,
      name: 'Alta Visivel Busca',
      tags: ['alta-filtro'],
    });
    const privateClub = await createTestClub({
      createdById: owner.id,
      name: 'Alta Privada Busca',
      visibility: ClubVisibility.private,
      tags: ['alta-filtro'],
    });
    const archivedClub = await createTestClub({
      createdById: owner.id,
      name: 'Alta Arquivada Busca',
      status: ClubStatus.archived,
      tags: ['alta-filtro'],
    });
    const blockedClub = await createTestClub({
      createdById: owner.id,
      name: 'Alta Bloqueada Busca',
      tags: ['alta-filtro'],
    });

    for (const club of [publicClub, privateClub, archivedClub, blockedClub]) {
      await addUserToClub(club.id, recentMember.id, {
        joinedAt: new Date(),
      });
      await prisma.club.update({
        where: {
          id: club.id,
        },
        data: {
          lastActivityAt: new Date(),
        },
      });
    }
    await addUserToClub(blockedClub.id, viewer.id, {
      status: ClubMemberStatus.blocked,
    });

    const response = await request(app)
      .get('/search/trending/clubs')
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      expect.objectContaining({
        id: publicClub.id,
      }),
    ]);
  });

  it('GET /search/trending/clubs retorna array vazio estavel sem clubes elegiveis', async () => {
    const viewer = await createTestUser();
    const owner = await createTestUser();
    await createTestClub({
      createdById: owner.id,
      name: 'Clube Sem Alta Rota',
    });

    const response = await request(app)
      .get('/search/trending/clubs')
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('traduz erro do servico para resposta HTTP padronizada', async () => {
    const viewer = await createTestUser();
    const findManySpy = jest
      .spyOn(prisma.user, 'findMany')
      .mockRejectedValueOnce(new Error('database unavailable') as never);

    const response = await request(app)
      .get('/search/users')
      .query({ query: 'falha' })
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      code: 'SEARCH_UNAVAILABLE',
      error: expect.any(String),
    });

    findManySpy.mockRestore();
  });
});
