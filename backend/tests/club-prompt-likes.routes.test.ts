import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptStatus,
  ClubPromptType,
  ClubStatus,
  LikeTargetType,
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

function futureDate(minutes = 60) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function pastDate(minutes = 60) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

async function createLikeScenario({
  clubStatus = ClubStatus.active,
  promptStatus = ClubPromptStatus.published,
  memberStatus = ClubMemberStatus.active,
  promptExpiresAt = futureDate(60),
  responseArchivedAt = null,
  responseRemovedAt = null,
}: {
  clubStatus?: ClubStatus;
  promptStatus?: ClubPromptStatus;
  memberStatus?: ClubMemberStatus;
  promptExpiresAt?: Date | null;
  responseArchivedAt?: Date | null;
  responseRemovedAt?: Date | null;
} = {}) {
  const owner = await createTestUser();
  const author = await createTestUser();
  const member = await createTestUser();
  const responder = await createTestUser();
  const outsider = await createTestUser();
  const club = await createTestClub({
    createdById: owner.id,
    status: clubStatus,
    memberCount: 4,
  });

  await addUserToClub(club.id, owner.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, author.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, member.id, {
    role: ClubMemberRole.member,
    status: memberStatus,
  });
  await addUserToClub(club.id, responder.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
  });

  const prompt = await prisma.clubPrompt.create({
    data: {
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.truth,
      status: promptStatus,
      content: 'Qual prompt deve receber likes especificos?',
      expiresAt: promptExpiresAt,
      archivedAt:
        promptStatus === ClubPromptStatus.archived ? new Date() : undefined,
      removedAt:
        promptStatus === ClubPromptStatus.removed ? new Date() : undefined,
    },
  });

  const promptResponse = await prisma.clubPromptResponse.create({
    data: {
      clubId: club.id,
      promptId: prompt.id,
      userId: responder.id,
      text: 'Resposta que tambem pode receber like.',
      completedAt: new Date(),
      archivedAt: responseArchivedAt,
      removedAt: responseRemovedAt,
    },
  });

  return {
    owner,
    author,
    member,
    responder,
    outsider,
    club,
    prompt,
    promptResponse,
  };
}

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

