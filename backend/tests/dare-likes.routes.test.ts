import express from 'express';
import request from 'supertest';
import dareLikesRoutes from '../src/routes/dare-likes.routes';
import { applyTestDatabaseHooks } from './test-db';
import { createTestUser } from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { prisma } from '../src/lib/prisma';

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use(dareLikesRoutes);

  return app;
}

describe('POST /dares/:id/like', () => {
  const app = createTestApp();

  applyTestDatabaseHooks({
    resetBeforeEach: true,
    resetAfterAll: true,
    disconnectAfterAll: true,
  });

  it('deve criar like quando o usuário ainda não curtiu o dare', async () => {
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

    const liker = await createTestUser({
      name: 'Dare Liker',
      email: 'dare-liker@test.com',
      password: '123456',
    });

    const dare = await prisma.dare.create({
      data: {
        content: 'Um desafio para curtir.',
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
      .post(`/dares/${dare.id}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      liked: true,
    });

    const persistedLike = await prisma.like.findUnique({
      where: {
        userId_targetId_targetType: {
          userId: liker.id,
          targetId: dare.id,
          targetType: 'dare',
        },
      },
    });

    expect(persistedLike).not.toBeNull();
  });

  it('deve remover like quando já estiver curtido', async () => {
    const author = await createTestUser({
      name: 'Dare Author Two',
      email: 'dare-author-two@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Dare Target Two',
      email: 'dare-target-two@test.com',
      password: '123456',
    });

    const liker = await createTestUser({
      name: 'Dare Liker Two',
      email: 'dare-liker-two@test.com',
      password: '123456',
    });

    const dare = await prisma.dare.create({
      data: {
        content: 'Um desafio já curtido.',
        authorId: author.id,
        targetUserId: targetUser.id,
      },
    });

    await prisma.like.create({
      data: {
        userId: liker.id,
        targetId: dare.id,
        targetType: 'dare',
      },
    });

    const token = generateToken({
      sub: liker.id,
      email: liker.email,
      name: liker.name,
    });

    const response = await request(app)
      .post(`/dares/${dare.id}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      liked: false,
    });

    const persistedLike = await prisma.like.findUnique({
      where: {
        userId_targetId_targetType: {
          userId: liker.id,
          targetId: dare.id,
          targetType: 'dare',
        },
      },
    });

    expect(persistedLike).toBeNull();
  });
});