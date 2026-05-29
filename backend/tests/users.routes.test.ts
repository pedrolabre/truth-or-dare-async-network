import express from 'express';
import request from 'supertest';
import usersRoutes from '../src/routes/users/users.routes';
import { applyTestDatabaseHooks } from './test-db';
import { prisma } from '../src/lib/prisma';
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

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use('/users', usersRoutes);

  return app;
}

describe('users.routes', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('deve listar usuários autenticado com sucesso sem retornar o próprio usuário', async () => {
    const currentUser = await createTestUser({
      name: 'Pedro Roberto',
      email: 'pedro-users-routes@test.com',
      password: '123456',
    });

    const otherUser1 = await createTestUser({
      name: 'Marina Souza',
      email: 'marina-users-routes@test.com',
      password: '123456',
    });

    const otherUser2 = await createTestUser({
      name: 'Lucas Mendes',
      email: 'lucas-users-routes@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
    });

    const response = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);

    expect(response.body.some((user: any) => user.id === currentUser.id)).toBe(
      false,
    );

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: otherUser1.id,
          name: otherUser1.name,
          email: otherUser1.email,
        }),
        expect.objectContaining({
          id: otherUser2.id,
          name: otherUser2.name,
          email: otherUser2.email,
        }),
      ]),
    );
  });

  it('deve filtrar usuários pela query', async () => {
    const currentUser = await createTestUser({
      name: 'Pedro Roberto',
      email: 'pedro-users-routes-query@test.com',
      password: '123456',
    });

    const marina = await createTestUser({
      name: 'Marina Souza',
      email: 'marina-users-routes-query@test.com',
      password: '123456',
    });

    await createTestUser({
      name: 'Lucas Mendes',
      email: 'lucas-users-routes-query@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
    });

    const response = await request(app)
      .get('/users')
      .query({ query: 'Marina' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: marina.id,
      name: marina.name,
      email: marina.email,
    });
  });

  it('deve retornar 401 quando não houver token', async () => {
    const response = await request(app).get('/users');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      error: 'Token não informado',
    });
  });

  it('GET /users/:id/public retorna perfil publico com contrato seguro', async () => {
    const user = await createTestUser({
      name: 'Perfil Publico Busca',
      email: 'perfil-publico-busca@test.com',
      username: 'perfil_publico_busca',
    });
    const owner = await createTestUser({
      name: 'Owner Perfil Publico',
      email: 'owner-perfil-publico@test.com',
    });
    const target = await createTestUser({
      name: 'Alvo Perfil Publico',
      email: 'target-perfil-publico@test.com',
    });
    await createTestTruth({
      authorId: user.id,
      targetUserId: target.id,
      content: 'Verdade publica para estatistica.',
    });
    await createTestDare({
      authorId: user.id,
      targetUserId: target.id,
      content: 'Desafio publico para estatistica.',
    });
    const club = await createTestClub({
      createdById: owner.id,
      name: 'Clube Perfil Publico',
    });
    await addUserToClub(club.id, user.id);
    await createTestClubPrompt({
      clubId: club.id,
      authorId: user.id,
      content: 'Prompt publico para estatistica.',
    });
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        bio: 'Bio publica da busca',
      },
    });

    const response = await request(app).get(`/users/${user.id}/public`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: user.id,
      name: 'Perfil Publico Busca',
      username: 'perfil_publico_busca',
      bio: 'Bio publica da busca',
      avatarUrl: null,
      level: null,
      levelLabel: 'Nivel indisponivel',
      stats: {
        createdTruthsCount: 1,
        createdDaresCount: 1,
        activePublicClubsCount: 1,
        publishedClubPromptsCount: 1,
      },
    });
    expect(response.body).not.toHaveProperty('email');
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('GET /users/:id/public retorna 404 para usuario inexistente', async () => {
    const response = await request(app).get('/users/usuario-inexistente/public');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      error: 'Usuario nao encontrado',
    });
  });
});
