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
});