import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
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

async function createClubWithOwner() {
  const owner = await createTestUser();
  const club = await createTestClub({
    createdById: owner.id,
    memberCount: 1,
  });

  await addUserToClub(club.id, owner.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });

  return { club, owner };
}

async function createActiveMember(
  clubId: string,
  role: ClubMemberRole = ClubMemberRole.member,
) {
  const user = await createTestUser();
  const membership = await addUserToClub(clubId, user.id, {
    role,
    status: ClubMemberStatus.active,
  });

  return { membership, user };
}

async function findAuditLog(action: string) {
  return prisma.clubAuditLog.findFirstOrThrow({
    where: {
      action,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

describe('clubs.members-actions-audit.routes', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('registra audit log ao criar convite', async () => {
    const { club, owner } = await createClubWithOwner();
    const invitee = await createTestUser();

    const response = await request(app)
      .post(`/clubs/${club.id}/invites`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        userId: invitee.id,
        message: 'Convite auditavel',
      });

    expect(response.status).toBe(201);

    const auditLog = await findAuditLog('club_invite_created');

    expect(auditLog).toMatchObject({
      clubId: club.id,
      actorId: owner.id,
      targetUserId: invitee.id,
      entityType: 'club_invite',
      entityId: response.body.id,
    });
    expect(auditLog.metadata).toMatchObject({
      status: ClubMemberStatus.invited,
      hasMessage: true,
    });
  });

  it('registra audit log ao aceitar convite', async () => {
    const { club, owner } = await createClubWithOwner();
    const invitee = await createTestUser();

    const inviteResponse = await request(app)
      .post(`/clubs/${club.id}/invites`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        userId: invitee.id,
      });
    const acceptResponse = await request(app)
      .post(`/clubs/invites/${inviteResponse.body.id}/accept`)
      .set('Authorization', `Bearer ${authTokenFor(invitee)}`);

    expect(acceptResponse.status).toBe(200);

    const auditLog = await findAuditLog('club_invite_accepted');

    expect(auditLog).toMatchObject({
      clubId: club.id,
      actorId: invitee.id,
      targetUserId: invitee.id,
      entityType: 'club_invite',
      entityId: inviteResponse.body.id,
    });
    expect(auditLog.metadata).toMatchObject({
      inviterId: owner.id,
      incrementedMemberCount: true,
    });
  });

  it('registra audit log ao membro sair do clube', async () => {
    const { club, owner } = await createClubWithOwner();
    const { membership, user: member } = await createActiveMember(club.id);

    await prisma.club.update({
      where: {
        id: club.id,
      },
      data: {
        memberCount: 2,
      },
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/leave`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);

    expect(response.status).toBe(200);

    const auditLog = await findAuditLog('club_member_left');

    expect(auditLog).toMatchObject({
      clubId: club.id,
      actorId: member.id,
      targetUserId: member.id,
      entityType: 'club_member',
      entityId: membership.id,
    });
    expect(auditLog.metadata).toMatchObject({
      previousRole: ClubMemberRole.member,
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
      role: ClubMemberRole.owner,
    });
  });

  it('registra audit log ao remover membro', async () => {
    const { club, owner } = await createClubWithOwner();
    const { membership, user: target } = await createActiveMember(club.id);

    await prisma.club.update({
      where: {
        id: club.id,
      },
      data: {
        memberCount: 2,
      },
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/members/${target.id}/remove`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);

    expect(response.status).toBe(200);

    const auditLog = await findAuditLog('club_member_removed');

    expect(auditLog).toMatchObject({
      clubId: club.id,
      actorId: owner.id,
      targetUserId: target.id,
      entityType: 'club_member',
      entityId: membership.id,
    });
    expect(auditLog.metadata).toMatchObject({
      previousRole: ClubMemberRole.member,
    });
  });

  it('registra audit log ao alterar papel de membro', async () => {
    const { club, owner } = await createClubWithOwner();
    const { membership, user: target } = await createActiveMember(club.id);

    const response = await request(app)
      .patch(`/clubs/${club.id}/members/${target.id}/role`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        role: ClubMemberRole.moderator,
      });

    expect(response.status).toBe(200);

    const auditLog = await findAuditLog('club_member_role_updated');

    expect(auditLog).toMatchObject({
      clubId: club.id,
      actorId: owner.id,
      targetUserId: target.id,
      entityType: 'club_member',
      entityId: membership.id,
    });
    expect(auditLog.metadata).toMatchObject({
      previousRole: ClubMemberRole.member,
      newRole: ClubMemberRole.moderator,
    });
  });

  it('registra audit log ao transferir posse', async () => {
    const { club, owner } = await createClubWithOwner();
    const { user: target } = await createActiveMember(
      club.id,
      ClubMemberRole.admin,
    );

    await prisma.club.update({
      where: {
        id: club.id,
      },
      data: {
        memberCount: 2,
      },
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/transfer-ownership`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        newOwnerId: target.id,
      });

    expect(response.status).toBe(200);

    const auditLog = await findAuditLog('club_ownership_transferred');

    expect(auditLog).toMatchObject({
      clubId: club.id,
      actorId: owner.id,
      targetUserId: target.id,
      entityType: 'club',
      entityId: club.id,
    });
    expect(auditLog.metadata).toMatchObject({
      previousOwnerId: owner.id,
      newOwnerId: target.id,
      previousNewOwnerRole: ClubMemberRole.admin,
    });
  });
});
