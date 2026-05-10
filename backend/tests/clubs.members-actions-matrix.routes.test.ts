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

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

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

async function createMatrixClub() {
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

async function addViewer(
  clubId: string,
  role: ClubMemberRole,
  status: ClubMemberStatus = ClubMemberStatus.active,
) {
  const viewer = await createTestUser();

  await addUserToClub(clubId, viewer.id, {
    role,
    status,
    joinedAt: status === ClubMemberStatus.active ? new Date() : null,
  });

  if (status === ClubMemberStatus.active) {
    await prisma.club.update({
      where: {
        id: clubId,
      },
      data: {
        memberCount: {
          increment: 1,
        },
      },
    });
  }

  return viewer;
}

async function addTargetMember(
  clubId: string,
  role: ClubMemberRole = ClubMemberRole.member,
) {
  return addViewer(clubId, role, ClubMemberStatus.active);
}

async function requestAs(
  app: express.Express,
  viewer: TestUser,
  method: 'post' | 'patch',
  path: string,
  body?: Record<string, unknown>,
) {
  const pending = request(app)[method](path).set(
    'Authorization',
    `Bearer ${authTokenFor(viewer)}`,
  );

  return body ? pending.send(body) : pending;
}

describe('clubs.members-actions-matrix.routes', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it.each([
    {
      actorRole: ClubMemberRole.owner,
      targetRole: ClubMemberRole.member,
      expectedStatus: 200,
    },
    {
      actorRole: ClubMemberRole.admin,
      targetRole: ClubMemberRole.moderator,
      expectedStatus: 200,
    },
    {
      actorRole: ClubMemberRole.moderator,
      targetRole: ClubMemberRole.member,
      expectedStatus: 200,
    },
    {
      actorRole: ClubMemberRole.member,
      targetRole: ClubMemberRole.member,
      expectedStatus: 403,
    },
  ])(
    'matriz de remocao: $actorRole removendo $targetRole retorna $expectedStatus',
    async ({ actorRole, targetRole, expectedStatus }) => {
      const { club, owner } = await createMatrixClub();
      const actor =
        actorRole === ClubMemberRole.owner
          ? owner
          : await addViewer(club.id, actorRole);
      const target = await addTargetMember(club.id, targetRole);

      const response = await requestAs(
        app,
        actor,
        'post',
        `/clubs/${club.id}/members/${target.id}/remove`,
      );

      expect(response.status).toBe(expectedStatus);
    },
  );

  it.each([
    {
      actorRole: ClubMemberRole.owner,
      targetRole: ClubMemberRole.member,
      newRole: ClubMemberRole.admin,
      expectedStatus: 200,
    },
    {
      actorRole: ClubMemberRole.admin,
      targetRole: ClubMemberRole.member,
      newRole: ClubMemberRole.moderator,
      expectedStatus: 200,
    },
    {
      actorRole: ClubMemberRole.moderator,
      targetRole: ClubMemberRole.member,
      newRole: ClubMemberRole.moderator,
      expectedStatus: 403,
    },
    {
      actorRole: ClubMemberRole.member,
      targetRole: ClubMemberRole.member,
      newRole: ClubMemberRole.moderator,
      expectedStatus: 403,
    },
  ])(
    'matriz de papel: $actorRole altera $targetRole para $newRole retorna $expectedStatus',
    async ({ actorRole, targetRole, newRole, expectedStatus }) => {
      const { club, owner } = await createMatrixClub();
      const actor =
        actorRole === ClubMemberRole.owner
          ? owner
          : await addViewer(club.id, actorRole);
      const target = await addTargetMember(club.id, targetRole);

      const response = await requestAs(
        app,
        actor,
        'patch',
        `/clubs/${club.id}/members/${target.id}/role`,
        {
          role: newRole,
        },
      );

      expect(response.status).toBe(expectedStatus);
    },
  );

  it.each([
    [ClubMemberRole.owner, 200],
    [ClubMemberRole.admin, 403],
    [ClubMemberRole.moderator, 403],
    [ClubMemberRole.member, 403],
  ])(
    'matriz de transferencia: %s transferindo posse retorna %s',
    async (actorRole, expectedStatus) => {
      const { club, owner } = await createMatrixClub();
      const actor =
        actorRole === ClubMemberRole.owner
          ? owner
          : await addViewer(club.id, actorRole);
      const target = await addTargetMember(club.id);

      const response = await requestAs(
        app,
        actor,
        'post',
        `/clubs/${club.id}/transfer-ownership`,
        {
          newOwnerId: target.id,
        },
      );

      expect(response.status).toBe(expectedStatus);
    },
  );

  it.each([
    [ClubMemberRole.owner, 400],
    [ClubMemberRole.admin, 200],
    [ClubMemberRole.moderator, 200],
    [ClubMemberRole.member, 200],
  ])(
    'matriz de saida: %s saindo do clube retorna %s',
    async (role, expectedStatus) => {
      const { club, owner } = await createMatrixClub();
      const viewer =
        role === ClubMemberRole.owner ? owner : await addViewer(club.id, role);

      const response = await requestAs(
        app,
        viewer,
        'post',
        `/clubs/${club.id}/leave`,
      );

      expect(response.status).toBe(expectedStatus);
    },
  );

  it.each([
    [ClubMemberRole.owner],
    [ClubMemberRole.admin],
    [ClubMemberRole.moderator],
    [ClubMemberRole.member],
  ])('matriz de silencio: %s ativo pode mute e unmute', async (role) => {
    const { club, owner } = await createMatrixClub();
    const viewer =
      role === ClubMemberRole.owner ? owner : await addViewer(club.id, role);

    const muteResponse = await requestAs(
      app,
      viewer,
      'post',
      `/clubs/${club.id}/mute`,
    );
    const unmuteResponse = await requestAs(
      app,
      viewer,
      'post',
      `/clubs/${club.id}/unmute`,
    );

    expect(muteResponse.status).toBe(200);
    expect(unmuteResponse.status).toBe(200);
  });

  it.each([
    [ClubMemberStatus.invited],
    [ClubMemberStatus.requested],
  ])('matriz de status: %s nao executa acoes de membro ativo', async (status) => {
    const { club } = await createMatrixClub();
    const viewer = await addViewer(
      club.id,
      ClubMemberRole.member,
      status,
    );
    const target = await addTargetMember(club.id);

    const leaveResponse = await requestAs(
      app,
      viewer,
      'post',
      `/clubs/${club.id}/leave`,
    );
    const removeResponse = await requestAs(
      app,
      viewer,
      'post',
      `/clubs/${club.id}/members/${target.id}/remove`,
    );
    const roleResponse = await requestAs(
      app,
      viewer,
      'patch',
      `/clubs/${club.id}/members/${target.id}/role`,
      {
        role: ClubMemberRole.moderator,
      },
    );
    const muteResponse = await requestAs(
      app,
      viewer,
      'post',
      `/clubs/${club.id}/mute`,
    );
    const unmuteResponse = await requestAs(
      app,
      viewer,
      'post',
      `/clubs/${club.id}/unmute`,
    );

    expect(leaveResponse.status).toBe(400);
    expect(removeResponse.status).toBe(403);
    expect(roleResponse.status).toBe(403);
    expect(muteResponse.status).toBe(403);
    expect(unmuteResponse.status).toBe(403);
  });

  it('matriz de outsider: outsider nao executa acoes de membro', async () => {
    const { club } = await createMatrixClub();
    const outsider = await createTestUser();
    const target = await addTargetMember(club.id);

    const leaveResponse = await requestAs(
      app,
      outsider,
      'post',
      `/clubs/${club.id}/leave`,
    );
    const removeResponse = await requestAs(
      app,
      outsider,
      'post',
      `/clubs/${club.id}/members/${target.id}/remove`,
    );
    const roleResponse = await requestAs(
      app,
      outsider,
      'patch',
      `/clubs/${club.id}/members/${target.id}/role`,
      {
        role: ClubMemberRole.moderator,
      },
    );
    const transferResponse = await requestAs(
      app,
      outsider,
      'post',
      `/clubs/${club.id}/transfer-ownership`,
      {
        newOwnerId: target.id,
      },
    );
    const muteResponse = await requestAs(
      app,
      outsider,
      'post',
      `/clubs/${club.id}/mute`,
    );
    const unmuteResponse = await requestAs(
      app,
      outsider,
      'post',
      `/clubs/${club.id}/unmute`,
    );

    expect(leaveResponse.status).toBe(400);
    expect(removeResponse.status).toBe(403);
    expect(roleResponse.status).toBe(403);
    expect(transferResponse.status).toBe(403);
    expect(muteResponse.status).toBe(403);
    expect(unmuteResponse.status).toBe(403);
  });
});
