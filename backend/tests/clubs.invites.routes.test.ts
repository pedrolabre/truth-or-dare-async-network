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

describe('clubs.invites.routes', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('POST /clubs/:id/invites permite owner convidar usuario existente', async () => {
    const owner = await createTestUser();
    const invitee = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/invites`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        userId: invitee.id,
        message: 'Vem jogar com a gente',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      clubId: club.id,
      inviteeId: invitee.id,
      inviterId: owner.id,
      status: ClubMemberStatus.invited,
      message: 'Vem jogar com a gente',
    });

    await expect(
      prisma.clubInvite.count({
        where: {
          clubId: club.id,
          inviteeId: invitee.id,
          status: ClubMemberStatus.invited,
        },
      }),
    ).resolves.toBe(1);

    await expect(
      prisma.clubMember.findUnique({
        where: {
          clubId_userId: {
            clubId: club.id,
            userId: invitee.id,
          },
        },
      }),
    ).resolves.toMatchObject({
      role: ClubMemberRole.member,
      status: ClubMemberStatus.invited,
      invitedById: owner.id,
      joinedAt: null,
    });

    await expect(
      prisma.clubAuditLog.count({
        where: {
          clubId: club.id,
          actorId: owner.id,
          targetUserId: invitee.id,
          action: 'club_invite_created',
        },
      }),
    ).resolves.toBe(1);

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

  it('POST /clubs/:id/invites permite admin convidar usuario', async () => {
    const owner = await createTestUser();
    const admin = await createTestUser();
    const invitee = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 2,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(club.id, admin.id, {
      role: ClubMemberRole.admin,
      status: ClubMemberStatus.active,
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/invites`)
      .set('Authorization', `Bearer ${authTokenFor(admin)}`)
      .send({
        userId: invitee.id,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      inviteeId: invitee.id,
      inviterId: admin.id,
      status: ClubMemberStatus.invited,
    });
  });

  it('POST /clubs/:id/invites bloqueia membro comum', async () => {
    const owner = await createTestUser();
    const member = await createTestUser();
    const invitee = await createTestUser();
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
      .post(`/clubs/${club.id}/invites`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        userId: invitee.id,
      });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
  });

  it('POST /clubs/:id/invites rejeita usuario ja ativo e convite pendente duplicado', async () => {
    const owner = await createTestUser();
    const activeMember = await createTestUser();
    const invitee = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 2,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(club.id, activeMember.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.active,
    });

    const activeResponse = await request(app)
      .post(`/clubs/${club.id}/invites`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        userId: activeMember.id,
      });

    expect(activeResponse.status).toBe(400);
    expect(activeResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });

    const firstInvite = await request(app)
      .post(`/clubs/${club.id}/invites`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        userId: invitee.id,
      });
    const duplicateInvite = await request(app)
      .post(`/clubs/${club.id}/invites`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        userId: invitee.id,
      });

    expect(firstInvite.status).toBe(201);
    expect(duplicateInvite.status).toBe(400);
    expect(duplicateInvite.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
  });

  it('POST /clubs/:id/invites retorna 401 sem token', async () => {
    const owner = await createTestUser();
    const invitee = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/invites`)
      .send({
        userId: invitee.id,
      });

    expect(response.status).toBe(401);
  });

  it('GET /clubs/invites/my lista apenas convites recebidos pelo usuario autenticado', async () => {
    const owner = await createTestUser({ name: 'Owner Convite' });
    const secondOwner = await createTestUser({ name: 'Outro Owner' });
    const invitee = await createTestUser({ name: 'Pessoa Convidada' });
    const otherInvitee = await createTestUser({ name: 'Outra Pessoa' });
    const club = await createTestClub({
      createdById: owner.id,
      name: 'Clube Convite Recebido',
      memberCount: 1,
    });
    const otherClub = await createTestClub({
      createdById: secondOwner.id,
      name: 'Outro Clube',
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(otherClub.id, secondOwner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    await request(app)
      .post(`/clubs/${club.id}/invites`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        userId: invitee.id,
        message: 'Convite certo',
      });
    await request(app)
      .post(`/clubs/${otherClub.id}/invites`)
      .set('Authorization', `Bearer ${authTokenFor(secondOwner)}`)
      .send({
        userId: otherInvitee.id,
        message: 'Convite de outra pessoa',
      });

    const response = await request(app)
      .get('/clubs/invites/my')
      .set('Authorization', `Bearer ${authTokenFor(invitee)}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([
      expect.objectContaining({
        clubId: club.id,
        inviteeId: invitee.id,
        inviterId: owner.id,
        status: ClubMemberStatus.invited,
        message: 'Convite certo',
        club: expect.objectContaining({
          id: club.id,
          name: 'Clube Convite Recebido',
          memberCount: 1,
        }),
        inviter: expect.objectContaining({
          id: owner.id,
          name: 'Owner Convite',
        }),
      }),
    ]);
  });

  it('GET /clubs/invites/my nao lista convites de clube deletado e retorna vazio quando nao ha convites', async () => {
    const owner = await createTestUser();
    const invitee = await createTestUser();
    const withoutInvites = await createTestUser();
    const deletedClub = await createTestClub({
      createdById: owner.id,
      status: ClubStatus.deleted,
      memberCount: 1,
    });

    await prisma.clubInvite.create({
      data: {
        clubId: deletedClub.id,
        inviterId: owner.id,
        inviteeId: invitee.id,
        status: ClubMemberStatus.invited,
      },
    });

    const deletedResponse = await request(app)
      .get('/clubs/invites/my')
      .set('Authorization', `Bearer ${authTokenFor(invitee)}`);
    const emptyResponse = await request(app)
      .get('/clubs/invites/my')
      .set('Authorization', `Bearer ${authTokenFor(withoutInvites)}`);

    expect(deletedResponse.status).toBe(200);
    expect(deletedResponse.body).toEqual({
      items: [],
    });
    expect(emptyResponse.status).toBe(200);
    expect(emptyResponse.body).toEqual({
      items: [],
    });
  });

  it('GET /clubs/invites/my retorna 401 sem token', async () => {
    const response = await request(app).get('/clubs/invites/my');

    expect(response.status).toBe(401);
  });

  it('POST /clubs/invites/:id/accept permite convidado aceitar convite pendente', async () => {
    const owner = await createTestUser();
    const invitee = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

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
    expect(acceptResponse.body).toMatchObject({
      id: inviteResponse.body.id,
      clubId: club.id,
      inviteeId: invitee.id,
      status: ClubMemberStatus.active,
      acceptedAt: expect.any(String),
    });

    await expect(
      prisma.clubMember.findUnique({
        where: {
          clubId_userId: {
            clubId: club.id,
            userId: invitee.id,
          },
        },
      }),
    ).resolves.toMatchObject({
      role: ClubMemberRole.member,
      status: ClubMemberStatus.active,
      invitedById: owner.id,
    });

    await expect(
      prisma.club.findUniqueOrThrow({
        where: {
          id: club.id,
        },
      }),
    ).resolves.toMatchObject({
      memberCount: 2,
      lastActivityAt: expect.any(Date),
    });

    await expect(
      prisma.clubAuditLog.count({
        where: {
          clubId: club.id,
          actorId: invitee.id,
          targetUserId: invitee.id,
          action: 'club_invite_accepted',
        },
      }),
    ).resolves.toBe(1);
  });

  it('POST /clubs/invites/:id/accept bloqueia usuario diferente do convidado', async () => {
    const owner = await createTestUser();
    const invitee = await createTestUser();
    const outsider = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    const inviteResponse = await request(app)
      .post(`/clubs/${club.id}/invites`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        userId: invitee.id,
      });
    const acceptResponse = await request(app)
      .post(`/clubs/invites/${inviteResponse.body.id}/accept`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`);

    expect(acceptResponse.status).toBe(403);
    expect(acceptResponse.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
  });

  it('POST /clubs/invites/:id/accept rejeita convite inexistente, nao pendente e clube arquivado', async () => {
    const owner = await createTestUser();
    const invitee = await createTestUser();
    const secondInvitee = await createTestUser();
    const archivedInvitee = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 1,
    });
    const archivedClub = await createTestClub({
      createdById: owner.id,
      status: ClubStatus.archived,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(archivedClub.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    const acceptedInvite = await prisma.clubInvite.create({
      data: {
        clubId: club.id,
        inviterId: owner.id,
        inviteeId: invitee.id,
        status: ClubMemberStatus.active,
        acceptedAt: new Date(),
      },
    });
    const archivedInvite = await prisma.clubInvite.create({
      data: {
        clubId: archivedClub.id,
        inviterId: owner.id,
        inviteeId: archivedInvitee.id,
        status: ClubMemberStatus.invited,
      },
    });

    const notFoundResponse = await request(app)
      .post('/clubs/invites/convite-inexistente/accept')
      .set('Authorization', `Bearer ${authTokenFor(secondInvitee)}`);
    const notPendingResponse = await request(app)
      .post(`/clubs/invites/${acceptedInvite.id}/accept`)
      .set('Authorization', `Bearer ${authTokenFor(invitee)}`);
    const archivedResponse = await request(app)
      .post(`/clubs/invites/${archivedInvite.id}/accept`)
      .set('Authorization', `Bearer ${authTokenFor(archivedInvitee)}`);

    expect(notFoundResponse.status).toBe(404);
    expect(notFoundResponse.body).toMatchObject({
      code: 'CLUB_NOT_FOUND',
    });
    expect(notPendingResponse.status).toBe(400);
    expect(notPendingResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
    expect(archivedResponse.status).toBe(400);
    expect(archivedResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
  });

  it('POST /clubs/invites/:id/accept retorna 401 sem token', async () => {
    const response = await request(app).post('/clubs/invites/qualquer/accept');

    expect(response.status).toBe(401);
  });

  it('POST /clubs/invites/:id/decline permite convidado recusar convite pendente', async () => {
    const owner = await createTestUser();
    const invitee = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    const inviteResponse = await request(app)
      .post(`/clubs/${club.id}/invites`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        userId: invitee.id,
      });
    const declineResponse = await request(app)
      .post(`/clubs/invites/${inviteResponse.body.id}/decline`)
      .set('Authorization', `Bearer ${authTokenFor(invitee)}`);

    expect(declineResponse.status).toBe(200);
    expect(declineResponse.body).toMatchObject({
      id: inviteResponse.body.id,
      clubId: club.id,
      inviteeId: invitee.id,
      status: ClubMemberStatus.removed,
      declinedAt: expect.any(String),
    });

    await expect(
      prisma.clubMember.findUnique({
        where: {
          clubId_userId: {
            clubId: club.id,
            userId: invitee.id,
          },
        },
      }),
    ).resolves.toMatchObject({
      role: ClubMemberRole.member,
      status: ClubMemberStatus.removed,
      invitedById: owner.id,
      joinedAt: null,
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
          actorId: invitee.id,
          targetUserId: invitee.id,
          action: 'club_invite_declined',
        },
      }),
    ).resolves.toBe(1);
  });

  it('POST /clubs/invites/:id/decline bloqueia usuario diferente do convidado', async () => {
    const owner = await createTestUser();
    const invitee = await createTestUser();
    const outsider = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    const inviteResponse = await request(app)
      .post(`/clubs/${club.id}/invites`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        userId: invitee.id,
      });
    const declineResponse = await request(app)
      .post(`/clubs/invites/${inviteResponse.body.id}/decline`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`);

    expect(declineResponse.status).toBe(403);
    expect(declineResponse.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
  });

  it('POST /clubs/invites/:id/decline rejeita convite inexistente, nao pendente e clube deletado', async () => {
    const owner = await createTestUser();
    const invitee = await createTestUser();
    const secondInvitee = await createTestUser();
    const deletedInvitee = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 1,
    });
    const deletedClub = await createTestClub({
      createdById: owner.id,
      status: ClubStatus.deleted,
      memberCount: 1,
    });

    const acceptedInvite = await prisma.clubInvite.create({
      data: {
        clubId: club.id,
        inviterId: owner.id,
        inviteeId: invitee.id,
        status: ClubMemberStatus.active,
        acceptedAt: new Date(),
      },
    });
    const deletedInvite = await prisma.clubInvite.create({
      data: {
        clubId: deletedClub.id,
        inviterId: owner.id,
        inviteeId: deletedInvitee.id,
        status: ClubMemberStatus.invited,
      },
    });

    const notFoundResponse = await request(app)
      .post('/clubs/invites/convite-inexistente/decline')
      .set('Authorization', `Bearer ${authTokenFor(secondInvitee)}`);
    const notPendingResponse = await request(app)
      .post(`/clubs/invites/${acceptedInvite.id}/decline`)
      .set('Authorization', `Bearer ${authTokenFor(invitee)}`);
    const deletedResponse = await request(app)
      .post(`/clubs/invites/${deletedInvite.id}/decline`)
      .set('Authorization', `Bearer ${authTokenFor(deletedInvitee)}`);

    expect(notFoundResponse.status).toBe(404);
    expect(notFoundResponse.body).toMatchObject({
      code: 'CLUB_NOT_FOUND',
    });
    expect(notPendingResponse.status).toBe(400);
    expect(notPendingResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
    expect(deletedResponse.status).toBe(404);
    expect(deletedResponse.body).toMatchObject({
      code: 'CLUB_NOT_FOUND',
    });
  });

  it('POST /clubs/invites/:id/decline permite recusar convite de clube arquivado', async () => {
    const owner = await createTestUser();
    const invitee = await createTestUser();
    const archivedClub = await createTestClub({
      createdById: owner.id,
      status: ClubStatus.archived,
      memberCount: 1,
    });
    const invite = await prisma.clubInvite.create({
      data: {
        clubId: archivedClub.id,
        inviterId: owner.id,
        inviteeId: invitee.id,
        status: ClubMemberStatus.invited,
      },
    });

    await addUserToClub(archivedClub.id, invitee.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.invited,
      joinedAt: null,
    });

    const response = await request(app)
      .post(`/clubs/invites/${invite.id}/decline`)
      .set('Authorization', `Bearer ${authTokenFor(invitee)}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: invite.id,
      status: ClubMemberStatus.removed,
      declinedAt: expect.any(String),
    });
  });

  it('POST /clubs/invites/:id/decline retorna 401 sem token', async () => {
    const response = await request(app).post('/clubs/invites/qualquer/decline');

    expect(response.status).toBe(401);
  });
});
