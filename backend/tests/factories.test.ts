import { prisma } from '../src/lib/prisma';
import {
  buildFeedScenario,
  resetFeedData,
} from '../src/test-utils/factories';
import { applyTestDatabaseHooks } from './test-db';

describe('test-utils/factories', () => {
  applyTestDatabaseHooks();

  it('deve criar um cenário completo e persistido no banco', async () => {
    const scenario = await buildFeedScenario();

    expect(scenario.users.owner.email).toBe('labre@test.com');
    expect(scenario.users.second.email).toBe('marina-feed@test.com');
    expect(scenario.users.third.email).toBe('lucas-feed@test.com');

    const [owner, second, third] = await Promise.all([
      prisma.user.findUnique({
        where: { email: 'labre@test.com' },
      }),
      prisma.user.findUnique({
        where: { email: 'marina-feed@test.com' },
      }),
      prisma.user.findUnique({
        where: { email: 'lucas-feed@test.com' },
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

  it('deve permitir resetar apenas os dados do feed sem apagar usuários', async () => {
    await buildFeedScenario();

    await resetFeedData();

    const [owner, second, third] = await Promise.all([
      prisma.user.findUnique({
        where: { email: 'labre@test.com' },
      }),
      prisma.user.findUnique({
        where: { email: 'marina-feed@test.com' },
      }),
      prisma.user.findUnique({
        where: { email: 'lucas-feed@test.com' },
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

    expect(truthsCount).toBe(0);
    expect(daresCount).toBe(0);
    expect(clubsCount).toBe(0);
    expect(membersCount).toBe(0);
    expect(promptsCount).toBe(0);
  });

  it('deve permitir recriar o cenário com os mesmos usuários de teste e novos dados de feed', async () => {
    await buildFeedScenario();
    await resetFeedData();

    const scenario = await buildFeedScenario();

    expect(scenario.users.owner.email).toBe('labre@test.com');
    expect(scenario.users.second.email).toBe('marina-feed@test.com');
    expect(scenario.users.third.email).toBe('lucas-feed@test.com');

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

    const [truthsCount, daresCount, clubsCount, promptsCount] = await Promise.all([
      prisma.truth.count(),
      prisma.dare.count(),
      prisma.club.count(),
      prisma.clubPrompt.count(),
    ]);

    expect(truthsCount).toBe(2);
    expect(daresCount).toBe(2);
    expect(clubsCount).toBe(2);
    expect(promptsCount).toBe(3);
  });

  it('deve apagar também os usuários quando deleteUsers for true', async () => {
    await buildFeedScenario();

    await resetFeedData({
      deleteUsers: true,
    });

    const [usersCount, truthsCount, daresCount, clubsCount, membersCount, promptsCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.truth.count(),
        prisma.dare.count(),
        prisma.club.count(),
        prisma.clubMember.count(),
        prisma.clubPrompt.count(),
      ]);

    expect(usersCount).toBe(0);
    expect(truthsCount).toBe(0);
    expect(daresCount).toBe(0);
    expect(clubsCount).toBe(0);
    expect(membersCount).toBe(0);
    expect(promptsCount).toBe(0);
  });
});