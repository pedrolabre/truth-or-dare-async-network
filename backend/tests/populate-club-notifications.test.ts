import {
  ClubMemberStatus,
  NotificationType,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import { populateClubNotifications } from '../scripts/populate-club-notifications';
import { applyTestDatabaseHooks } from './test-db';

describe('scripts/populate-club-notifications', () => {
  applyTestDatabaseHooks();

  it('cria experiencia densa de Clubes com notificacoes, estados de leitura e clube mutado', async () => {
    const scenario = await populateClubNotifications({
      baseDate: new Date('2026-05-25T12:00:00.000Z'),
    });

    const [
      clubsCount,
      activeMembersCount,
      invitedMembersCount,
      requestedMembersCount,
      invitesCount,
      requestsCount,
      promptsCount,
      responsesCount,
      commentsCount,
      notificationsCount,
      unreadNotificationsCount,
      readNotificationsCount,
    ] = await Promise.all([
      prisma.club.count({
        where: {
          slug: {
            in: ['seed-clubes-pulso-alto', 'seed-clubes-silenciado'],
          },
        },
      }),
      prisma.clubMember.count({
        where: {
          clubId: scenario.clubs.activeClub.id,
          status: ClubMemberStatus.active,
        },
      }),
      prisma.clubMember.count({
        where: {
          clubId: scenario.clubs.activeClub.id,
          status: ClubMemberStatus.invited,
        },
      }),
      prisma.clubMember.count({
        where: {
          clubId: scenario.clubs.activeClub.id,
          status: ClubMemberStatus.requested,
        },
      }),
      prisma.clubInvite.count({
        where: {
          clubId: scenario.clubs.activeClub.id,
        },
      }),
      prisma.clubJoinRequest.count({
        where: {
          clubId: scenario.clubs.activeClub.id,
        },
      }),
      prisma.clubPrompt.count({
        where: {
          clubId: {
            in: [scenario.clubs.activeClub.id, scenario.clubs.mutedClub.id],
          },
        },
      }),
      prisma.clubPromptResponse.count({
        where: {
          clubId: scenario.clubs.activeClub.id,
        },
      }),
      prisma.clubPromptComment.count({
        where: {
          clubId: {
            in: [scenario.clubs.activeClub.id, scenario.clubs.mutedClub.id],
          },
        },
      }),
      prisma.notification.count({
        where: {
          clubId: scenario.clubs.activeClub.id,
        },
      }),
      prisma.notification.count({
        where: {
          clubId: scenario.clubs.activeClub.id,
          readAt: null,
        },
      }),
      prisma.notification.count({
        where: {
          clubId: scenario.clubs.activeClub.id,
          readAt: {
            not: null,
          },
        },
      }),
    ]);

    expect(clubsCount).toBe(2);
    expect(activeMembersCount).toBe(5);
    expect(invitedMembersCount).toBe(1);
    expect(requestedMembersCount).toBe(1);
    expect(invitesCount).toBe(1);
    expect(requestsCount).toBe(1);
    expect(promptsCount).toBe(3);
    expect(responsesCount).toBe(2);
    expect(commentsCount).toBe(2);
    expect(notificationsCount).toBe(7);
    expect(unreadNotificationsCount).toBeGreaterThan(0);
    expect(readNotificationsCount).toBeGreaterThan(0);

    await expect(
      prisma.clubMember.findUnique({
        where: {
          clubId_userId: {
            clubId: scenario.clubs.activeClub.id,
            userId: scenario.users.mutedMember.id,
          },
        },
      }),
    ).resolves.toMatchObject({
      mutedUntil: scenario.mutedUntil,
    });

    await expect(
      prisma.notification.findMany({
        where: {
          userId: scenario.users.mutedMember.id,
          clubId: scenario.clubs.activeClub.id,
          type: {
            in: [
              NotificationType.club_new_prompt,
              NotificationType.club_prompt_response,
              NotificationType.club_prompt_comment,
              NotificationType.club_mention,
            ],
          },
        },
      }),
    ).resolves.toEqual([]);

    await expect(
      prisma.notification.findFirst({
        where: {
          userId: scenario.users.mutedMember.id,
          type: NotificationType.club_member_promoted,
        },
      }),
    ).resolves.toMatchObject({
      readAt: null,
    });
  });

  it('pode ser reexecutado sem duplicar o cenario conhecido', async () => {
    await populateClubNotifications({
      baseDate: new Date('2026-05-25T12:00:00.000Z'),
    });
    await populateClubNotifications({
      baseDate: new Date('2026-05-25T12:00:00.000Z'),
    });

    await expect(
      prisma.club.count({
        where: {
          slug: {
            in: ['seed-clubes-pulso-alto', 'seed-clubes-silenciado'],
          },
        },
      }),
    ).resolves.toBe(2);

    await expect(
      prisma.notification.count({
        where: {
          user: {
            email: {
              in: [
                'clubes-owner@test.com',
                'clubes-admin@test.com',
                'clubes-moderador@test.com',
                'clubes-membro@test.com',
                'clubes-mutado@test.com',
                'clubes-convidado@test.com',
                'clubes-solicitante@test.com',
              ],
            },
          },
        },
      }),
    ).resolves.toBe(7);
  });
});
