import express from 'express';
import request from 'supertest';
import usersRoutes from '../src/routes/users.routes';
import { applyTestDatabaseHooks } from './test-db';
import { createTestUser, resetFeedData } from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use('/users', usersRoutes);

  return app;
}

describe('users.integration', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('fluxo completo: listar usuários autenticado', async () => {
    const currentUser = await createTestUser({
      name: 'Pedro Roberto',
      email: 'pedro-users-integration@test.com',
      password: '123456',
    });

    const otherUser1 = await createTestUser({
      name: 'Marina Souza',
      email: 'marina-users-integration@test.com',
      password: '123456',
    });

    const otherUser2 = await createTestUser({
      name: 'Lucas Mendes',
      email: 'lucas-users-integration@test.com',
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

    const users = response.body;

    expect(Array.isArray(users)).toBe(true);
    expect(users).toHaveLength(2);

    expect(users.some((u: any) => u.id === currentUser.id)).toBe(false);

    expect(users).toEqual(
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

  it('fluxo completo: busca com query', async () => {
    const currentUser = await createTestUser({
      name: 'Pedro Roberto',
      email: 'pedro-users-integration-query@test.com',
      password: '123456',
    });

    const marina = await createTestUser({
      name: 'Marina Souza',
      email: 'marina-users-integration-query@test.com',
      password: '123456',
    });

    await createTestUser({
      name: 'Lucas Mendes',
      email: 'lucas-users-integration-query@test.com',
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

    const users = response.body;

    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({
      id: marina.id,
      name: marina.name,
      email: marina.email,
    });
  });

  it('fluxo completo: não retorna usuários inexistentes', async () => {
    const currentUser = await createTestUser({
      name: 'Pedro Roberto',
      email: 'pedro-users-integration-empty@test.com',
      password: '123456',
    });

    await createTestUser({
      name: 'Marina Souza',
      email: 'marina-users-integration-empty@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
    });

    const response = await request(app)
      .get('/users')
      .query({ query: 'XYZ_INEXISTENTE' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});