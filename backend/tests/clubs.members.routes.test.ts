import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubStatus,
  ClubVisibility,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import clubsRoutes from '../src/routes/clubs/clubs.routes';
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

describe('clubs.members.routes', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('GET /clubs/:id/members retorna membros paginados', async () => {
    const owner = await createTestUser({ name: 'Owner Lista' });
    const firstMember = await createTestUser({ name: 'Membro Um' });
    const secondMember = await createTestUser({ name: 'Membro Dois' });
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 3,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(club.id, firstMember.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(club.id, secondMember.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.active,
    });

    const response = await request(app)
      .get(`/clubs/${club.id}/members`)
      .query({ page: 1, limit: 2 })
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      pagination: {
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      },
    });
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items[0]).toMatchObject({
      clubId: club.id,
      userId: expect.any(String),
      name: expect.any(String),
      role: expect.any(String),
      status: expect.any(String),
    });
  });

  it('GET /clubs/:id/members filtra por papel, status e busca por nome ou username', async () => {
    const owner = await createTestUser({ name: 'Owner Filtro' });
    const admin = await createTestUser({ name: 'Marina Admin' });
    const invited = await createTestUser({ name: 'Lucas Convidado' });
    const requested = await createTestUser({ name: 'Carla Pedido' });
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 2,
    });

    await prisma.user.update({
      where: {
        id: admin.id,
      },
      data: {
        username: 'marina-admin',
      },
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(club.id, admin.id, {
      role: ClubMemberRole.admin,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(club.id, invited.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.invited,
      joinedAt: null,
    });
    await addUserToClub(club.id, requested.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.requested,
      joinedAt: null,
    });

    const token = authTokenFor(owner);

    const roleResponse = await request(app)
      .get(`/clubs/${club.id}/members`)
      .query({ role: 'admin' })
      .set('Authorization', `Bearer ${token}`);
    const statusResponse = await request(app)
      .get(`/clubs/${club.id}/members`)
      .query({ status: 'requested' })
      .set('Authorization', `Bearer ${token}`);
    const searchResponse = await request(app)
      .get(`/clubs/${club.id}/members`)
      .query({ search: 'admin' })
      .set('Authorization', `Bearer ${token}`);

    expect(roleResponse.status).toBe(200);
    expect(roleResponse.body.items).toEqual([
      expect.objectContaining({
        userId: admin.id,
        role: ClubMemberRole.admin,
      }),
    ]);

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.items).toEqual([
      expect.objectContaining({
        userId: requested.id,
        status: ClubMemberStatus.requested,
      }),
    ]);

    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.items).toEqual([
      expect.objectContaining({
        userId: admin.id,
        username: 'marina-admin',
      }),
    ]);
  });

  it('GET /clubs/:id/members bloqueia outsider em clube privado', async () => {
    const owner = await createTestUser();
    const outsider = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      visibility: ClubVisibility.private,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    const response = await request(app)
      .get(`/clubs/${club.id}/members`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`);

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
  });

  it('GET /clubs/:id/members retorna 401 sem token', async () => {
    const owner = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
    });

    const response = await request(app).get(`/clubs/${club.id}/members`);

    expect(response.status).toBe(401);
  });

  it('POST /clubs/:id/join permite outsider entrar em clube publico ativo', async () => {
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
      .post(`/clubs/${club.id}/join`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      clubId: club.id,
      userId: outsider.id,
      role: ClubMemberRole.member,
      status: ClubMemberStatus.active,
      joinedAt: expect.any(String),
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
          actorId: outsider.id,
          targetUserId: outsider.id,
          action: 'club_joined',
        },
      }),
    ).resolves.toBe(1);
  });

  it.each([
    ClubMemberStatus.invited,
    ClubMemberStatus.requested,
    ClubMemberStatus.removed,
  ])(
    'POST /clubs/:id/join reativa membership com status %s',
    async (status) => {
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
        .post(`/clubs/${club.id}/join`)
        .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        userId: viewer.id,
        status: ClubMemberStatus.active,
      });

      await expect(
        prisma.club.findUniqueOrThrow({
          where: {
            id: club.id,
          },
        }),
      ).resolves.toMatchObject({
        memberCount: 2,
      });
    },
  );

  it('POST /clubs/:id/join rejeita usuario ja ativo', async () => {
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
      .post(`/clubs/${club.id}/join`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
  });

  it.each([
    [ClubVisibility.private, ClubStatus.active],
    [ClubVisibility.invite_only, ClubStatus.active],
    [ClubVisibility.public, ClubStatus.archived],
    [ClubVisibility.public, ClubStatus.suspended],
  ])(
    'POST /clubs/:id/join bloqueia visibility %s e status %s',
    async (visibility, status) => {
      const owner = await createTestUser();
      const outsider = await createTestUser();
      const club = await createTestClub({
        createdById: owner.id,
        visibility,
        status,
        memberCount: 1,
      });

      await addUserToClub(club.id, owner.id, {
        role: ClubMemberRole.owner,
        status: ClubMemberStatus.active,
      });

      const response = await request(app)
        .post(`/clubs/${club.id}/join`)
        .set('Authorization', `Bearer ${authTokenFor(outsider)}`);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        code: 'CLUB_VALIDATION_ERROR',
      });
    },
  );

  it('POST /clubs/:id/join retorna 404 para clube deletado e 401 sem token', async () => {
    const owner = await createTestUser();
    const outsider = await createTestUser();
    const deletedClub = await createTestClub({
      createdById: owner.id,
      status: ClubStatus.deleted,
    });

    const deletedResponse = await request(app)
      .post(`/clubs/${deletedClub.id}/join`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`);
    const unauthorizedResponse = await request(app).post(
      `/clubs/${deletedClub.id}/join`,
    );

    expect(deletedResponse.status).toBe(404);
    expect(deletedResponse.body).toMatchObject({
      code: 'CLUB_NOT_FOUND',
    });
    expect(unauthorizedResponse.status).toBe(401);
  });

  it('POST /clubs/:id/join-requests permite outsider solicitar entrada em clube privado ativo', async () => {
    const owner = await createTestUser();
    const outsider = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      visibility: ClubVisibility.private,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/join-requests`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`)
      .send({
        message: 'Quero participar',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      clubId: club.id,
      userId: outsider.id,
      status: ClubMemberStatus.requested,
      message: 'Quero participar',
      reviewedById: null,
      reviewedAt: null,
      approvedAt: null,
      rejectedAt: null,
      cancelledAt: null,
    });

    await expect(
      prisma.clubJoinRequest.count({
        where: {
          clubId: club.id,
          userId: outsider.id,
          status: ClubMemberStatus.requested,
        },
      }),
    ).resolves.toBe(1);

    await expect(
      prisma.clubMember.findUnique({
        where: {
          clubId_userId: {
            clubId: club.id,
            userId: outsider.id,
          },
        },
      }),
    ).resolves.toMatchObject({
      role: ClubMemberRole.member,
      status: ClubMemberStatus.requested,
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
          actorId: outsider.id,
          targetUserId: outsider.id,
          action: 'club_join_requested',
        },
      }),
    ).resolves.toBe(1);
  });

  it('POST /clubs/:id/join-requests rejeita usuario ativo e solicitacao pendente duplicada', async () => {
    const owner = await createTestUser();
    const activeMember = await createTestUser();
    const requester = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      visibility: ClubVisibility.private,
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
      .post(`/clubs/${club.id}/join-requests`)
      .set('Authorization', `Bearer ${authTokenFor(activeMember)}`);
    const firstRequest = await request(app)
      .post(`/clubs/${club.id}/join-requests`)
      .set('Authorization', `Bearer ${authTokenFor(requester)}`);
    const duplicateRequest = await request(app)
      .post(`/clubs/${club.id}/join-requests`)
      .set('Authorization', `Bearer ${authTokenFor(requester)}`);

    expect(activeResponse.status).toBe(400);
    expect(activeResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
    expect(firstRequest.status).toBe(201);
    expect(duplicateRequest.status).toBe(400);
    expect(duplicateRequest.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
  });

  it('POST /clubs/:id/join-requests reaproveita solicitacao antiga apos rejeicao', async () => {
    const owner = await createTestUser();
    const requester = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      visibility: ClubVisibility.private,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    const oldRequest = await prisma.clubJoinRequest.create({
      data: {
        clubId: club.id,
        userId: requester.id,
        status: ClubMemberStatus.removed,
        message: 'Pedido antigo',
        reviewedById: owner.id,
        reviewedAt: new Date(),
        rejectedAt: new Date(),
      },
    });
    await addUserToClub(club.id, requester.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.removed,
      joinedAt: null,
    });

    const requestResponse = await request(app)
      .post(`/clubs/${club.id}/join-requests`)
      .set('Authorization', `Bearer ${authTokenFor(requester)}`)
      .send({
        message: 'Quero tentar de novo',
      });
    const rejectResponse = await request(app)
      .post(`/clubs/join-requests/${oldRequest.id}/reject`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);

    expect(requestResponse.status).toBe(201);
    expect(requestResponse.body).toMatchObject({
      id: oldRequest.id,
      clubId: club.id,
      userId: requester.id,
      status: ClubMemberStatus.requested,
      message: 'Quero tentar de novo',
      reviewedById: null,
      reviewedAt: null,
      approvedAt: null,
      rejectedAt: null,
      cancelledAt: null,
    });
    expect(rejectResponse.status).toBe(200);
    expect(rejectResponse.body).toMatchObject({
      id: oldRequest.id,
      status: ClubMemberStatus.removed,
      reviewedById: owner.id,
      rejectedAt: expect.any(String),
    });

    await expect(
      prisma.clubJoinRequest.count({
        where: {
          clubId: club.id,
          userId: requester.id,
        },
      }),
    ).resolves.toBe(1);
  });

  it('POST /clubs/:id/join-requests reaproveita solicitacao antiga apos saida de membro aprovado', async () => {
    const owner = await createTestUser();
    const requester = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      visibility: ClubVisibility.private,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    const oldRequest = await prisma.clubJoinRequest.create({
      data: {
        clubId: club.id,
        userId: requester.id,
        status: ClubMemberStatus.active,
        message: 'Pedido aprovado antigo',
        reviewedById: owner.id,
        reviewedAt: new Date(),
        approvedAt: new Date(),
      },
    });
    await addUserToClub(club.id, requester.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.removed,
      joinedAt: null,
    });

    const requestResponse = await request(app)
      .post(`/clubs/${club.id}/join-requests`)
      .set('Authorization', `Bearer ${authTokenFor(requester)}`)
      .send({
        message: 'Voltei',
      });
    const approveResponse = await request(app)
      .post(`/clubs/join-requests/${oldRequest.id}/approve`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);

    expect(requestResponse.status).toBe(201);
    expect(requestResponse.body).toMatchObject({
      id: oldRequest.id,
      status: ClubMemberStatus.requested,
      message: 'Voltei',
      reviewedById: null,
      reviewedAt: null,
      approvedAt: null,
    });
    expect(approveResponse.status).toBe(200);
    expect(approveResponse.body).toMatchObject({
      id: oldRequest.id,
      status: ClubMemberStatus.active,
      reviewedById: owner.id,
      approvedAt: expect.any(String),
    });

    await expect(
      prisma.clubJoinRequest.count({
        where: {
          clubId: club.id,
          userId: requester.id,
        },
      }),
    ).resolves.toBe(1);
  });

  it.each([
    [ClubVisibility.public, ClubStatus.active],
    [ClubVisibility.invite_only, ClubStatus.active],
    [ClubVisibility.private, ClubStatus.archived],
    [ClubVisibility.private, ClubStatus.suspended],
  ])(
    'POST /clubs/:id/join-requests bloqueia visibility %s e status %s',
    async (visibility, status) => {
      const owner = await createTestUser();
      const outsider = await createTestUser();
      const club = await createTestClub({
        createdById: owner.id,
        visibility,
        status,
        memberCount: 1,
      });

      await addUserToClub(club.id, owner.id, {
        role: ClubMemberRole.owner,
        status: ClubMemberStatus.active,
      });

      const response = await request(app)
        .post(`/clubs/${club.id}/join-requests`)
        .set('Authorization', `Bearer ${authTokenFor(outsider)}`);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        code: 'CLUB_VALIDATION_ERROR',
      });
    },
  );

  it('POST /clubs/:id/join-requests retorna 404 para clube deletado e 401 sem token', async () => {
    const owner = await createTestUser();
    const outsider = await createTestUser();
    const deletedClub = await createTestClub({
      createdById: owner.id,
      visibility: ClubVisibility.private,
      status: ClubStatus.deleted,
    });

    const deletedResponse = await request(app)
      .post(`/clubs/${deletedClub.id}/join-requests`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`);
    const unauthorizedResponse = await request(app).post(
      `/clubs/${deletedClub.id}/join-requests`,
    );

    expect(deletedResponse.status).toBe(404);
    expect(deletedResponse.body).toMatchObject({
      code: 'CLUB_NOT_FOUND',
    });
    expect(unauthorizedResponse.status).toBe(401);
  });

  it('POST /clubs/join-requests/:id/approve permite owner aprovar solicitacao pendente', async () => {
    const owner = await createTestUser();
    const requester = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      visibility: ClubVisibility.private,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    const joinRequest = await prisma.clubJoinRequest.create({
      data: {
        clubId: club.id,
        userId: requester.id,
        status: ClubMemberStatus.requested,
      },
    });
    await addUserToClub(club.id, requester.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.requested,
      joinedAt: null,
    });

    const response = await request(app)
      .post(`/clubs/join-requests/${joinRequest.id}/approve`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: joinRequest.id,
      clubId: club.id,
      userId: requester.id,
      status: ClubMemberStatus.active,
      reviewedById: owner.id,
      reviewedAt: expect.any(String),
      approvedAt: expect.any(String),
      rejectedAt: null,
    });

    await expect(
      prisma.clubMember.findUniqueOrThrow({
        where: {
          clubId_userId: {
            clubId: club.id,
            userId: requester.id,
          },
        },
      }),
    ).resolves.toMatchObject({
      role: ClubMemberRole.member,
      status: ClubMemberStatus.active,
      joinedAt: expect.any(Date),
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
          actorId: owner.id,
          targetUserId: requester.id,
          action: 'club_join_request_approved',
        },
      }),
    ).resolves.toBe(1);
  });

  it('POST /clubs/join-requests/:id/approve permite admin aprovar solicitacao', async () => {
    const owner = await createTestUser();
    const admin = await createTestUser();
    const requester = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      visibility: ClubVisibility.private,
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
    const joinRequest = await prisma.clubJoinRequest.create({
      data: {
        clubId: club.id,
        userId: requester.id,
        status: ClubMemberStatus.requested,
      },
    });

    const response = await request(app)
      .post(`/clubs/join-requests/${joinRequest.id}/approve`)
      .set('Authorization', `Bearer ${authTokenFor(admin)}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: joinRequest.id,
      status: ClubMemberStatus.active,
      reviewedById: admin.id,
    });
  });

  it('POST /clubs/join-requests/:id/approve bloqueia membro comum e outsider', async () => {
    const owner = await createTestUser();
    const member = await createTestUser();
    const outsider = await createTestUser();
    const firstRequester = await createTestUser();
    const secondRequester = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      visibility: ClubVisibility.private,
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
    const firstRequest = await prisma.clubJoinRequest.create({
      data: {
        clubId: club.id,
        userId: firstRequester.id,
        status: ClubMemberStatus.requested,
      },
    });
    const secondRequest = await prisma.clubJoinRequest.create({
      data: {
        clubId: club.id,
        userId: secondRequester.id,
        status: ClubMemberStatus.requested,
      },
    });

    const memberResponse = await request(app)
      .post(`/clubs/join-requests/${firstRequest.id}/approve`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);
    const outsiderResponse = await request(app)
      .post(`/clubs/join-requests/${secondRequest.id}/approve`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`);

    expect(memberResponse.status).toBe(403);
    expect(memberResponse.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
    expect(outsiderResponse.status).toBe(403);
    expect(outsiderResponse.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
  });

  it('POST /clubs/join-requests/:id/approve valida solicitacao inexistente, ja revisada, clube arquivado e token ausente', async () => {
    const owner = await createTestUser();
    const requester = await createTestUser();
    const archivedRequester = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      visibility: ClubVisibility.private,
      memberCount: 1,
    });
    const archivedClub = await createTestClub({
      createdById: owner.id,
      visibility: ClubVisibility.private,
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
    const reviewedRequest = await prisma.clubJoinRequest.create({
      data: {
        clubId: club.id,
        userId: requester.id,
        status: ClubMemberStatus.active,
        reviewedById: owner.id,
        reviewedAt: new Date(),
        approvedAt: new Date(),
      },
    });
    const archivedRequest = await prisma.clubJoinRequest.create({
      data: {
        clubId: archivedClub.id,
        userId: archivedRequester.id,
        status: ClubMemberStatus.requested,
      },
    });

    const notFoundResponse = await request(app)
      .post('/clubs/join-requests/missing-request/approve')
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);
    const reviewedResponse = await request(app)
      .post(`/clubs/join-requests/${reviewedRequest.id}/approve`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);
    const archivedResponse = await request(app)
      .post(`/clubs/join-requests/${archivedRequest.id}/approve`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);
    const unauthorizedResponse = await request(app).post(
      `/clubs/join-requests/${archivedRequest.id}/approve`,
    );

    expect(notFoundResponse.status).toBe(404);
    expect(notFoundResponse.body).toMatchObject({
      code: 'CLUB_NOT_FOUND',
    });
    expect(reviewedResponse.status).toBe(400);
    expect(reviewedResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
    expect(archivedResponse.status).toBe(400);
    expect(archivedResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
    expect(unauthorizedResponse.status).toBe(401);
  });

  it('POST /clubs/join-requests/:id/reject permite admin rejeitar solicitacao pendente', async () => {
    const owner = await createTestUser();
    const admin = await createTestUser();
    const requester = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      visibility: ClubVisibility.private,
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
    const joinRequest = await prisma.clubJoinRequest.create({
      data: {
        clubId: club.id,
        userId: requester.id,
        status: ClubMemberStatus.requested,
      },
    });
    await addUserToClub(club.id, requester.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.requested,
      joinedAt: null,
    });

    const response = await request(app)
      .post(`/clubs/join-requests/${joinRequest.id}/reject`)
      .set('Authorization', `Bearer ${authTokenFor(admin)}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: joinRequest.id,
      clubId: club.id,
      userId: requester.id,
      status: ClubMemberStatus.removed,
      reviewedById: admin.id,
      reviewedAt: expect.any(String),
      approvedAt: null,
      rejectedAt: expect.any(String),
    });

    await expect(
      prisma.clubMember.findUniqueOrThrow({
        where: {
          clubId_userId: {
            clubId: club.id,
            userId: requester.id,
          },
        },
      }),
    ).resolves.toMatchObject({
      status: ClubMemberStatus.removed,
      joinedAt: null,
    });

    await expect(
      prisma.club.findUniqueOrThrow({
        where: {
          id: club.id,
        },
      }),
    ).resolves.toMatchObject({
      memberCount: 2,
    });

    await expect(
      prisma.clubAuditLog.count({
        where: {
          clubId: club.id,
          actorId: admin.id,
          targetUserId: requester.id,
          action: 'club_join_request_rejected',
        },
      }),
    ).resolves.toBe(1);
  });

  it('POST /clubs/join-requests/:id/reject permite owner rejeitar solicitacao sem membership pendente', async () => {
    const owner = await createTestUser();
    const requester = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      visibility: ClubVisibility.private,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    const joinRequest = await prisma.clubJoinRequest.create({
      data: {
        clubId: club.id,
        userId: requester.id,
        status: ClubMemberStatus.requested,
      },
    });

    const response = await request(app)
      .post(`/clubs/join-requests/${joinRequest.id}/reject`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: joinRequest.id,
      status: ClubMemberStatus.removed,
      reviewedById: owner.id,
    });
  });

  it('POST /clubs/join-requests/:id/reject bloqueia membro comum e outsider', async () => {
    const owner = await createTestUser();
    const member = await createTestUser();
    const outsider = await createTestUser();
    const firstRequester = await createTestUser();
    const secondRequester = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      visibility: ClubVisibility.private,
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
    const firstRequest = await prisma.clubJoinRequest.create({
      data: {
        clubId: club.id,
        userId: firstRequester.id,
        status: ClubMemberStatus.requested,
      },
    });
    const secondRequest = await prisma.clubJoinRequest.create({
      data: {
        clubId: club.id,
        userId: secondRequester.id,
        status: ClubMemberStatus.requested,
      },
    });

    const memberResponse = await request(app)
      .post(`/clubs/join-requests/${firstRequest.id}/reject`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);
    const outsiderResponse = await request(app)
      .post(`/clubs/join-requests/${secondRequest.id}/reject`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`);

    expect(memberResponse.status).toBe(403);
    expect(memberResponse.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
    expect(outsiderResponse.status).toBe(403);
    expect(outsiderResponse.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
  });

  it('POST /clubs/join-requests/:id/reject valida solicitacao inexistente, ja revisada, clube suspenso e token ausente', async () => {
    const owner = await createTestUser();
    const requester = await createTestUser();
    const suspendedRequester = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      visibility: ClubVisibility.private,
      memberCount: 1,
    });
    const suspendedClub = await createTestClub({
      createdById: owner.id,
      visibility: ClubVisibility.private,
      status: ClubStatus.suspended,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(suspendedClub.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    const reviewedRequest = await prisma.clubJoinRequest.create({
      data: {
        clubId: club.id,
        userId: requester.id,
        status: ClubMemberStatus.removed,
        reviewedById: owner.id,
        reviewedAt: new Date(),
        rejectedAt: new Date(),
      },
    });
    const suspendedRequest = await prisma.clubJoinRequest.create({
      data: {
        clubId: suspendedClub.id,
        userId: suspendedRequester.id,
        status: ClubMemberStatus.requested,
      },
    });

    const notFoundResponse = await request(app)
      .post('/clubs/join-requests/missing-request/reject')
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);
    const reviewedResponse = await request(app)
      .post(`/clubs/join-requests/${reviewedRequest.id}/reject`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);
    const suspendedResponse = await request(app)
      .post(`/clubs/join-requests/${suspendedRequest.id}/reject`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);
    const unauthorizedResponse = await request(app).post(
      `/clubs/join-requests/${suspendedRequest.id}/reject`,
    );

    expect(notFoundResponse.status).toBe(404);
    expect(notFoundResponse.body).toMatchObject({
      code: 'CLUB_NOT_FOUND',
    });
    expect(reviewedResponse.status).toBe(400);
    expect(reviewedResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
    expect(suspendedResponse.status).toBe(400);
    expect(suspendedResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
    expect(unauthorizedResponse.status).toBe(401);
  });
});
