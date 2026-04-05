import { createDare } from '../src/services/dares.service';
import { applyTestDatabaseHooks } from './test-db';
import { createTestUser } from '../src/test-utils/factories';
import { prisma } from '../src/lib/prisma';

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