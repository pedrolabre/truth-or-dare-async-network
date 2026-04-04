import express from 'express';
import request from 'supertest';
import daresRoutes from '../src/routes/dares.routes';
import { applyTestDatabaseHooks } from './test-db';
import { createTestUser } from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { prisma } from '../src/lib/prisma';

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use('/dares', daresRoutes);

  return app;
}

describe('POST /dares', () => {
  const app = createTestApp();

  applyTestDatabaseHooks({
    resetBeforeEach: true,
    resetAfterAll: true,
    disconnectAfterAll: true,
  });

  it('deve retornar 401 quando o token não for informado', async () => {
    const response = await request(app).post('/dares').send({
      content: 'Envie um áudio cantando o refrão da última música que ouviu.',
      targetUserId: 'target-user-id',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token não informado',
    });
  });

  it('deve retornar 401 quando o token estiver mal formatado', async () => {
    const response = await request(app)
      .post('/dares')
      .set('Authorization', 'Token abc123')
      .send({
        content: 'Envie um áudio cantando o refrão da última música que ouviu.',
        targetUserId: 'target-user-id',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token mal formatado',
    });
  });

  it('deve retornar 401 quando o token for inválido', async () => {
    const response = await request(app)
      .post('/dares')
      .set('Authorization', 'Bearer token-invalido')
      .send({
        content: 'Envie um áudio cantando o refrão da última música que ouviu.',
        targetUserId: 'target-user-id',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token inválido ou expirado',
    });
  });

  it('deve criar um dare real no banco para usuário autenticado com targetUserId persistido', async () => {
    const author = await createTestUser({
      name: 'Dare Author',
      email: 'dare-author@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Dare Target',
      email: 'dare-target@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: author.id,
      email: author.email,
      name: author.name,
    });

    const payload = {
      content: 'Grave um vídeo fazendo uma dança engraçada por 15 segundos.',
      targetUserId: targetUser.id,
    };

    const response = await request(app)
      .post('/dares')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      content: payload.content,
      authorId: author.id,
      targetUserId: targetUser.id,
      maxAttempts: expect.any(Number),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      author: {
        id: author.id,
        name: author.name,
        email: author.email,
      },
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
      },
    });

    const persistedDare = await prisma.dare.findUnique({
      where: {
        id: response.body.id,
      },
      include: {
        author: true,
        targetUser: true,
      },
    });

    expect(persistedDare).not.toBeNull();
    expect(persistedDare).toMatchObject({
      content: payload.content,
      authorId: author.id,
      targetUserId: targetUser.id,
      author: {
        id: author.id,
        name: author.name,
        email: author.email,
      },
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
      },
    });
  });

  it('deve retornar 400 quando o targetUserId não for informado', async () => {
    const author = await createTestUser({
      name: 'Dare Missing Target',
      email: 'dare-missing-target@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: author.id,
      email: author.email,
      name: author.name,
    });

    const response = await request(app)
      .post('/dares')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Faça uma imitação engraçada por 20 segundos.',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'targetUserId is required',
    });

    const daresCount = await prisma.dare.count();

    expect(daresCount).toBe(0);
  });

  it('deve retornar 400 quando o conteúdo não for informado', async () => {
    const author = await createTestUser({
      name: 'Dare Empty Content',
      email: 'dare-empty-content@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Dare Empty Content Target',
      email: 'dare-empty-content-target@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: author.id,
      email: author.email,
      name: author.name,
    });

    const response = await request(app)
      .post('/dares')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: '   ',
        targetUserId: targetUser.id,
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'content is required',
    });

    const daresCount = await prisma.dare.count();

    expect(daresCount).toBe(0);
  });
});