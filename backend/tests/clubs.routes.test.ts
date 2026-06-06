import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubVisibility,
} from '../src/generated/prisma/client';
import clubsRoutes from '../src/routes/clubs/clubs.routes';
import { prisma } from '../src/lib/prisma';
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

describe('clubs.routes', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('retorna 401 sem token', async () => {
    const response = await request(app).get('/clubs/my');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      error: expect.any(String),
    });
  });

  it('POST /clubs cria clube autenticado com owner e membro inicial', async () => {
    const creator = await createTestUser();
    const member = await createTestUser();

    const response = await request(app)
      .post('/clubs')
      .set('Authorization', `Bearer ${authTokenFor(creator)}`)
      .send({
        name: 'Clube das Rotas',
      description: 'Criado via rota',
      iconName: 'groups',
      avatarUrl: 'https://cdn.example.com/clubs/avatar-rota.png',
      coverUrl: 'https://cdn.example.com/clubs/capa-rota.png',
      visibility: 'public',
        initialMemberIds: [member.id],
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: 'Clube das Rotas',
      slug: 'clube-das-rotas',
      avatarUrl: 'https://cdn.example.com/clubs/avatar-rota.png',
      coverUrl: 'https://cdn.example.com/clubs/capa-rota.png',
      memberCount: 2,
      viewerMembership: {
        isMember: true,
        role: ClubMemberRole.owner,
        status: ClubMemberStatus.active,
      },
    });

    await expect(
      prisma.clubMember.count({
        where: {
          clubId: response.body.id,
        },
      }),
    ).resolves.toBe(2);
  });

  it('POST /clubs retorna erro padronizado de validacao', async () => {
    const creator = await createTestUser();

    const response = await request(app)
      .post('/clubs')
      .set('Authorization', `Bearer ${authTokenFor(creator)}`)
      .send({
        name: 'AB',
        iconName: 'icone-inexistente',
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
  });

  it('GET /clubs/my, /discover e /search retornam listas do usuario', async () => {
    const owner = await createTestUser();
    const viewer = await createTestUser();
    const myClub = await createTestClub({
      createdById: owner.id,
      name: 'Meu Clube Rota',
      memberCount: 2,
      tags: ['rota'],
      avatarUrl: 'https://cdn.example.com/clubs/avatar-my.png',
      coverUrl: 'https://cdn.example.com/clubs/capa-my.png',
    });
    const discoverClub = await createTestClub({
      createdById: owner.id,
      name: 'Clube Descoberta',
      memberCount: 1,
      avatarUrl: 'https://cdn.example.com/clubs/avatar-discover.png',
    });

    await addUserToClub(myClub.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(myClub.id, viewer.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(discoverClub.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    const token = authTokenFor(viewer);

    const myResponse = await request(app)
      .get('/clubs/my')
      .set('Authorization', `Bearer ${token}`);
    const discoverResponse = await request(app)
      .get('/clubs/discover')
      .set('Authorization', `Bearer ${token}`);
    const searchResponse = await request(app)
      .get('/clubs/search')
      .query({ query: 'rota' })
      .set('Authorization', `Bearer ${token}`);

    expect(myResponse.status).toBe(200);
    expect(myResponse.body).toEqual([
      expect.objectContaining({
        id: myClub.id,
        avatarUrl: 'https://cdn.example.com/clubs/avatar-my.png',
        viewerMembership: expect.objectContaining({
          role: ClubMemberRole.member,
        }),
      }),
    ]);

    expect(discoverResponse.status).toBe(200);
    expect(discoverResponse.body.suggested).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: discoverClub.id,
          avatarUrl: 'https://cdn.example.com/clubs/avatar-discover.png',
        }),
      ]),
    );

    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body).toEqual([
      expect.objectContaining({
        id: myClub.id,
        avatarUrl: 'https://cdn.example.com/clubs/avatar-my.png',
      }),
    ]);
  });

  it('GET /clubs/:id retorna detalhe e bloqueia clube privado para outsider', async () => {
    const owner = await createTestUser();
    const outsider = await createTestUser();
    const publicClub = await createTestClub({
      createdById: owner.id,
      name: 'Publico',
      memberCount: 1,
      avatarUrl: 'https://cdn.example.com/clubs/avatar-detalhe.png',
      coverUrl: 'https://cdn.example.com/clubs/capa-detalhe.png',
    });
    const privateClub = await createTestClub({
      createdById: owner.id,
      name: 'Privado',
      visibility: ClubVisibility.private,
      memberCount: 1,
    });

    await addUserToClub(publicClub.id, owner.id, {
      role: ClubMemberRole.owner,
    });
    await addUserToClub(privateClub.id, owner.id, {
      role: ClubMemberRole.owner,
    });

    const token = authTokenFor(outsider);

    const publicResponse = await request(app)
      .get(`/clubs/${publicClub.id}`)
      .set('Authorization', `Bearer ${token}`);
    const privateResponse = await request(app)
      .get(`/clubs/${privateClub.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(publicResponse.status).toBe(200);
    expect(publicResponse.body).toMatchObject({
      id: publicClub.id,
      avatarUrl: 'https://cdn.example.com/clubs/avatar-detalhe.png',
      coverUrl: 'https://cdn.example.com/clubs/capa-detalhe.png',
      permissions: {
        canViewFeed: true,
        canEditClub: false,
      },
    });

    expect(privateResponse.status).toBe(403);
    expect(privateResponse.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
  });

  it('PATCH, DELETE e POST /restore respeitam autorizacao de owner', async () => {
    const owner = await createTestUser();
    const member = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      name: 'Clube Editavel',
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

    const forbiddenPatch = await request(app)
      .patch(`/clubs/${club.id}`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        avatarUrl: 'https://cdn.example.com/clubs/avatar-proibido.png',
      });

    expect(forbiddenPatch.status).toBe(403);
    expect(forbiddenPatch.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });

    const patchResponse = await request(app)
      .patch(`/clubs/${club.id}`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        name: 'Clube Atualizado',
        rules: 'Novas regras',
        avatarUrl: 'https://cdn.example.com/clubs/avatar-atualizado.png',
        coverUrl: 'https://cdn.example.com/clubs/capa-atualizada.png',
      });

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body).toMatchObject({
      id: club.id,
      name: 'Clube Atualizado',
      rules: 'Novas regras',
      avatarUrl: 'https://cdn.example.com/clubs/avatar-atualizado.png',
      coverUrl: 'https://cdn.example.com/clubs/capa-atualizada.png',
    });

    const removeMediaResponse = await request(app)
      .patch(`/clubs/${club.id}`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        avatarUrl: null,
        coverUrl: null,
      });

    expect(removeMediaResponse.status).toBe(200);
    expect(removeMediaResponse.body).toMatchObject({
      id: club.id,
      avatarUrl: null,
      coverUrl: null,
    });

    const deleteResponse = await request(app)
      .delete(`/clubs/${club.id}`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);

    expect(deleteResponse.status).toBe(204);

    const restoreResponse = await request(app)
      .post(`/clubs/${club.id}/restore`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);

    expect(restoreResponse.status).toBe(200);
    expect(restoreResponse.body).toMatchObject({
      id: club.id,
      status: 'active',
      archivedAt: null,
    });
  });

  it('PATCH /clubs/:id permite admin alterar midia de clube', async () => {
    const owner = await createTestUser();
    const admin = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      name: 'Clube Admin Midia',
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
      .patch(`/clubs/${club.id}`)
      .set('Authorization', `Bearer ${authTokenFor(admin)}`)
      .send({
        avatarUrl: 'https://cdn.example.com/clubs/avatar-admin.png',
        coverUrl: 'https://cdn.example.com/clubs/capa-admin.png',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: club.id,
      avatarUrl: 'https://cdn.example.com/clubs/avatar-admin.png',
      coverUrl: 'https://cdn.example.com/clubs/capa-admin.png',
    });
  });
});
