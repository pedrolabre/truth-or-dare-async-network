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

async function createClubWithActorAndTarget(
  actorRole: ClubMemberRole,
  targetRole: ClubMemberRole,
  status: ClubStatus = ClubStatus.active,
) {
  const owner = await createTestUser();
  const actor = actorRole === ClubMemberRole.owner ? owner : await createTestUser();
  const target = await createTestUser();
  const club = await createTestClub({
    createdById: owner.id,
    status,
    memberCount: actor.id === owner.id ? 2 : 3,
  });

  await addUserToClub(club.id, owner.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });

  if (actor.id !== owner.id) {
    await addUserToClub(club.id, actor.id, {
      role: actorRole,
      status: ClubMemberStatus.active,
    });
  }

  await addUserToClub(club.id, target.id, {
    role: targetRole,
    status: ClubMemberStatus.active,
  });

  return { actor, club, target };
}

describe('clubs.members-remove.routes', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it.each([
    [ClubMemberRole.owner, ClubMemberRole.admin],
    [ClubMemberRole.owner, ClubMemberRole.moderator],
    [ClubMemberRole.owner, ClubMemberRole.member],
    [ClubMemberRole.admin, ClubMemberRole.moderator],
    [ClubMemberRole.admin, ClubMemberRole.member],
    [ClubMemberRole.moderator, ClubMemberRole.member],
  ])('permite %s remover %s', async (actorRole, targetRole) => {
    const { actor, club, target } = await createClubWithActorAndTarget(
      actorRole,
      targetRole,
    );

    const response = await request(app)
      .post(`/clubs/${club.id}/members/${target.id}/remove`)
      .set('Authorization', `Bearer ${authTokenFor(actor)}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      clubId: club.id,
      userId: target.id,
      role: targetRole,
      status: ClubMemberStatus.removed,
    });

    await expect(
      prisma.club.findUniqueOrThrow({
        where: {
          id: club.id,
        },
      }),
    ).resolves.toMatchObject({
      memberCount: actorRole === ClubMemberRole.owner ? 1 : 2,
    });

    await expect(
      prisma.clubAuditLog.count({
        where: {
          clubId: club.id,
          actorId: actor.id,
          targetUserId: target.id,
          action: 'club_member_removed',
        },
      }),
    ).resolves.toBe(1);
  });

  it.each([
    [ClubMemberRole.admin, ClubMemberRole.owner, 400],
    [ClubMemberRole.admin, ClubMemberRole.admin, 403],
    [ClubMemberRole.moderator, ClubMemberRole.admin, 403],
    [ClubMemberRole.member, ClubMemberRole.member, 403],
  ])(
    'bloqueia %s removendo %s',
    async (actorRole, targetRole, expectedStatus) => {
      const { actor, club, target } = await createClubWithActorAndTarget(
        actorRole,
        targetRole,
      );

      const response = await request(app)
        .post(`/clubs/${club.id}/members/${target.id}/remove`)
        .set('Authorization', `Bearer ${authTokenFor(actor)}`);

      expect(response.status).toBe(expectedStatus);
      expect(response.body.code).toMatch(/CLUB_(FORBIDDEN|VALIDATION_ERROR)/);
    },
  );

  it('bloqueia auto-remocao por esta rota', async () => {
    const { actor, club } = await createClubWithActorAndTarget(
      ClubMemberRole.admin,
      ClubMemberRole.member,
    );

    const response = await request(app)
      .post(`/clubs/${club.id}/members/${actor.id}/remove`)
      .set('Authorization', `Bearer ${authTokenFor(actor)}`);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
  });

  it.each([
    ClubMemberStatus.invited,
    ClubMemberStatus.requested,
    ClubMemberStatus.removed,
  ])('bloqueia alvo com status %s', async (status) => {
    const { actor, club, target } = await createClubWithActorAndTarget(
      ClubMemberRole.owner,
      ClubMemberRole.member,
    );

    await addUserToClub(club.id, target.id, {
      role: ClubMemberRole.member,
      status,
      joinedAt: null,
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/members/${target.id}/remove`)
      .set('Authorization', `Bearer ${authTokenFor(actor)}`);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
  });

  it('bloqueia outsider removendo membro', async () => {
    const outsider = await createTestUser();
    const { club, target } = await createClubWithActorAndTarget(
      ClubMemberRole.owner,
      ClubMemberRole.member,
    );

    const response = await request(app)
      .post(`/clubs/${club.id}/members/${target.id}/remove`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`);

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
  });

  it.each([ClubStatus.archived, ClubStatus.suspended])(
    'bloqueia remocao em clube %s',
    async (status) => {
      const { actor, club, target } = await createClubWithActorAndTarget(
        ClubMemberRole.owner,
        ClubMemberRole.member,
        status,
      );

      const response = await request(app)
        .post(`/clubs/${club.id}/members/${target.id}/remove`)
        .set('Authorization', `Bearer ${authTokenFor(actor)}`);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        code: 'CLUB_VALIDATION_ERROR',
      });
    },
  );

  it('retorna 404 para clube deletado e 401 sem token', async () => {
    const { actor, club, target } = await createClubWithActorAndTarget(
      ClubMemberRole.owner,
      ClubMemberRole.member,
      ClubStatus.deleted,
    );

    const deletedResponse = await request(app)
      .post(`/clubs/${club.id}/members/${target.id}/remove`)
      .set('Authorization', `Bearer ${authTokenFor(actor)}`);
    const unauthorizedResponse = await request(app).post(
      `/clubs/${club.id}/members/${target.id}/remove`,
    );

    expect(deletedResponse.status).toBe(404);
    expect(deletedResponse.body).toMatchObject({
      code: 'CLUB_NOT_FOUND',
    });
    expect(unauthorizedResponse.status).toBe(401);
  });
});
