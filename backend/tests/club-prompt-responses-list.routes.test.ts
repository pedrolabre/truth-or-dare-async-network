import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptStatus,
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

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

async function createResponsesListScenario({
  clubStatus = ClubStatus.active,
  promptStatus = ClubPromptStatus.published,
  memberStatus = ClubMemberStatus.active,
}: {
  clubStatus?: ClubStatus;
  promptStatus?: ClubPromptStatus;
  memberStatus?: ClubMemberStatus;
} = {}) {
  const owner = await createTestUser();
  const author = await createTestUser();
  const viewer = await createTestUser();
  const firstResponder = await createTestUser({ name: 'Ana Resposta' });
  const secondResponder = await createTestUser({ name: 'Beto Resposta' });
  const thirdResponder = await createTestUser({ name: 'Carla Removida' });
  const outsider = await createTestUser();
  const club = await createTestClub({
    createdById: owner.id,
    status: clubStatus,
    memberCount: 6,
  });

  await addUserToClub(club.id, owner.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, author.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, viewer.id, {
    role: ClubMemberRole.member,
    status: memberStatus,
  });
  await addUserToClub(club.id, firstResponder.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, secondResponder.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, thirdResponder.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
  });

  const prompt = await prisma.clubPrompt.create({
    data: {
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.truth,
      status: promptStatus,
      content: 'Qual resposta deve aparecer na lista?',
      archivedAt:
        promptStatus === ClubPromptStatus.archived ? new Date() : undefined,
      removedAt:
        promptStatus === ClubPromptStatus.removed ? new Date() : undefined,
    },
  });

  const olderResponse = await prisma.clubPromptResponse.create({
    data: {
      clubId: club.id,
      promptId: prompt.id,
      userId: firstResponder.id,
      text: 'Resposta mais antiga.',
      completedAt: minutesAgo(30),
      createdAt: minutesAgo(30),
    },
  });
  const newerResponse = await prisma.clubPromptResponse.create({
    data: {
      clubId: club.id,
      promptId: prompt.id,
      userId: secondResponder.id,
      text: 'Resposta mais recente.',
      completedAt: minutesAgo(10),
      createdAt: minutesAgo(10),
    },
  });

  await prisma.clubPromptResponse.create({
    data: {
      clubId: club.id,
      promptId: prompt.id,
      userId: thirdResponder.id,
      text: 'Resposta removida.',
      removedAt: minutesAgo(5),
      completedAt: minutesAgo(5),
      createdAt: minutesAgo(5),
    },
  });
  await prisma.clubPromptResponse.create({
    data: {
      clubId: club.id,
      promptId: prompt.id,
      userId: thirdResponder.id,
      text: 'Resposta arquivada.',
      archivedAt: minutesAgo(4),
      completedAt: minutesAgo(4),
      createdAt: minutesAgo(4),
    },
  });

  return {
    owner,
    author,
    viewer,
    outsider,
    club,
    prompt,
    olderResponse,
    newerResponse,
  };
}

