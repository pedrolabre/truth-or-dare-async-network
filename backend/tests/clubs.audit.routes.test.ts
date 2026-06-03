import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubStatus,
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

async function createClubWithRoles() {
  const owner = await createTestUser({
    name: 'Owner Auditoria',
  });
  const admin = await createTestUser({
    name: 'Admin Auditoria',
  });
  const member = await createTestUser({
    name: 'Membro Auditoria',
  });
  const outsider = await createTestUser({
    name: 'Nao Membro Auditoria',
  });
  const target = await createTestUser({
    name: 'Alvo Auditoria',
  });
  const club = await createTestClub({
    createdById: owner.id,
    memberCount: 4,
  });

  await addUserToClub(club.id, owner.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, admin.id, {
    role: ClubMemberRole.admin,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, member.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, target.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
  });

  return {
    admin,
    club,
    member,
    outsider,
    owner,
    target,
  };
}

describe('clubs.audit.routes', () => {
  const app = createTestApp();

  applyTestDatabaseHooks({
    resetBeforeEach: false,
    resetAfterAll: false,
    disconnectAfterAll: false,
  });

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  afterAll(async () => {
    await resetFeedData({ deleteUsers: true });
    await prisma.$disconnect();
  });

  it('exige token para consultar auditoria do clube', async () => {
    const { club } = await createClubWithRoles();

    const response = await request(app).get(`/clubs/${club.id}/audit-logs`);

    expect(response.status).toBe(401);
  });

  it('permite owner e admin consultarem auditoria com payload enxuto e metadata sanitizado', async () => {
    const { admin, club, owner, target } = await createClubWithRoles();
    const auditLog = await prisma.clubAuditLog.create({
      data: {
        clubId: club.id,
        actorId: owner.id,
        targetUserId: target.id,
        action: 'club_member_role_updated',
        entityType: 'club_member',
        entityId: 'membership-audit-1',
        metadata: {
          previousRole: ClubMemberRole.member,
          newRole: ClubMemberRole.admin,
          passwordHash: 'nao deve sair',
          nested: {
            visible: true,
            token: 'nao deve sair',
          },
          rawPayload: {
            authorization: 'Bearer segredo',
          },
        },
        createdAt: new Date('2026-06-03T10:00:00.000Z'),
      },
    });

    const ownerResponse = await request(app)
      .get(`/clubs/${club.id}/audit-logs`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);
    const adminResponse = await request(app)
      .get(`/clubs/${club.id}/audit-logs`)
      .set('Authorization', `Bearer ${authTokenFor(admin)}`);

    expect(ownerResponse.status).toBe(200);
    expect(adminResponse.status).toBe(200);
    expect(ownerResponse.body).toEqual({
      items: [
        {
          id: auditLog.id,
          action: 'club_member_role_updated',
          actorId: owner.id,
          targetUserId: target.id,
          entityType: 'club_member',
          entityId: 'membership-audit-1',
          metadata: {
            previousRole: ClubMemberRole.member,
            newRole: ClubMemberRole.admin,
            nested: {
              visible: true,
            },
          },
          createdAt: '2026-06-03T10:00:00.000Z',
        },
      ],
      nextCursor: null,
    });
    expect(JSON.stringify(ownerResponse.body)).not.toContain('passwordHash');
    expect(JSON.stringify(ownerResponse.body)).not.toContain('Bearer segredo');
    expect(adminResponse.body.items[0].id).toBe(auditLog.id);
  });

  it('bloqueia nao membro e membro comum de consultar auditoria completa', async () => {
    const { club, member, outsider, owner } = await createClubWithRoles();

    await prisma.clubAuditLog.create({
      data: {
        clubId: club.id,
        actorId: owner.id,
        action: 'club_invite_created',
        entityType: 'club_invite',
        entityId: 'invite-audit-1',
      },
    });

    const memberResponse = await request(app)
      .get(`/clubs/${club.id}/audit-logs`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);
    const outsiderResponse = await request(app)
      .get(`/clubs/${club.id}/audit-logs`)
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

  it('retorna 404 para clube inexistente ou deletado', async () => {
    const { club, owner } = await createClubWithRoles();
    const token = authTokenFor(owner);

    await prisma.club.update({
      where: {
        id: club.id,
      },
      data: {
        status: ClubStatus.deleted,
        deletedAt: new Date(),
      },
    });

    const deletedResponse = await request(app)
      .get(`/clubs/${club.id}/audit-logs`)
      .set('Authorization', `Bearer ${token}`);
    const missingResponse = await request(app)
      .get('/clubs/clube-inexistente/audit-logs')
      .set('Authorization', `Bearer ${token}`);

    expect(deletedResponse.status).toBe(404);
    expect(missingResponse.status).toBe(404);
  });

  it('aplica filtros opcionais de auditoria', async () => {
    const { club, owner, target } = await createClubWithRoles();

    await prisma.clubAuditLog.createMany({
      data: [
        {
          clubId: club.id,
          actorId: owner.id,
          targetUserId: target.id,
          action: 'club_member_removed',
          entityType: 'club_member',
          entityId: 'membership-filter-1',
          createdAt: new Date('2026-06-03T09:00:00.000Z'),
        },
        {
          clubId: club.id,
          actorId: owner.id,
          targetUserId: target.id,
          action: 'club_member_role_updated',
          entityType: 'club_member',
          entityId: 'membership-filter-2',
          createdAt: new Date('2026-06-03T10:00:00.000Z'),
        },
        {
          clubId: club.id,
          actorId: owner.id,
          action: 'club_invite_created',
          entityType: 'club_invite',
          entityId: 'invite-filter-1',
          createdAt: new Date('2026-06-03T11:00:00.000Z'),
        },
      ],
    });

    const response = await request(app)
      .get(`/clubs/${club.id}/audit-logs`)
      .query({
        action: 'club_member_role_updated',
        targetUserId: target.id,
        entityType: 'club_member',
        from: '2026-06-03T09:30:00.000Z',
        to: '2026-06-03T10:30:00.000Z',
      })
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([
      expect.objectContaining({
        action: 'club_member_role_updated',
        targetUserId: target.id,
        entityType: 'club_member',
        entityId: 'membership-filter-2',
      }),
    ]);
  });

  it('pagina auditoria por cursor e limit com limite defensivo', async () => {
    const { club, owner } = await createClubWithRoles();

    const logs = await Promise.all(
      [1, 2, 3].map((index) =>
        prisma.clubAuditLog.create({
          data: {
            clubId: club.id,
            actorId: owner.id,
            action: `audit_paginated_${index}`,
            entityType: 'club',
            entityId: club.id,
            createdAt: new Date(`2026-06-03T10:0${index}:00.000Z`),
          },
        }),
      ),
    );
    const token = authTokenFor(owner);
    const firstPage = await request(app)
      .get(`/clubs/${club.id}/audit-logs`)
      .query({
        limit: 2,
      })
      .set('Authorization', `Bearer ${token}`);
    const secondPage = await request(app)
      .get(`/clubs/${club.id}/audit-logs`)
      .query({
        limit: 999,
        cursor: firstPage.body.nextCursor,
      })
      .set('Authorization', `Bearer ${token}`);

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.items.map((item: { id: string }) => item.id)).toEqual([
      logs[2].id,
      logs[1].id,
    ]);
    expect(firstPage.body.nextCursor).toBe(logs[1].id);
    expect(secondPage.status).toBe(200);
    expect(secondPage.body.items.map((item: { id: string }) => item.id)).toEqual([
      logs[0].id,
    ]);
    expect(secondPage.body.nextCursor).toBeNull();
  });
});
