import express from 'express';
import request from 'supertest';
import clubLikesRoutes from '../src/routes/club-likes.routes';
import { applyTestDatabaseHooks } from './test-db';
import { createTestUser } from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { prisma } from '../src/lib/prisma';

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use(clubLikesRoutes);

  return app;
}

describe('POST /clubs/:id/like', () => {
  const app = createTestApp();

  applyTestDatabaseHooks({
    resetBeforeEach: true,
    resetAfterAll: true,
    disconnectAfterAll: true,
  });

  it('deve criar like quando o usuário ainda não curtiu o club prompt', async () => {
    const user = await createTestUser({
      name: 'Club Creator',
      email: 'club-creator@test.com',
      password: '123456',
    });

    const liker = await createTestUser({
      name: 'Club Liker',
      email: 'club-liker@test.com',
      password: '123456',
    });

    const club = await prisma.club.create({
      data: {
        name: 'Clube Teste',
        createdById: user.id,
      },
    });

    const prompt = await prisma.clubPrompt.create({
      data: {
        clubId: club.id,
        authorId: user.id,
        type: 'truth',
        content: 'Pergunta do clube',
      },
    });

    const token = generateToken({
      sub: liker.id,
      email: liker.email,
      name: liker.name,
    });

    const response = await request(app)
      .post(`/clubs/${prompt.id}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      liked: true,
    });

    const persistedLike = await prisma.like.findUnique({
      where: {
        userId_targetId_targetType: {
          userId: liker.id,
          targetId: prompt.id,
          targetType: 'club',
        },
      },
    });

    expect(persistedLike).not.toBeNull();
  });

  it('deve remover like quando já estiver curtido', async () => {
    const user = await createTestUser({
      name: 'Club Creator Two',
      email: 'club-creator-two@test.com',
      password: '123456',
    });

    const liker = await createTestUser({
      name: 'Club Liker Two',
      email: 'club-liker-two@test.com',
      password: '123456',
    });

    const club = await prisma.club.create({
      data: {
        name: 'Clube Teste 2',
        createdById: user.id,
      },
    });

    const prompt = await prisma.clubPrompt.create({
      data: {
        clubId: club.id,
        authorId: user.id,
        type: 'dare',
        content: 'Desafio do clube',
      },
    });

    await prisma.like.create({
      data: {
        userId: liker.id,
        targetId: prompt.id,
        targetType: 'club',
      },
    });

    const token = generateToken({
      sub: liker.id,
      email: liker.email,
      name: liker.name,
    });

    const response = await request(app)
      .post(`/clubs/${prompt.id}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      liked: false,
    });

    const persistedLike = await prisma.like.findUnique({
      where: {
        userId_targetId_targetType: {
          userId: liker.id,
          targetId: prompt.id,
          targetType: 'club',
        },
      },
    });

    expect(persistedLike).toBeNull();
  });
});