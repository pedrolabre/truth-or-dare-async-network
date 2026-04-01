import { prisma } from '../src/lib/prisma';
import { populateFeed } from '../scripts/populate-feed';
import { applyTestDatabaseHooks } from './test-db';

describe('scripts/populate-feed', () => {
  applyTestDatabaseHooks();

  it('deve popular o banco com o cenário completo do feed', async () => {
    const scenario = await populateFeed();

    expect(scenario.users.owner.email).toBe('labre@test.com');
    expect(scenario.users.second.email).toBe('marina-feed@test.com');
    expect(scenario.users.third.email).toBe('lucas-feed@test.com');

    const [owner, second, third] = await Promise.all([
      prisma.user.findUnique({
        where: {
          email: 'labre@test.com',
        },
      }),
      prisma.user.findUnique({
        where: {
          email: 'marina-feed@test.com',
        },
      }),
      prisma.user.findUnique({
        where: {
          email: 'lucas-feed@test.com',
        },
      }),
    ]);

    expect(owner).not.toBeNull();
    expect(second).not.toBeNull();
    expect(third).not.toBeNull();

    const [truthsCount, daresCount, clubsCount, membersCount, promptsCount] =
      await Promise.all([
        prisma.truth.count(),
        prisma.dare.count(),
        prisma.club.count(),
        prisma.clubMember.count(),
        prisma.clubPrompt.count(),
      ]);

    expect(truthsCount).toBe(2);
    expect(daresCount).toBe(2);
    expect(clubsCount).toBe(2);
    expect(membersCount).toBe(5);
    expect(promptsCount).toBe(3);
  });

  it('deve resetar os dados anteriores do feed antes de popular novamente', async () => {
    await populateFeed();
    await populateFeed();

    const [owner, second, third] = await Promise.all([
      prisma.user.findUnique({
        where: {
          email: 'labre@test.com',
        },
      }),
      prisma.user.findUnique({
        where: {
          email: 'marina-feed@test.com',
        },
      }),
      prisma.user.findUnique({
        where: {
          email: 'lucas-feed@test.com',
        },
      }),
    ]);

    expect(owner).not.toBeNull();
    expect(second).not.toBeNull();
    expect(third).not.toBeNull();

    const [truthsCount, daresCount, clubsCount, membersCount, promptsCount] =
      await Promise.all([
        prisma.truth.count(),
        prisma.dare.count(),
        prisma.club.count(),
        prisma.clubMember.count(),
        prisma.clubPrompt.count(),
      ]);

    expect(truthsCount).toBe(2);
    expect(daresCount).toBe(2);
    expect(clubsCount).toBe(2);
    expect(membersCount).toBe(5);
    expect(promptsCount).toBe(3);
  });

  it('deve manter as contas fixas de teste reaproveitáveis após múltiplas populações', async () => {
    await populateFeed();
    await populateFeed();

    const owner = await prisma.user.findUnique({
      where: {
        email: 'labre@test.com',
      },
    });

    const second = await prisma.user.findUnique({
      where: {
        email: 'marina-feed@test.com',
      },
    });

    const third = await prisma.user.findUnique({
      where: {
        email: 'lucas-feed@test.com',
      },
    });

    expect(owner).not.toBeNull();
    expect(second).not.toBeNull();
    expect(third).not.toBeNull();
  });
});