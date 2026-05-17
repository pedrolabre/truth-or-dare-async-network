import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptType,
  ClubStatus,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import clubPromptsRoutes from '../src/routes/clubs/prompts.routes';
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
  app.use('/clubs', clubPromptsRoutes);

  return app;
}

function authTokenFor(user: { id: string; email: string; name: string }) {
  return generateToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });
}

async function createClubWithActor({
  role = ClubMemberRole.member,
  memberStatus = ClubMemberStatus.active,
  clubStatus = ClubStatus.active,
}: {
  role?: ClubMemberRole;
  memberStatus?: ClubMemberStatus;
  clubStatus?: ClubStatus;
} = {}) {
  const owner = await createTestUser();
  const actor = await createTestUser();
  const club = await createTestClub({
    createdById: owner.id,
    status: clubStatus,
    memberCount: 2,
  });

  await addUserToClub(club.id, owner.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, actor.id, {
    role,
    status: memberStatus,
  });

  return {
    actor,
    club,
  };
}

function validPromptPayload(content = 'Quem pode publicar neste clube?') {
  return {
    type: ClubPromptType.truth,
    content,
  };
}

describe('POST /clubs/:id/prompts posting permissions', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it.each([
    ClubMemberRole.owner,
    ClubMemberRole.admin,
    ClubMemberRole.moderator,
    ClubMemberRole.member,
  ])('permite postagem para %s ativo', async (role) => {
    const { actor, club } = await createClubWithActor({ role });

    const response = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(actor)}`)
      .send(validPromptPayload(`Publicacao permitida para ${role}.`));

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      clubId: club.id,
      authorId: actor.id,
      type: ClubPromptType.truth,
      status: 'published',
    });
  });

  it.each([
    ClubMemberStatus.invited,
    ClubMemberStatus.requested,
    ClubMemberStatus.removed,
  ])('bloqueia postagem para membro com status %s', async (memberStatus) => {
    const { actor, club } = await createClubWithActor({ memberStatus });

    const response = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(actor)}`)
      .send(validPromptPayload(`Publicacao bloqueada para ${memberStatus}.`));

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
  });

  it('bloqueia postagem para usuario fora do clube', async () => {
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
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`)
      .send(validPromptPayload('Outsider nao pode publicar.'));

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
  });

  it.each([ClubStatus.archived, ClubStatus.suspended])(
    'bloqueia postagem em clube %s',
    async (clubStatus) => {
      const { actor, club } = await createClubWithActor({ clubStatus });

      const response = await request(app)
        .post(`/clubs/${club.id}/prompts`)
        .set('Authorization', `Bearer ${authTokenFor(actor)}`)
        .send(validPromptPayload(`Clube ${clubStatus} nao pode receber post.`));

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        code: 'CLUB_FORBIDDEN',
      });
    },
  );

  it('trata clube deletado como inexistente para postagem', async () => {
    const { actor, club } = await createClubWithActor();

    await prisma.club.update({
      where: {
        id: club.id,
      },
      data: {
        status: ClubStatus.deleted,
        deletedAt: new Date(),
      },
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(actor)}`)
      .send(validPromptPayload('Clube deletado nao recebe post.'));

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      code: 'CLUB_NOT_FOUND',
    });
  });
});