describe('GET /clubs/:id/prompts/:promptId/responses', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('retorna 401 sem token', async () => {
    const response = await request(app).get(
      '/clubs/club-id/prompts/prompt-id/responses',
    );

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      error: expect.any(String),
    });
  });

  it('lista respostas nao removidas com paginacao padrao e ordenacao recente', async () => {
    const { viewer, club, prompt, newerResponse } =
      await createResponsesListScenario();

    const response = await request(app)
      .get(`/clubs/${club.id}/prompts/${prompt.id}/responses`)
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      },
    });
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items[0]).toMatchObject({
      id: newerResponse.id,
      clubId: club.id,
      promptId: prompt.id,
      text: 'Resposta mais recente.',
      userName: 'Beto Resposta',
    });
    expect(response.body.items.map((item: { text: string }) => item.text)).not.toContain(
      'Resposta removida.',
    );
    expect(response.body.items.map((item: { text: string }) => item.text)).not.toContain(
      'Resposta arquivada.',
    );
  });

  it('aplica pagina e ordenacao por mais antigas', async () => {
    const { viewer, club, prompt, newerResponse } =
      await createResponsesListScenario();

    const firstPageResponse = await request(app)
      .get(`/clubs/${club.id}/prompts/${prompt.id}/responses`)
      .query({
        sort: 'oldest',
        page: 1,
        limit: 1,
      })
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);
    const secondPageResponse = await request(app)
      .get(`/clubs/${club.id}/prompts/${prompt.id}/responses`)
      .query({
        sort: 'oldest',
        page: 2,
        limit: 1,
      })
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(firstPageResponse.status).toBe(200);
    expect(firstPageResponse.body).toMatchObject({
      pagination: {
        page: 1,
        limit: 1,
        total: 2,
        totalPages: 2,
      },
    });
    expect(firstPageResponse.body.items).toEqual([
      expect.objectContaining({
        text: 'Resposta mais antiga.',
      }),
    ]);
    expect(secondPageResponse.status).toBe(200);
    expect(secondPageResponse.body.items).toEqual([
      expect.objectContaining({
        id: newerResponse.id,
        text: 'Resposta mais recente.',
      }),
    ]);
  });

  it('bloqueia outsider membership inativa clube inativo e prompt indisponivel', async () => {
    const outsiderScenario = await createResponsesListScenario();
    const inactiveMembershipScenario = await createResponsesListScenario({
      memberStatus: ClubMemberStatus.removed,
    });
    const suspendedClubScenario = await createResponsesListScenario({
      clubStatus: ClubStatus.suspended,
    });
    const archivedPromptScenario = await createResponsesListScenario({
      promptStatus: ClubPromptStatus.archived,
    });
    const removedPromptScenario = await createResponsesListScenario({
      promptStatus: ClubPromptStatus.removed,
    });

    const outsiderResponse = await request(app)
      .get(
        `/clubs/${outsiderScenario.club.id}/prompts/${outsiderScenario.prompt.id}/responses`,
      )
      .set('Authorization', `Bearer ${authTokenFor(outsiderScenario.outsider)}`);
    const inactiveMembershipResponse = await request(app)
      .get(
        `/clubs/${inactiveMembershipScenario.club.id}/prompts/${inactiveMembershipScenario.prompt.id}/responses`,
      )
      .set(
        'Authorization',
        `Bearer ${authTokenFor(inactiveMembershipScenario.viewer)}`,
      );
    const suspendedClubResponse = await request(app)
      .get(
        `/clubs/${suspendedClubScenario.club.id}/prompts/${suspendedClubScenario.prompt.id}/responses`,
      )
      .set('Authorization', `Bearer ${authTokenFor(suspendedClubScenario.viewer)}`);
    const archivedPromptResponse = await request(app)
      .get(
        `/clubs/${archivedPromptScenario.club.id}/prompts/${archivedPromptScenario.prompt.id}/responses`,
      )
      .set('Authorization', `Bearer ${authTokenFor(archivedPromptScenario.viewer)}`);
    const removedPromptResponse = await request(app)
      .get(
        `/clubs/${removedPromptScenario.club.id}/prompts/${removedPromptScenario.prompt.id}/responses`,
      )
      .set('Authorization', `Bearer ${authTokenFor(removedPromptScenario.viewer)}`);

    expect(outsiderResponse.status).toBe(403);
    expect(inactiveMembershipResponse.status).toBe(403);
    expect(suspendedClubResponse.status).toBe(403);
    expect(archivedPromptResponse.status).toBe(403);
    expect(removedPromptResponse.status).toBe(403);
  });

  it('retorna 404 para clube deletado prompt inexistente ou de outro clube', async () => {
    const scenario = await createResponsesListScenario();
    const deletedClubScenario = await createResponsesListScenario({
      clubStatus: ClubStatus.deleted,
    });
    const otherOwner = await createTestUser();
    const otherClub = await createTestClub({
      createdById: otherOwner.id,
      memberCount: 1,
    });

    await addUserToClub(otherClub.id, otherOwner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    const deletedClubResponse = await request(app)
      .get(
        `/clubs/${deletedClubScenario.club.id}/prompts/${deletedClubScenario.prompt.id}/responses`,
      )
      .set('Authorization', `Bearer ${authTokenFor(deletedClubScenario.viewer)}`);
    const missingPromptResponse = await request(app)
      .get(`/clubs/${scenario.club.id}/prompts/prompt-inexistente/responses`)
      .set('Authorization', `Bearer ${authTokenFor(scenario.viewer)}`);
    const wrongClubResponse = await request(app)
      .get(`/clubs/${otherClub.id}/prompts/${scenario.prompt.id}/responses`)
      .set('Authorization', `Bearer ${authTokenFor(scenario.viewer)}`);

    expect(deletedClubResponse.status).toBe(404);
    expect(missingPromptResponse.status).toBe(404);
    expect(wrongClubResponse.status).toBe(404);
  });
});
