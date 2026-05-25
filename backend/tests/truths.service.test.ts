import {
  createTruth,
  createTruthCommentService,
} from '../src/services/truths/truths.service';
import { applyTestDatabaseHooks } from './test-db';
import { createTestUser } from '../src/test-utils/factories';
import { prisma } from '../src/lib/prisma';
import { NotificationType } from '../src/generated/prisma/client';

describe('createTruth', () => {
  applyTestDatabaseHooks();

  it('deve criar uma truth real persistida no banco', async () => {
    const author = await createTestUser({
      name: 'Service Truth Author',
      email: 'service-truth-author@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Service Truth Target',
      email: 'service-truth-target@test.com',
      password: '123456',
    });

    const result = await createTruth({
      authorId: author.id,
      targetUserId: targetUser.id,
      content: 'Qual foi a maior mentira que você já contou e ninguém descobriu?',
    });

    expect(result).toMatchObject({
      id: expect.any(String),
      content:
        'Qual foi a maior mentira que você já contou e ninguém descobriu?',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
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
        id: result.id,
      },
      include: {
        author: true,
        targetUser: true,
      },
    });

    expect(persistedTruth).not.toBeNull();
    expect(persistedTruth).toMatchObject({
      id: result.id,
      content:
        'Qual foi a maior mentira que você já contou e ninguém descobriu?',
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
    const notification = await prisma.notification.findUnique({
      where: {
        dedupeKey: `feed_truth_received:${targetUser.id}:${result.id}`,
      },
    });

    expect(notification).toMatchObject({
      userId: targetUser.id,
      actorId: author.id,
      type: NotificationType.feed_truth_received,
      deepLink: '/feed',
      referenceType: 'truth',
      referenceId: result.id,
    });
  });

  it('deve suprimir notificacao de truth quando o autor for o proprio alvo', async () => {
    const user = await createTestUser({
      name: 'Self Truth User',
      email: 'self-truth-user@test.com',
      password: '123456',
    });

    const result = await createTruth({
      authorId: user.id,
      targetUserId: user.id,
      content: 'Uma truth para mim mesmo.',
    });

    expect(result.id).toEqual(expect.any(String));
    await expect(prisma.notification.count()).resolves.toBe(0);
  });

  it('deve notificar o autor da truth quando outro usuario comentar', async () => {
    const author = await createTestUser({
      name: 'Commented Truth Author',
      email: 'commented-truth-author@test.com',
      password: '123456',
    });
    const targetUser = await createTestUser({
      name: 'Commented Truth Target',
      email: 'commented-truth-target@test.com',
      password: '123456',
    });
    const commenter = await createTestUser({
      name: 'Truth Comment Producer',
      email: 'truth-comment-producer@test.com',
      password: '123456',
    });
    const truth = await prisma.truth.create({
      data: {
        authorId: author.id,
        targetUserId: targetUser.id,
        content: 'Truth com comentario notificado.',
      },
    });

    const comment = await createTruthCommentService({
      truthId: truth.id,
      userId: commenter.id,
      text: 'Comentario que gera notificacao.',
    });

    const notification = await prisma.notification.findUnique({
      where: {
        dedupeKey: `feed_truth_comment:${author.id}:${comment.id}`,
      },
    });

    expect(notification).toMatchObject({
      userId: author.id,
      actorId: commenter.id,
      type: NotificationType.feed_truth_comment,
      referenceType: 'truth_comment',
      referenceId: comment.id,
    });
  });

  it('deve remover espaços nas extremidades do conteúdo antes de persistir', async () => {
    const author = await createTestUser({
      name: 'Trim Truth Author',
      email: 'trim-truth-author@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Trim Truth Target',
      email: 'trim-truth-target@test.com',
      password: '123456',
    });

    const result = await createTruth({
      authorId: author.id,
      targetUserId: targetUser.id,
      content: '   Qual segredo você nunca contou para ninguém?   ',
    });

    expect(result.content).toBe(
      'Qual segredo você nunca contou para ninguém?',
    );

    const persistedTruth = await prisma.truth.findUnique({
      where: {
        id: result.id,
      },
    });

    expect(persistedTruth).not.toBeNull();
    expect(persistedTruth?.content).toBe(
      'Qual segredo você nunca contou para ninguém?',
    );
    expect(persistedTruth?.targetUserId).toBe(targetUser.id);
  });

  it('deve falhar quando o authorId não for informado', async () => {
    const targetUser = await createTestUser({
      name: 'Missing Author Truth Target',
      email: 'missing-author-truth-target@test.com',
      password: '123456',
    });

    await expect(
      createTruth({
        authorId: '',
        targetUserId: targetUser.id,
        content: 'Qual foi a sua maior vergonha em público?',
      }),
    ).rejects.toThrow('Usuário autenticado não encontrado');

    const truthsCount = await prisma.truth.count();

    expect(truthsCount).toBe(0);
  });

  it('deve falhar quando o targetUserId não for informado', async () => {
    const author = await createTestUser({
      name: 'Missing Target Truth Author',
      email: 'missing-target-truth-author@test.com',
      password: '123456',
    });

    await expect(
      createTruth({
        authorId: author.id,
        targetUserId: '',
        content: 'Qual pergunta você teria medo de responder?',
      }),
    ).rejects.toThrow('Usuário alvo é obrigatório');

    const truthsCount = await prisma.truth.count();

    expect(truthsCount).toBe(0);
  });

  it('deve falhar quando o conteúdo não for informado', async () => {
    const author = await createTestUser({
      name: 'Empty Truth Author',
      email: 'empty-truth-author@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Empty Truth Target',
      email: 'empty-truth-target@test.com',
      password: '123456',
    });

    await expect(
      createTruth({
        authorId: author.id,
        targetUserId: targetUser.id,
        content: '   ',
      }),
    ).rejects.toThrow('Conteúdo é obrigatório');

    const truthsCount = await prisma.truth.count();

    expect(truthsCount).toBe(0);
  });
});
