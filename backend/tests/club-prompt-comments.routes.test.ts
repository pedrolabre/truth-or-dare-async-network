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

function pastDate(minutes = 60) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

async function createCommentScenario({
  clubStatus = ClubStatus.active,
  promptStatus = ClubPromptStatus.published,
  memberStatus = ClubMemberStatus.active,
  expiresAt = null,
}: {
  clubStatus?: ClubStatus;
  promptStatus?: ClubPromptStatus;
  memberStatus?: ClubMemberStatus;
  expiresAt?: Date | null;
} = {}) {
  const owner = await createTestUser();
  const author = await createTestUser();
  const member = await createTestUser({ name: 'Membro Comentador' });
  const outsider = await createTestUser();
  const club = await createTestClub({
    createdById: owner.id,
    status: clubStatus,
    memberCount: 3,
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

  const prompt = await prisma.clubPrompt.create({
    data: {
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.truth,
      status: promptStatus,
      content: 'Prompt que recebera comentario.',
      expiresAt,
      archivedAt:
        promptStatus === ClubPromptStatus.archived ? new Date() : undefined,
      removedAt:
        promptStatus === ClubPromptStatus.removed ? new Date() : undefined,
    },
  });

  return {
    owner,
    author,
    member,
    outsider,
    club,
    prompt,
  };
}

describe('POST /clubs/:id/prompts/:promptId/comments', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('retorna 401 sem token', async () => {
    const response = await request(app)
      .post('/clubs/club-id/prompts/prompt-id/comments')
      .send({
        text: 'Comentario sem token.',
      });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      error: expect.any(String),
    });
  });

  it('permite membro ativo comentar prompt publicado', async () => {
    const { member, club, prompt } = await createCommentScenario();

    const response = await request(app)
      .post(`/clubs/${club.id}/prompts/${prompt.id}/comments`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        text: 'Comentario direto no prompt do clube.',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      clubId: club.id,
      promptId: prompt.id,
      responseId: null,
      userId: member.id,
      userName: 'Membro Comentador',
      parentId: null,
      text: 'Comentario direto no prompt do clube.',
      likesCount: 0,
      repliesCount: 0,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const [persistedPrompt, updatedClub, auditLog] = await Promise.all([
      prisma.clubPrompt.findUniqueOrThrow({
        where: {
          id: prompt.id,
        },
      }),
      prisma.club.findUniqueOrThrow({
        where: {
          id: club.id,
        },
      }),
      prisma.clubAuditLog.findFirst({
        where: {
          clubId: club.id,
          actorId: member.id,
          action: 'club_prompt_comment_created',
          entityType: 'club_prompt_comment',
        },
      }),
    ]);

    expect(persistedPrompt.commentsCount).toBe(1);
    expect(updatedClub.lastActivityAt).not.toBeNull();
    expect(auditLog).toMatchObject({
      entityId: response.body.id,
    });
  });

  it('retorna 400 para texto invalido', async () => {
    const { member, club, prompt } = await createCommentScenario();

    const blankResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${prompt.id}/comments`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        text: '  ',
      });
    const longResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${prompt.id}/comments`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        text: 'a'.repeat(501),
      });

    expect(blankResponse.status).toBe(400);
    expect(blankResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
    expect(longResponse.status).toBe(400);
    expect(longResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
  });

  it('bloqueia outsider membership inativa clube inativo e prompt indisponivel', async () => {
    const outsiderScenario = await createCommentScenario();
    const inactiveMembershipScenario = await createCommentScenario({
      memberStatus: ClubMemberStatus.removed,
    });
    const archivedClubScenario = await createCommentScenario({
      clubStatus: ClubStatus.archived,
    });
    const archivedPromptScenario = await createCommentScenario({
      promptStatus: ClubPromptStatus.archived,
    });
    const removedPromptScenario = await createCommentScenario({
      promptStatus: ClubPromptStatus.removed,
    });
    const expiredPromptScenario = await createCommentScenario({
      expiresAt: pastDate(5),
    });

    const outsiderResponse = await request(app)
      .post(
        `/clubs/${outsiderScenario.club.id}/prompts/${outsiderScenario.prompt.id}/comments`,
      )
      .set('Authorization', `Bearer ${authTokenFor(outsiderScenario.outsider)}`)
      .send({
        text: 'Outsider tentando comentar.',
      });
    const inactiveMembershipResponse = await request(app)
      .post(
        `/clubs/${inactiveMembershipScenario.club.id}/prompts/${inactiveMembershipScenario.prompt.id}/comments`,
      )
      .set(
        'Authorization',
        `Bearer ${authTokenFor(inactiveMembershipScenario.member)}`,
      )
      .send({
        text: 'Membership inativa tentando comentar.',
      });
    const archivedClubResponse = await request(app)
      .post(
        `/clubs/${archivedClubScenario.club.id}/prompts/${archivedClubScenario.prompt.id}/comments`,
      )
      .set('Authorization', `Bearer ${authTokenFor(archivedClubScenario.member)}`)
      .send({
        text: 'Clube arquivado tentando receber comentario.',
      });
    const archivedPromptResponse = await request(app)
      .post(
        `/clubs/${archivedPromptScenario.club.id}/prompts/${archivedPromptScenario.prompt.id}/comments`,
      )
      .set('Authorization', `Bearer ${authTokenFor(archivedPromptScenario.member)}`)
      .send({
        text: 'Prompt arquivado tentando receber comentario.',
      });
    const removedPromptResponse = await request(app)
      .post(
        `/clubs/${removedPromptScenario.club.id}/prompts/${removedPromptScenario.prompt.id}/comments`,
      )
      .set('Authorization', `Bearer ${authTokenFor(removedPromptScenario.member)}`)
      .send({
        text: 'Prompt removido tentando receber comentario.',
      });
    const expiredPromptResponse = await request(app)
      .post(
        `/clubs/${expiredPromptScenario.club.id}/prompts/${expiredPromptScenario.prompt.id}/comments`,
      )
      .set('Authorization', `Bearer ${authTokenFor(expiredPromptScenario.member)}`)
      .send({
        text: 'Prompt expirado tentando receber comentario.',
      });

    expect(outsiderResponse.status).toBe(403);
    expect(inactiveMembershipResponse.status).toBe(403);
    expect(archivedClubResponse.status).toBe(403);
    expect(archivedPromptResponse.status).toBe(403);
    expect(removedPromptResponse.status).toBe(403);
    expect(expiredPromptResponse.status).toBe(403);
  });

  it('retorna 404 para clube deletado prompt inexistente ou de outro clube', async () => {
    const scenario = await createCommentScenario();
    const deletedClubScenario = await createCommentScenario({
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
      .post(
        `/clubs/${deletedClubScenario.club.id}/prompts/${deletedClubScenario.prompt.id}/comments`,
      )
      .set('Authorization', `Bearer ${authTokenFor(deletedClubScenario.member)}`)
      .send({
        text: 'Clube deletado tentando receber comentario.',
      });
    const missingPromptResponse = await request(app)
      .post(`/clubs/${scenario.club.id}/prompts/prompt-inexistente/comments`)
      .set('Authorization', `Bearer ${authTokenFor(scenario.member)}`)
      .send({
        text: 'Prompt inexistente.',
      });
    const wrongClubResponse = await request(app)
      .post(`/clubs/${otherClub.id}/prompts/${scenario.prompt.id}/comments`)
      .set('Authorization', `Bearer ${authTokenFor(scenario.member)}`)
      .send({
        text: 'Prompt em outro clube.',
      });

    expect(deletedClubResponse.status).toBe(404);
    expect(missingPromptResponse.status).toBe(404);
    expect(wrongClubResponse.status).toBe(404);
  });
});
