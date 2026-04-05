import express from 'express';
import request from 'supertest';
import truthLikesRoutes from '../src/routes/truth-likes.routes';
import { applyTestDatabaseHooks } from './test-db';
import { createTestUser } from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { prisma } from '../src/lib/prisma';

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use(truthLikesRoutes);

  return app;
}

describe('POST /truths/:id/like', () => {
  const app = createTestApp();

  applyTestDatabaseHooks({
    resetBeforeEach: true,
    resetAfterAll: true,
    disconnectAfterAll: true,
  });

  it('deve retornar 401 quando o token não for informado', async () => {
    const response = await request(app).post('/truths/qualquer-id/like');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token não informado',
    });
  });

  it('deve retornar 401 quando o token estiver mal formatado', async () => {
    const response = await request(app)
      .post('/truths/qualquer-id/like')
      .set('Authorization', 'Token abc123');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token mal formatado',
    });
  });

  it('deve retornar 401 quando o token for inválido', async () => {
    const response = await request(app)
      .post('/truths/qualquer-id/like')
      .set('Authorization', 'Bearer token-invalido');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token inválido ou expirado',
    });
  });

  it('deve criar like quando o usuário ainda não curtiu a truth', async () => {
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

    const liker = await createTestUser({
      name: 'Truth Liker',
      email: 'truth-liker@test.com',
      password: '123456',
    });

    const truth = await prisma.truth.create({
      data: {
        content: 'Uma truth para receber like.',
        authorId: author.id,
        targetUserId: targetUser.id,
      },
    });

    const token = generateToken({
      sub: liker.id,
      email: liker.email,
      name: liker.name,
    });

    const response = await request(app)
      .post(`/truths/${truth.id}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      liked: true,
    });

    const persistedLike = await prisma.like.findUnique({
      where: {
        userId_targetId_targetType: {
          userId: liker.id,
          targetId: truth.id,
          targetType: 'truth',
        },
      },
    });

    expect(persistedLike).not.toBeNull();
    expect(persistedLike).toMatchObject({
      userId: liker.id,
      targetId: truth.id,
      targetType: 'truth',
    });
  });

  it('deve remover like quando o usuário já curtiu a truth', async () => {
    const author = await createTestUser({
      name: 'Truth Author Two',
      email: 'truth-author-two@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Truth Target Two',
      email: 'truth-target-two@test.com',
      password: '123456',
    });

    const liker = await createTestUser({
      name: 'Truth Liker Two',
      email: 'truth-liker-two@test.com',
      password: '123456',
    });

    const truth = await prisma.truth.create({
      data: {
        content: 'Uma truth já curtida.',
        authorId: author.id,
        targetUserId: targetUser.id,
      },
    });

    await prisma.like.create({
      data: {
        userId: liker.id,
        targetId: truth.id,
        targetType: 'truth',
      },
    });

    const token = generateToken({
      sub: liker.id,
      email: liker.email,
      name: liker.name,
    });

    const response = await request(app)
      .post(`/truths/${truth.id}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      liked: false,
    });

    const persistedLike = await prisma.like.findUnique({
      where: {
        userId_targetId_targetType: {
          userId: liker.id,
          targetId: truth.id,
          targetType: 'truth',
        },
      },
    });

    expect(persistedLike).toBeNull();
  });
});