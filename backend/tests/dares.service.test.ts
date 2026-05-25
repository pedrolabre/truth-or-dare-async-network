import { createDare } from '../src/services/dares/dares.service';
import { applyTestDatabaseHooks } from './test-db';
import { createTestUser } from '../src/test-utils/factories';
import { prisma } from '../src/lib/prisma';
import { NotificationType } from '../src/generated/prisma/client';

describe('createDare', () => {
  applyTestDatabaseHooks();

  it('deve criar um dare real persistido no banco', async () => {
    const user = await createTestUser({
      name: 'Service Dare Author',
      email: 'service-dare-author@test.com',
      password: '123456',
    });

    const result = await createDare({
      authorId: user.id,
      targetUserId: user.id,
      content: 'Envie um áudio cantando o refrão da última música que você ouviu.',
    });

    expect(result).toMatchObject({
      id: expect.any(String),
      content: 'Envie um áudio cantando o refrão da última música que você ouviu.',
      authorId: user.id,
      targetUserId: user.id,
      maxAttempts: expect.any(Number),
      attemptsUsed: 0,
      expiresAt: expect.any(Date),
      completedAt: null,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });

    const persistedDare = await prisma.dare.findUnique({
      where: {
        id: result.id,
      },
    });

    expect(persistedDare).not.toBeNull();
    expect(persistedDare).toMatchObject({
      id: result.id,
      content: 'Envie um áudio cantando o refrão da última música que você ouviu.',
      authorId: user.id,
      targetUserId: user.id,
      attemptsUsed: 0,
      completedAt: null,
    });

    await expect(prisma.notification.count()).resolves.toBe(0);
  });

  it('deve notificar o usuario alvo quando recebe um dare de outro autor', async () => {
    const author = await createTestUser({
      name: 'Dare Notification Author',
      email: 'dare-notification-author@test.com',
      password: '123456',
    });
    const targetUser = await createTestUser({
      name: 'Dare Notification Target',
      email: 'dare-notification-target@test.com',
      password: '123456',
    });

    const result = await createDare({
      authorId: author.id,
      targetUserId: targetUser.id,
      content: 'Grave um video fazendo uma danca rapida.',
    });

    const notification = await prisma.notification.findUnique({
      where: {
        dedupeKey: `feed_dare_received:${targetUser.id}:${result.id}`,
      },
    });

    expect(notification).toMatchObject({
      userId: targetUser.id,
      actorId: author.id,
      type: NotificationType.feed_dare_received,
      deepLink: '/feed',
      referenceType: 'dare',
      referenceId: result.id,
    });
  });

  it('deve remover espaços nas extremidades do conteúdo antes de persistir', async () => {
    const user = await createTestUser({
      name: 'Trim Dare Author',
      email: 'trim-dare-author@test.com',
      password: '123456',
    });

    const result = await createDare({
      authorId: user.id,
      targetUserId: user.id,
      content: '   Grave um vídeo fazendo uma careta engraçada.   ',
    });

    expect(result.content).toBe('Grave um vídeo fazendo uma careta engraçada.');

    const persistedDare = await prisma.dare.findUnique({
      where: {
        id: result.id,
      },
    });

    expect(persistedDare).not.toBeNull();
    expect(persistedDare?.content).toBe(
      'Grave um vídeo fazendo uma careta engraçada.',
    );
  });

  it('deve falhar quando o authorId não for informado', async () => {
    await expect(
      createDare({
        authorId: '',
        targetUserId: 'any-id',
        content: 'Imite um professor famoso por 30 segundos.',
      }),
    ).rejects.toThrow('authorId is required');

    const daresCount = await prisma.dare.count();

    expect(daresCount).toBe(0);
  });

  it('deve falhar quando o conteúdo não for informado', async () => {
    const user = await createTestUser({
      name: 'Empty Dare Author',
      email: 'empty-dare-author@test.com',
      password: '123456',
    });

    await expect(
      createDare({
        authorId: user.id,
        targetUserId: user.id,
        content: '   ',
      }),
    ).rejects.toThrow('content is required');

    const daresCount = await prisma.dare.count();

    expect(daresCount).toBe(0);
  });
});
