import { createTruth } from '../src/services/truths.service';
import { applyTestDatabaseHooks } from './test-db';
import { createTestUser } from '../src/test-utils/factories';
import { prisma } from '../src/lib/prisma';

describe('createTruth', () => {
  applyTestDatabaseHooks();

  it('deve criar uma truth real persistida no banco', async () => {
    const user = await createTestUser({
      name: 'Service Truth Author',
      email: 'service-truth-author@test.com',
      password: '123456',
    });

    const result = await createTruth({
      authorId: user.id,
      content: 'Qual foi a maior mentira que você já contou e ninguém descobriu?',
    });

    expect(result).toMatchObject({
      id: expect.any(String),
      content:
        'Qual foi a maior mentira que você já contou e ninguém descobriu?',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      author: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    const persistedTruth = await prisma.truth.findUnique({
      where: {
        id: result.id,
      },
      include: {
        author: true,
      },
    });

    expect(persistedTruth).not.toBeNull();
    expect(persistedTruth).toMatchObject({
      id: result.id,
      content:
        'Qual foi a maior mentira que você já contou e ninguém descobriu?',
      authorId: user.id,
      author: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  });

  it('deve remover espaços nas extremidades do conteúdo antes de persistir', async () => {
    const user = await createTestUser({
      name: 'Trim Truth Author',
      email: 'trim-truth-author@test.com',
      password: '123456',
    });

    const result = await createTruth({
      authorId: user.id,
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
  });

  it('deve falhar quando o authorId não for informado', async () => {
    await expect(
      createTruth({
        authorId: '',
        content: 'Qual foi a sua maior vergonha em público?',
      }),
    ).rejects.toThrow('Usuário autenticado não encontrado');

    const truthsCount = await prisma.truth.count();

    expect(truthsCount).toBe(0);
  });

  it('deve falhar quando o conteúdo não for informado', async () => {
    const user = await createTestUser({
      name: 'Empty Truth Author',
      email: 'empty-truth-author@test.com',
      password: '123456',
    });

    await expect(
      createTruth({
        authorId: user.id,
        content: '   ',
      }),
    ).rejects.toThrow('Conteúdo é obrigatório');

    const truthsCount = await prisma.truth.count();

    expect(truthsCount).toBe(0);
  });
});