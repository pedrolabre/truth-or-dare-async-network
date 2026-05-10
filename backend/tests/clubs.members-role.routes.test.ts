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

describe('clubs.members-role.routes', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it.each([
    [ClubMemberRole.member, ClubMemberRole.admin],
    [ClubMemberRole.member, ClubMemberRole.moderator],
    [ClubMemberRole.admin, ClubMemberRole.member],
    [ClubMemberRole.moderator, ClubMemberRole.member],
  ])('owner altera papel de %s para %s', async (targetRole, newRole) => {
    const { actor, club, target } = await createClubWithActorAndTarget(
      ClubMemberRole.owner,
      targetRole,
    );

    const response = await request(app)
      .patch(`/clubs/${club.id}/members/${target.id}/role`)
      .set('Authorization', `Bearer ${authTokenFor(actor)}`)
      .send({ role: newRole });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      clubId: club.id,
      userId: target.id,
      role: newRole,
      status: ClubMemberStatus.active,
    });

    await expect(
      prisma.clubAuditLog.count({
        where: {
          clubId: club.id,
          actorId: actor.id,
          targetUserId: target.id,
          action: 'club_member_role_updated',
        },
      }),
    ).resolves.toBe(1);
  });

  it.each([
    [ClubMemberRole.member, ClubMemberRole.moderator],
    [ClubMemberRole.moderator, ClubMemberRole.member],
  ])('admin altera papel de %s para %s', async (targetRole, newRole) => {
    const { actor, club, target } = await createClubWithActorAndTarget(
      ClubMemberRole.admin,
      targetRole,
    );

    const response = await request(app)
      .patch(`/clubs/${club.id}/members/${target.id}/role`)
      .set('Authorization', `Bearer ${authTokenFor(actor)}`)
      .send({ role: newRole });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      userId: target.id,
      role: newRole,
    });
  });

  it.each([
    [ClubMemberRole.admin, ClubMemberRole.member, ClubMemberRole.admin, 403],
    [ClubMemberRole.admin, ClubMemberRole.admin, ClubMemberRole.member, 403],
    [ClubMemberRole.admin, ClubMemberRole.owner, ClubMemberRole.member, 400],
    [ClubMemberRole.moderator, ClubMemberRole.member, ClubMemberRole.moderator, 403],
    [ClubMemberRole.member, ClubMemberRole.member, ClubMemberRole.moderator, 403],
  ])(
    'bloqueia %s alterando %s para %s',
    async (actorRole, targetRole, newRole, expectedStatus) => {
      const { actor, club, target } = await createClubWithActorAndTarget(
        actorRole,
        targetRole,
      );

      const response = await request(app)
        .patch(`/clubs/${club.id}/members/${target.id}/role`)
        .set('Authorization', `Bearer ${authTokenFor(actor)}`)
        .send({ role: newRole });

      expect(response.status).toBe(expectedStatus);
      expect(response.body.code).toMatch(/CLUB_(FORBIDDEN|VALIDATION_ERROR)/);
    },
  );

  it('bloqueia role owner e role invalido', async () => {
    const { actor, club, target } = await createClubWithActorAndTarget(
      ClubMemberRole.owner,
      ClubMemberRole.member,
    );

    const ownerResponse = await request(app)
      .patch(`/clubs/${club.id}/members/${target.id}/role`)
      .set('Authorization', `Bearer ${authTokenFor(actor)}`)
      .send({ role: ClubMemberRole.owner });
    const invalidResponse = await request(app)
      .patch(`/clubs/${club.id}/members/${target.id}/role`)
      .set('Authorization', `Bearer ${authTokenFor(actor)}`)
      .send({ role: 'banana' });

    expect(ownerResponse.status).toBe(400);
    expect(ownerResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
    expect(invalidResponse.status).toBe(400);
    expect(invalidResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
  });

  it('bloqueia autoalteracao e papel igual ao atual', async () => {
    const { actor, club, target } = await createClubWithActorAndTarget(
      ClubMemberRole.admin,
      ClubMemberRole.member,
    );

    const selfResponse = await request(app)
      .patch(`/clubs/${club.id}/members/${actor.id}/role`)
      .set('Authorization', `Bearer ${authTokenFor(actor)}`)
      .send({ role: ClubMemberRole.member });
    const sameRoleResponse = await request(app)
      .patch(`/clubs/${club.id}/members/${target.id}/role`)
      .set('Authorization', `Bearer ${authTokenFor(actor)}`)
      .send({ role: ClubMemberRole.member });

    expect(selfResponse.status).toBe(400);
    expect(selfResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
    expect(sameRoleResponse.status).toBe(400);
    expect(sameRoleResponse.body).toMatchObject({
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
      .patch(`/clubs/${club.id}/members/${target.id}/role`)
      .set('Authorization', `Bearer ${authTokenFor(actor)}`)
      .send({ role: ClubMemberRole.moderator });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
  });

  it.each([ClubStatus.archived, ClubStatus.suspended])(
    'bloqueia alteracao em clube %s',
    async (status) => {
      const { actor, club, target } = await createClubWithActorAndTarget(
        ClubMemberRole.owner,
        ClubMemberRole.member,
        status,
      );

      const response = await request(app)
        .patch(`/clubs/${club.id}/members/${target.id}/role`)
        .set('Authorization', `Bearer ${authTokenFor(actor)}`)
        .send({ role: ClubMemberRole.moderator });

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
      .patch(`/clubs/${club.id}/members/${target.id}/role`)
      .set('Authorization', `Bearer ${authTokenFor(actor)}`)
      .send({ role: ClubMemberRole.moderator });
    const unauthorizedResponse = await request(app)
      .patch(`/clubs/${club.id}/members/${target.id}/role`)
      .send({ role: ClubMemberRole.moderator });

    expect(deletedResponse.status).toBe(404);
    expect(deletedResponse.body).toMatchObject({
      code: 'CLUB_NOT_FOUND',
    });
    expect(unauthorizedResponse.status).toBe(401);
  });
});
