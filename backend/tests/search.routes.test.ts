import express from 'express';
import request from 'supertest';
import {
  ClubMemberStatus,
  ClubStatus,
  ClubVisibility,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import searchRoutes from '../src/routes/search/search.routes';
import {
  addUserToClub,
  createTestClub,
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

  it('exige autenticacao nos endpoints de busca', async () => {
    const usersResponse = await request(app)
      .get('/search/users')
      .query({ query: 'rota' });
    const clubsResponse = await request(app)
      .get('/search/clubs')
      .query({ query: 'rota' });
    const allResponse = await request(app).get('/search').query({
      query: 'rota',
    });

    expect(usersResponse.status).toBe(401);
    expect(clubsResponse.status).toBe(401);
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
    });
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
