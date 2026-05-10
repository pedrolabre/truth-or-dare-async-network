import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import { resetFeedData } from '../src/test-utils/factories';
import { applyTestDatabaseHooks } from './test-db';
import {
  authTokenFor,
  createTestApp,
  createTransferScenario,
} from './helpers/clubs-ownership-transfer.helpers';

describe('clubs.ownership-transfer.routes success', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it.each([
    ClubMemberRole.member,
    ClubMemberRole.admin,
    ClubMemberRole.moderator,
  ])('owner transfere posse para %s ativo', async (targetRole) => {
    const { club, owner, target } = await createTransferScenario(targetRole);

    const response = await request(app)
      .post(`/clubs/${club.id}/transfer-ownership`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        newOwnerId: target.id,
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: club.id,
      memberCount: 2,
      viewerMembership: {
        isMember: true,
        role: ClubMemberRole.admin,
        status: ClubMemberStatus.active,
      },
      permissions: {
        canTransferOwnership: false,
        canEditClub: true,
      },
    });

    await expect(
      prisma.clubMember.findUniqueOrThrow({
        where: {
          clubId_userId: {
            clubId: club.id,
            userId: owner.id,
          },
        },
      }),
    ).resolves.toMatchObject({
      role: ClubMemberRole.admin,
      status: ClubMemberStatus.active,
    });

    await expect(
      prisma.clubMember.findUniqueOrThrow({
        where: {
          clubId_userId: {
            clubId: club.id,
            userId: target.id,
          },
        },
      }),
    ).resolves.toMatchObject({
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    await expect(
      prisma.club.findUniqueOrThrow({
        where: {
          id: club.id,
        },
      }),
    ).resolves.toMatchObject({
      createdById: owner.id,
      memberCount: 2,
    });

    await expect(
      prisma.clubAuditLog.count({
        where: {
          clubId: club.id,
          actorId: owner.id,
          targetUserId: target.id,
          action: 'club_ownership_transferred',
        },
      }),
    ).resolves.toBe(1);
  });

  it('preserva createdById, memberCount e lastActivityAt', async () => {
    const { club, owner, target } = await createTransferScenario();
    const before = await prisma.club.findUniqueOrThrow({
      where: {
        id: club.id,
      },
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/transfer-ownership`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        newOwnerId: target.id,
      });
    const after = await prisma.club.findUniqueOrThrow({
      where: {
        id: club.id,
      },
    });

    expect(response.status).toBe(200);
    expect(after).toMatchObject({
      createdById: before.createdById,
      memberCount: before.memberCount,
      lastActivityAt: before.lastActivityAt,
    });
  });
});