describe('POST /clubs/:id/prompts/:promptId/like', () => {
  it('retorna 401 sem token', async () => {
    const response = await request(app).post(
      '/clubs/club-id/prompts/prompt-id/like',
    );

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      error: expect.any(String),
    });
  });

  it('alterna like de prompt usando targetType club_prompt e sincroniza ClubPrompt.likesCount', async () => {
    const { member, club, prompt } = await createLikeScenario();

    const createResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${prompt.id}/like`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);

    expect(createResponse.status).toBe(200);
    expect(createResponse.body).toEqual({
      liked: true,
      likesCount: 1,
    });

    await expect(
      prisma.like.findUnique({
        where: {
          userId_targetId_targetType: {
            userId: member.id,
            targetId: prompt.id,
            targetType: LikeTargetType.club_prompt,
          },
        },
      }),
    ).resolves.not.toBeNull();
    await expect(
      prisma.clubPrompt.findUniqueOrThrow({
        where: {
          id: prompt.id,
        },
      }),
    ).resolves.toMatchObject({
      likesCount: 1,
    });

    const removeResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${prompt.id}/like`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);

    expect(removeResponse.status).toBe(200);
    expect(removeResponse.body).toEqual({
      liked: false,
      likesCount: 0,
    });
    await expect(
      prisma.clubPrompt.findUniqueOrThrow({
        where: {
          id: prompt.id,
        },
      }),
    ).resolves.toMatchObject({
      likesCount: 0,
    });
  });

  it('usa club_prompt no estado likedByMe do detalhe do prompt', async () => {
    const { member, club, prompt } = await createLikeScenario();

    await prisma.like.create({
      data: {
        userId: member.id,
        targetId: prompt.id,
        targetType: LikeTargetType.club_prompt,
      },
    });

    const response = await request(app)
      .get(`/clubs/${club.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);

    expect(response.status).toBe(200);
    expect(response.body.viewerState).toMatchObject({
      likedByMe: true,
    });
  });

  it('bloqueia outsider membership inativa clube inativo e prompt indisponivel', async () => {
    const outsiderScenario = await createLikeScenario();
    const inactiveMembershipScenario = await createLikeScenario({
      memberStatus: ClubMemberStatus.removed,
    });
    const archivedClubScenario = await createLikeScenario({
      clubStatus: ClubStatus.archived,
    });
    const suspendedClubScenario = await createLikeScenario({
      clubStatus: ClubStatus.suspended,
    });
    const archivedPromptScenario = await createLikeScenario({
      promptStatus: ClubPromptStatus.archived,
    });
    const removedPromptScenario = await createLikeScenario({
      promptStatus: ClubPromptStatus.removed,
    });
    const expiredPromptScenario = await createLikeScenario({
      promptExpiresAt: pastDate(5),
    });

    const outsiderResponse = await request(app)
      .post(
        `/clubs/${outsiderScenario.club.id}/prompts/${outsiderScenario.prompt.id}/like`,
      )
      .set('Authorization', `Bearer ${authTokenFor(outsiderScenario.outsider)}`);
    const inactiveMembershipResponse = await request(app)
      .post(
        `/clubs/${inactiveMembershipScenario.club.id}/prompts/${inactiveMembershipScenario.prompt.id}/like`,
      )
      .set(
        'Authorization',
        `Bearer ${authTokenFor(inactiveMembershipScenario.member)}`,
      );
    const archivedClubResponse = await request(app)
      .post(
        `/clubs/${archivedClubScenario.club.id}/prompts/${archivedClubScenario.prompt.id}/like`,
      )
      .set('Authorization', `Bearer ${authTokenFor(archivedClubScenario.member)}`);
    const suspendedClubResponse = await request(app)
      .post(
        `/clubs/${suspendedClubScenario.club.id}/prompts/${suspendedClubScenario.prompt.id}/like`,
      )
      .set(
        'Authorization',
        `Bearer ${authTokenFor(suspendedClubScenario.member)}`,
      );
    const archivedPromptResponse = await request(app)
      .post(
        `/clubs/${archivedPromptScenario.club.id}/prompts/${archivedPromptScenario.prompt.id}/like`,
      )
      .set(
        'Authorization',
        `Bearer ${authTokenFor(archivedPromptScenario.member)}`,
      );
    const removedPromptResponse = await request(app)
      .post(
        `/clubs/${removedPromptScenario.club.id}/prompts/${removedPromptScenario.prompt.id}/like`,
      )
      .set(
        'Authorization',
        `Bearer ${authTokenFor(removedPromptScenario.member)}`,
      );
    const expiredPromptResponse = await request(app)
      .post(
        `/clubs/${expiredPromptScenario.club.id}/prompts/${expiredPromptScenario.prompt.id}/like`,
      )
      .set(
        'Authorization',
        `Bearer ${authTokenFor(expiredPromptScenario.member)}`,
      );

    expect(outsiderResponse.status).toBe(403);
    expect(inactiveMembershipResponse.status).toBe(403);
    expect(archivedClubResponse.status).toBe(403);
    expect(suspendedClubResponse.status).toBe(403);
    expect(archivedPromptResponse.status).toBe(403);
    expect(removedPromptResponse.status).toBe(403);
    expect(expiredPromptResponse.status).toBe(403);
  });

  it('retorna 404 para clube deletado prompt inexistente ou prompt de outro clube', async () => {
    const scenario = await createLikeScenario();
    const deletedClubScenario = await createLikeScenario({
      clubStatus: ClubStatus.deleted,
    });
    const otherOwner = await createTestUser();
    const otherClub = await createTestClub({
      createdById: otherOwner.id,
    });

    const deletedClubResponse = await request(app)
      .post(
        `/clubs/${deletedClubScenario.club.id}/prompts/${deletedClubScenario.prompt.id}/like`,
      )
      .set('Authorization', `Bearer ${authTokenFor(deletedClubScenario.member)}`);
    const missingPromptResponse = await request(app)
      .post(`/clubs/${scenario.club.id}/prompts/prompt-inexistente/like`)
      .set('Authorization', `Bearer ${authTokenFor(scenario.member)}`);
    const wrongClubResponse = await request(app)
      .post(`/clubs/${otherClub.id}/prompts/${scenario.prompt.id}/like`)
      .set('Authorization', `Bearer ${authTokenFor(scenario.member)}`);

    expect(deletedClubResponse.status).toBe(404);
    expect(missingPromptResponse.status).toBe(404);
    expect(wrongClubResponse.status).toBe(404);
  });
});

describe('POST /clubs/:id/prompts/:promptId/responses/:responseId/like', () => {
  it('alterna like de resposta usando targetType club_response e sincroniza ClubPromptResponse.likesCount', async () => {
    const { member, club, prompt, promptResponse } = await createLikeScenario();

    const createResponse = await request(app)
      .post(
        `/clubs/${club.id}/prompts/${prompt.id}/responses/${promptResponse.id}/like`,
      )
      .set('Authorization', `Bearer ${authTokenFor(member)}`);

    expect(createResponse.status).toBe(200);
    expect(createResponse.body).toEqual({
      liked: true,
      likesCount: 1,
    });

    await expect(
      prisma.like.findUnique({
        where: {
          userId_targetId_targetType: {
            userId: member.id,
            targetId: promptResponse.id,
            targetType: LikeTargetType.club_response,
          },
        },
      }),
    ).resolves.not.toBeNull();
    await expect(
      prisma.clubPromptResponse.findUniqueOrThrow({
        where: {
          id: promptResponse.id,
        },
      }),
    ).resolves.toMatchObject({
      likesCount: 1,
    });
    await expect(
      prisma.clubPrompt.findUniqueOrThrow({
        where: {
          id: prompt.id,
        },
      }),
    ).resolves.toMatchObject({
      likesCount: 0,
    });

    const removeResponse = await request(app)
      .post(
        `/clubs/${club.id}/prompts/${prompt.id}/responses/${promptResponse.id}/like`,
      )
      .set('Authorization', `Bearer ${authTokenFor(member)}`);

    expect(removeResponse.status).toBe(200);
    expect(removeResponse.body).toEqual({
      liked: false,
      likesCount: 0,
    });
  });

  it('bloqueia response arquivada removida ou de prompt indisponivel', async () => {
    const archivedResponseScenario = await createLikeScenario({
      responseArchivedAt: new Date(),
    });
    const removedResponseScenario = await createLikeScenario({
      responseRemovedAt: new Date(),
    });
    const removedPromptScenario = await createLikeScenario({
      promptStatus: ClubPromptStatus.removed,
    });

    const archivedResponse = await request(app)
      .post(
        `/clubs/${archivedResponseScenario.club.id}/prompts/${archivedResponseScenario.prompt.id}/responses/${archivedResponseScenario.promptResponse.id}/like`,
      )
      .set(
        'Authorization',
        `Bearer ${authTokenFor(archivedResponseScenario.member)}`,
      );
    const removedResponse = await request(app)
      .post(
        `/clubs/${removedResponseScenario.club.id}/prompts/${removedResponseScenario.prompt.id}/responses/${removedResponseScenario.promptResponse.id}/like`,
      )
      .set(
        'Authorization',
        `Bearer ${authTokenFor(removedResponseScenario.member)}`,
      );
    const unavailablePromptResponse = await request(app)
      .post(
        `/clubs/${removedPromptScenario.club.id}/prompts/${removedPromptScenario.prompt.id}/responses/${removedPromptScenario.promptResponse.id}/like`,
      )
      .set('Authorization', `Bearer ${authTokenFor(removedPromptScenario.member)}`);

    expect(archivedResponse.status).toBe(403);
    expect(removedResponse.status).toBe(403);
    expect(unavailablePromptResponse.status).toBe(403);
  });

  it('retorna 404 para resposta inexistente ou vinculada a outro prompt', async () => {
    const scenario = await createLikeScenario();
    const otherScenario = await createLikeScenario();

    const missingResponse = await request(app)
      .post(
        `/clubs/${scenario.club.id}/prompts/${scenario.prompt.id}/responses/resposta-inexistente/like`,
      )
      .set('Authorization', `Bearer ${authTokenFor(scenario.member)}`);
    const wrongPromptResponse = await request(app)
      .post(
        `/clubs/${scenario.club.id}/prompts/${scenario.prompt.id}/responses/${otherScenario.promptResponse.id}/like`,
      )
      .set('Authorization', `Bearer ${authTokenFor(scenario.member)}`);

    expect(missingResponse.status).toBe(404);
    expect(wrongPromptResponse.status).toBe(404);
  });
});
