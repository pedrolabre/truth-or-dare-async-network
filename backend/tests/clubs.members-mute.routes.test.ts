import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubStatus,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import clubsRoutes from '../src/routes/clubs.routes';
import {
  addUserToClub,
  createTestClub,
  createTestUser,
  resetFeedData,
} from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { applyTestDatabaseHooks } from './test-db';

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use('/clubs', clubsRoutes);

  return app;
}

function authTokenFor(user: { id: string; email: string; name: string }) {
  return generateToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });
}

async function createClubWithViewer(
  role: ClubMemberRole = ClubMemberRole.member,
  status: ClubMemberStatus = ClubMemberStatus.active,
  clubStatus: ClubStatus = ClubStatus.active,
) {
  const owner = await createTestUser();
  const viewer = role === ClubMemberRole.owner ? owner : await createTestUser();
  const club = await createTestClub({
    createdById: owner.id,
    status: clubStatus,
    memberCount:
      viewer.id === owner.id
        ? 1
        : status === ClubMemberStatus.active
          ? 2
          : 1,
  });

  await addUserToClub(club.id, owner.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });

  if (viewer.id !== owner.id) {
    await addUserToClub(club.id, viewer.id, {
      role,
      status,
      joinedAt: status === ClubMemberStatus.active ? new Date() : null,
    });
  }

  return { club, viewer };
}

async function muteViewer(clubId: string, userId: string) {
  return prisma.clubMember.update({
    where: {
      clubId_userId: {
        clubId,
        userId,
      },
    },
    data: {
      mutedUntil: new Date('9999-12-31T23:59:59.999Z'),
    },
  });
}

describe('clubs.members-mute.routes', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it.each([
    ClubMemberRole.owner,
    ClubMemberRole.admin,
    ClubMemberRole.moderator,
    ClubMemberRole.member,
  ])('POST /clubs/:id/mute permite %s ativo silenciar o clube', async (role) => {
    const { club, viewer } = await createClubWithViewer(role);

    const response = await request(app)
      .post(`/clubs/${club.id}/mute`)
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      clubId: club.id,
      userId: viewer.id,
      role,
      status: ClubMemberStatus.active,
      mutedUntil: expect.any(String),
    });

    const membership = await prisma.clubMember.findUniqueOrThrow({
      where: {
        clubId_userId: {
          clubId: club.id,
          userId: viewer.id,
        },
      },
    });

    expect(membership.mutedUntil).toBeInstanceOf(Date);
    expect(membership.mutedUntil?.getUTCFullYear()).toBe(9999);

    await expect(
      prisma.clubAuditLog.count({
        where: {
          clubId: club.id,
          actorId: viewer.id,
          targetUserId: viewer.id,
          action: 'club_member_muted',
        },
      }),
    ).resolves.toBe(1);
  });

  it.each([
    ClubMemberStatus.invited,
    ClubMemberStatus.requested,
    ClubMemberStatus.removed,
  ])('POST /clubs/:id/mute bloqueia status %s', async (status) => {
    const { club, viewer } = await createClubWithViewer(
      ClubMemberRole.member,
      status,
    );

    const response = await request(app)
      .post(`/clubs/${club.id}/mute`)
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
  });

  it('POST /clubs/:id/mute bloqueia outsider', async () => {
    const owner = await createTestUser();
    const outsider = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/mute`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`);

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
  });

  it.each([ClubStatus.archived, ClubStatus.suspended])(
    'POST /clubs/:id/mute bloqueia clube %s',
    async (status) => {
      const { club, viewer } = await createClubWithViewer(
        ClubMemberRole.member,
        ClubMemberStatus.active,
        status,
      );

      const response = await request(app)
        .post(`/clubs/${club.id}/mute`)
        .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        code: 'CLUB_VALIDATION_ERROR',
      });
    },
  );

  it('POST /clubs/:id/mute retorna 404 para clube deletado e 401 sem token', async () => {
    const { club, viewer } = await createClubWithViewer(
      ClubMemberRole.member,
      ClubMemberStatus.active,
      ClubStatus.deleted,
    );

    const deletedResponse = await request(app)
      .post(`/clubs/${club.id}/mute`)
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);
    const unauthorizedResponse = await request(app).post(
      `/clubs/${club.id}/mute`,
    );

    expect(deletedResponse.status).toBe(404);
    expect(deletedResponse.body).toMatchObject({
      code: 'CLUB_NOT_FOUND',
    });
    expect(unauthorizedResponse.status).toBe(401);
  });

  it.each([
    ClubMemberRole.owner,
    ClubMemberRole.admin,
    ClubMemberRole.moderator,
    ClubMemberRole.member,
  ])(
    'POST /clubs/:id/unmute permite %s ativo remover silencio do clube',
    async (role) => {
      const { club, viewer } = await createClubWithViewer(role);
      await muteViewer(club.id, viewer.id);

      const response = await request(app)
        .post(`/clubs/${club.id}/unmute`)
        .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        clubId: club.id,
        userId: viewer.id,
        role,
        status: ClubMemberStatus.active,
        mutedUntil: null,
      });

      await expect(
        prisma.clubMember.findUniqueOrThrow({
          where: {
            clubId_userId: {
              clubId: club.id,
              userId: viewer.id,
            },
          },
        }),
      ).resolves.toMatchObject({
        mutedUntil: null,
      });

      await expect(
        prisma.clubAuditLog.count({
          where: {
            clubId: club.id,
            actorId: viewer.id,
            targetUserId: viewer.id,
            action: 'club_member_unmuted',
          },
        }),
      ).resolves.toBe(1);
    },
  );

  it.each([
    ClubMemberStatus.invited,
    ClubMemberStatus.requested,
    ClubMemberStatus.removed,
  ])('POST /clubs/:id/unmute bloqueia status %s', async (status) => {
    const { club, viewer } = await createClubWithViewer(
      ClubMemberRole.member,
      status,
    );

    const response = await request(app)
      .post(`/clubs/${club.id}/unmute`)
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
  });

  it('POST /clubs/:id/unmute bloqueia outsider', async () => {
    const owner = await createTestUser();
    const outsider = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/unmute`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`);

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
  });

  it.each([ClubStatus.archived, ClubStatus.suspended])(
    'POST /clubs/:id/unmute bloqueia clube %s',
    async (status) => {
      const { club, viewer } = await createClubWithViewer(
        ClubMemberRole.member,
        ClubMemberStatus.active,
        status,
      );
      await muteViewer(club.id, viewer.id);

      const response = await request(app)
        .post(`/clubs/${club.id}/unmute`)
        .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        code: 'CLUB_VALIDATION_ERROR',
      });
    },
  );

  it('POST /clubs/:id/unmute retorna 404 para clube deletado e 401 sem token', async () => {
    const { club, viewer } = await createClubWithViewer(
      ClubMemberRole.member,
      ClubMemberStatus.active,
      ClubStatus.deleted,
    );

    const deletedResponse = await request(app)
      .post(`/clubs/${club.id}/unmute`)
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);
    const unauthorizedResponse = await request(app).post(
      `/clubs/${club.id}/unmute`,
    );

    expect(deletedResponse.status).toBe(404);
    expect(deletedResponse.body).toMatchObject({
      code: 'CLUB_NOT_FOUND',
    });
    expect(unauthorizedResponse.status).toBe(401);
  });
});
