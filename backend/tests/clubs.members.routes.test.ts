import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubVisibility,
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
});
