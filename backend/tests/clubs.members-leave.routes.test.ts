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

describe('clubs.members-leave.routes', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('POST /clubs/:id/leave permite membro ativo sair do clube', async () => {
    const owner = await createTestUser();
    const member = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 2,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(club.id, member.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.active,
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/leave`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      clubId: club.id,
      userId: member.id,
      role: ClubMemberRole.member,
      status: ClubMemberStatus.removed,
    });

    await expect(
      prisma.club.findUniqueOrThrow({
        where: {
          id: club.id,
        },
      }),
    ).resolves.toMatchObject({
      memberCount: 1,
    });

    await expect(
      prisma.clubAuditLog.count({
        where: {
          clubId: club.id,
          actorId: member.id,
          targetUserId: member.id,
          action: 'club_member_left',
        },
      }),
    ).resolves.toBe(1);
  });

  it.each([ClubMemberRole.admin, ClubMemberRole.moderator])(
    'POST /clubs/:id/leave permite %s sair sem alterar o papel salvo',
    async (role) => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const club = await createTestClub({
        createdById: owner.id,
        memberCount: 2,
      });

      await addUserToClub(club.id, owner.id, {
        role: ClubMemberRole.owner,
        status: ClubMemberStatus.active,
      });
      await addUserToClub(club.id, member.id, {
        role,
        status: ClubMemberStatus.active,
      });

      const response = await request(app)
        .post(`/clubs/${club.id}/leave`)
        .set('Authorization', `Bearer ${authTokenFor(member)}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        userId: member.id,
        role,
        status: ClubMemberStatus.removed,
      });
    },
  );

  it('POST /clubs/:id/leave bloqueia owner sem transferencia de posse', async () => {
    const owner = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/leave`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });

    await expect(
      prisma.club.findUniqueOrThrow({
        where: {
          id: club.id,
        },
      }),
    ).resolves.toMatchObject({
      memberCount: 1,
    });
  });

  it.each([
    ClubMemberStatus.invited,
    ClubMemberStatus.requested,
    ClubMemberStatus.removed,
  ])('POST /clubs/:id/leave bloqueia status %s', async (status) => {
    const owner = await createTestUser();
    const viewer = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(club.id, viewer.id, {
      role: ClubMemberRole.member,
      status,
      joinedAt: null,
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/leave`)
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
  });

  it('POST /clubs/:id/leave bloqueia outsider', async () => {
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
      .post(`/clubs/${club.id}/leave`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
  });

  it.each([ClubStatus.archived, ClubStatus.suspended])(
    'POST /clubs/:id/leave permite sair de clube %s',
    async (status) => {
      const owner = await createTestUser();
      const member = await createTestUser();
      const club = await createTestClub({
        createdById: owner.id,
        status,
        memberCount: 2,
      });

      await addUserToClub(club.id, owner.id, {
        role: ClubMemberRole.owner,
        status: ClubMemberStatus.active,
      });
      await addUserToClub(club.id, member.id, {
        role: ClubMemberRole.member,
        status: ClubMemberStatus.active,
      });

      const response = await request(app)
        .post(`/clubs/${club.id}/leave`)
        .set('Authorization', `Bearer ${authTokenFor(member)}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: ClubMemberStatus.removed,
      });
    },
  );

  it('POST /clubs/:id/leave retorna 404 para clube deletado e 401 sem token', async () => {
    const owner = await createTestUser();
    const member = await createTestUser();
    const deletedClub = await createTestClub({
      createdById: owner.id,
      status: ClubStatus.deleted,
      memberCount: 2,
    });

    await addUserToClub(deletedClub.id, member.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.active,
    });

    const deletedResponse = await request(app)
      .post(`/clubs/${deletedClub.id}/leave`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);
    const unauthorizedResponse = await request(app).post(
      `/clubs/${deletedClub.id}/leave`,
    );

    expect(deletedResponse.status).toBe(404);
    expect(deletedResponse.body).toMatchObject({
      code: 'CLUB_NOT_FOUND',
    });
    expect(unauthorizedResponse.status).toBe(401);
  });
});
