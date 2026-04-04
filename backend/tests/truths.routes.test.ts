import express from 'express';
import request from 'supertest';
import truthsRoutes from '../src/routes/truths.routes';
import { applyTestDatabaseHooks } from './test-db';
import { createTestUser } from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { prisma } from '../src/lib/prisma';

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use('/truths', truthsRoutes);

  return app;
}

describe('POST /truths', () => {
  const app = createTestApp();

  applyTestDatabaseHooks({
    resetBeforeEach: true,
    resetAfterAll: true,
    disconnectAfterAll: true,
  });

  it('deve retornar 401 quando o token não for informado', async () => {
    const response = await request(app).post('/truths').send({
      content: 'Qual foi a maior loucura que você já fez por amor?',
      targetUserId: 'target-user-id',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token não informado',
    });
  });

  it('deve retornar 401 quando o token estiver mal formatado', async () => {
    const response = await request(app)
      .post('/truths')
      .set('Authorization', 'Token abc123')
      .send({
        content: 'Qual foi a maior loucura que você já fez por amor?',
        targetUserId: 'target-user-id',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token mal formatado',
    });
  });

  it('deve retornar 401 quando o token for inválido', async () => {
    const response = await request(app)
      .post('/truths')
      .set('Authorization', 'Bearer token-invalido')
      .send({
        content: 'Qual foi a maior loucura que você já fez por amor?',
        targetUserId: 'target-user-id',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token inválido ou expirado',
    });
  });

  it('deve criar uma truth real no banco para usuário autenticado com targetUserId persistido', async () => {
    const author = await createTestUser({
      name: 'Truth Author',
      email: 'truth-author@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Truth Target',
      email: 'truth-target@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: author.id,
      email: author.email,
      name: author.name,
    });

    const payload = {
      content: 'Qual foi a coisa mais vergonhosa que você já fez escondido?',
      targetUserId: targetUser.id,
    };

    const response = await request(app)
      .post('/truths')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      content: payload.content,
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

    const persistedTruth = await prisma.truth.findUnique({
      where: {
        id: response.body.id,
      },
      include: {
        author: true,
        targetUser: true,
      },
    });

    expect(persistedTruth).not.toBeNull();
    expect(persistedTruth).toMatchObject({
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
      name: 'Truth Missing Target',
      email: 'truth-missing-target@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: author.id,
      email: author.email,
      name: author.name,
    });

    const response = await request(app)
      .post('/truths')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Qual segredo você nunca contou para ninguém?',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Usuário alvo é obrigatório',
    });

    const truthsCount = await prisma.truth.count();

    expect(truthsCount).toBe(0);
  });

  it('deve retornar 400 quando o conteúdo não for informado', async () => {
    const author = await createTestUser({
      name: 'Truth Empty Content',
      email: 'truth-empty-content@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Truth Empty Content Target',
      email: 'truth-empty-content-target@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: author.id,
      email: author.email,
      name: author.name,
    });

    const response = await request(app)
      .post('/truths')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: '   ',
        targetUserId: targetUser.id,
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Conteúdo é obrigatório',
    });

    const truthsCount = await prisma.truth.count();

    expect(truthsCount).toBe(0);
  });
});