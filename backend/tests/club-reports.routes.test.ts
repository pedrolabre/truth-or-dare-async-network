import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptStatus,
  ClubPromptType,
  ClubReportTargetType,
  ClubVisibility,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import clubsRoutes from '../src/routes/clubs/clubs.routes';
import clubPromptsRoutes from '../src/routes/clubs/prompts.routes';
import {
  addUserToClub,
  createTestClub,
  createTestClubPrompt,
  createTestUser,
  resetFeedData,
} from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { applyTestDatabaseHooks } from './test-db';

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use('/clubs', clubPromptsRoutes);
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

async function createReportScenario({
  visibility = ClubVisibility.public,
  memberStatus = ClubMemberStatus.active,
}: {
  visibility?: ClubVisibility;
  memberStatus?: ClubMemberStatus;
} = {}) {
  const owner = await createTestUser({ name: 'Owner Reportado' });
  const author = await createTestUser({ name: 'Autor Reportado' });
  const reporter = await createTestUser({ name: 'Reporter Ativo' });
  const outsider = await createTestUser({ name: 'Outsider Reporter' });
  const club = await createTestClub({
    createdById: owner.id,
    visibility,
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
  await addUserToClub(club.id, reporter.id, {
    role: ClubMemberRole.member,
    status: memberStatus,
  });

  const prompt = await createTestClubPrompt({
    clubId: club.id,
    authorId: author.id,
    type: ClubPromptType.truth,
    content: 'Prompt denunciavel do clube.',
  });

  const promptResponse = await prisma.clubPromptResponse.create({
    data: {
      clubId: club.id,
      promptId: prompt.id,
      userId: author.id,
      text: 'Resposta denunciavel.',
      completedAt: new Date(),
    },
  });

  const promptComment = await prisma.clubPromptComment.create({
    data: {
      clubId: club.id,
      promptId: prompt.id,
      userId: author.id,
      text: 'Comentario denunciavel.',
    },
  });

  return {
    owner,
    author,
    reporter,
    outsider,
    club,
    prompt,
    promptResponse,
    promptComment,
  };
}

describe('club reports routes', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('retorna 401 sem token', async () => {
    const response = await request(app)
      .post('/clubs/club-id/report')
      .send({
        reason: 'spam',
      });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      error: expect.any(String),
    });
  });

  it('permite denunciar clube acessivel e registra audit log', async () => {
    const { reporter, club } = await createReportScenario();

    const response = await request(app)
      .post(`/clubs/${club.id}/report`)
      .set('Authorization', `Bearer ${authTokenFor(reporter)}`)
      .send({
        reason: 'spam',
        details: 'Convites repetitivos no clube.',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      clubId: club.id,
      targetType: ClubReportTargetType.club,
      targetId: club.id,
      reason: 'spam',
      details: 'Convites repetitivos no clube.',
      createdAt: expect.any(String),
    });

    const [persistedReport, auditLog] = await Promise.all([
      prisma.clubReport.findUnique({
        where: {
          reporterId_targetType_targetId: {
            reporterId: reporter.id,
            targetType: ClubReportTargetType.club,
            targetId: club.id,
          },
        },
      }),
      prisma.clubAuditLog.findFirst({
        where: {
          clubId: club.id,
          actorId: reporter.id,
          action: 'club_report_created',
          entityType: 'club_report',
        },
      }),
    ]);

    expect(persistedReport).toMatchObject({
      id: response.body.id,
      details: 'Convites repetitivos no clube.',
    });
    expect(auditLog).toMatchObject({
      entityId: response.body.id,
      metadata: expect.objectContaining({
        targetType: ClubReportTargetType.club,
        targetId: club.id,
        reason: 'spam',
        hasDetails: true,
      }),
    });
  });

  it('permite denunciar prompt resposta e comentario do clube', async () => {
    const { reporter, club, prompt, promptResponse, promptComment } =
      await createReportScenario();

    const promptReportResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${prompt.id}/report`)
      .set('Authorization', `Bearer ${authTokenFor(reporter)}`)
      .send({
        reason: 'harassment',
      });
    const responseReportResponse = await request(app)
      .post(
        `/clubs/${club.id}/prompts/${prompt.id}/responses/${promptResponse.id}/report`,
      )
      .set('Authorization', `Bearer ${authTokenFor(reporter)}`)
      .send({
        reason: 'violence',
      });
    const commentReportResponse = await request(app)
      .post(
        `/clubs/${club.id}/prompts/${prompt.id}/comments/${promptComment.id}/report`,
      )
      .set('Authorization', `Bearer ${authTokenFor(reporter)}`)
      .send({
        reason: 'hate',
      });

    expect(promptReportResponse.status).toBe(201);
    expect(promptReportResponse.body).toMatchObject({
      clubId: club.id,
      targetType: ClubReportTargetType.club_prompt,
      targetId: prompt.id,
      reason: 'harassment',
    });
    expect(responseReportResponse.status).toBe(201);
    expect(responseReportResponse.body).toMatchObject({
      clubId: club.id,
      targetType: ClubReportTargetType.club_prompt_response,
      targetId: promptResponse.id,
      reason: 'violence',
    });
    expect(commentReportResponse.status).toBe(201);
    expect(commentReportResponse.body).toMatchObject({
      clubId: club.id,
      targetType: ClubReportTargetType.club_prompt_comment,
      targetId: promptComment.id,
      reason: 'hate',
    });

    await expect(
      prisma.clubReport.count({
        where: {
          reporterId: reporter.id,
        },
      }),
    ).resolves.toBe(3);
    await expect(
      prisma.clubAuditLog.count({
        where: {
          clubId: club.id,
          actorId: reporter.id,
          action: {
            in: [
              'club_prompt_report_created',
              'club_prompt_response_report_created',
              'club_prompt_comment_report_created',
            ],
          },
        },
      }),
    ).resolves.toBe(3);
  });

  it('retorna 404 para alvo inexistente ou pertencente a outro clube', async () => {
    const scenario = await createReportScenario();
    const otherOwner = await createTestUser();
    const otherClub = await createTestClub({
      createdById: otherOwner.id,
      memberCount: 1,
    });

    await addUserToClub(otherClub.id, otherOwner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    const missingPromptResponse = await request(app)
      .post(`/clubs/${scenario.club.id}/prompts/prompt-inexistente/report`)
      .set('Authorization', `Bearer ${authTokenFor(scenario.reporter)}`)
      .send({
        reason: 'spam',
      });
    const wrongClubPromptResponse = await request(app)
      .post(`/clubs/${otherClub.id}/prompts/${scenario.prompt.id}/report`)
      .set('Authorization', `Bearer ${authTokenFor(otherOwner)}`)
      .send({
        reason: 'spam',
      });
    const wrongClubResponseReport = await request(app)
      .post(
        `/clubs/${otherClub.id}/prompts/${scenario.prompt.id}/responses/${scenario.promptResponse.id}/report`,
      )
      .set('Authorization', `Bearer ${authTokenFor(otherOwner)}`)
      .send({
        reason: 'spam',
      });

    expect(missingPromptResponse.status).toBe(404);
    expect(wrongClubPromptResponse.status).toBe(404);
    expect(wrongClubResponseReport.status).toBe(404);
  });

  it('bloqueia denuncia sem acesso legitimo ou membership ativa quando conteudo privado exigir acesso', async () => {
    const privateScenario = await createReportScenario({
      visibility: ClubVisibility.private,
    });
    const removedScenario = await createReportScenario({
      visibility: ClubVisibility.private,
      memberStatus: ClubMemberStatus.removed,
    });

    const outsiderPrivateClubResponse = await request(app)
      .post(`/clubs/${privateScenario.club.id}/report`)
      .set('Authorization', `Bearer ${authTokenFor(privateScenario.outsider)}`)
      .send({
        reason: 'spam',
      });
    const outsiderPrivatePromptResponse = await request(app)
      .post(
        `/clubs/${privateScenario.club.id}/prompts/${privateScenario.prompt.id}/report`,
      )
      .set('Authorization', `Bearer ${authTokenFor(privateScenario.outsider)}`)
      .send({
        reason: 'spam',
      });
    const removedMemberPromptResponse = await request(app)
      .post(
        `/clubs/${removedScenario.club.id}/prompts/${removedScenario.prompt.id}/report`,
      )
      .set('Authorization', `Bearer ${authTokenFor(removedScenario.reporter)}`)
      .send({
        reason: 'spam',
      });

    expect(outsiderPrivateClubResponse.status).toBe(403);
    expect(outsiderPrivatePromptResponse.status).toBe(403);
    expect(removedMemberPromptResponse.status).toBe(403);
  });

  it('retorna 400 para denuncia invalida e 409 para duplicidade', async () => {
    const { reporter, club, prompt } = await createReportScenario();

    const invalidReasonResponse = await request(app)
      .post(`/clubs/${club.id}/report`)
      .set('Authorization', `Bearer ${authTokenFor(reporter)}`)
      .send({
        reason: 'categoria-invalida',
      });
    const longDetailsResponse = await request(app)
      .post(`/clubs/${club.id}/report`)
      .set('Authorization', `Bearer ${authTokenFor(reporter)}`)
      .send({
        reason: 'spam',
        details: 'a'.repeat(1001),
      });
    const firstPromptReportResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${prompt.id}/report`)
      .set('Authorization', `Bearer ${authTokenFor(reporter)}`)
      .send({
        reason: 'spam',
      });
    const duplicatedPromptReportResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${prompt.id}/report`)
      .set('Authorization', `Bearer ${authTokenFor(reporter)}`)
      .send({
        reason: 'spam',
      });

    expect(invalidReasonResponse.status).toBe(400);
    expect(invalidReasonResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
    expect(longDetailsResponse.status).toBe(400);
    expect(longDetailsResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
    expect(firstPromptReportResponse.status).toBe(201);
    expect(duplicatedPromptReportResponse.status).toBe(409);
    expect(duplicatedPromptReportResponse.body).toMatchObject({
      code: 'CLUB_DUPLICATE_REPORT',
    });

    await expect(
      prisma.clubReport.count({
        where: {
          reporterId: reporter.id,
          targetType: ClubReportTargetType.club_prompt,
          targetId: prompt.id,
        },
      }),
    ).resolves.toBe(1);
  });

  it('bloqueia denuncia do proprio conteudo e de prompt indisponivel', async () => {
    const { author, club, prompt } = await createReportScenario();
    const removedPrompt = await createTestClubPrompt({
      clubId: club.id,
      authorId: author.id,
      content: 'Prompt removido para denuncia.',
    });

    await prisma.clubPrompt.update({
      where: {
        id: removedPrompt.id,
      },
      data: {
        status: ClubPromptStatus.removed,
        removedAt: new Date(),
      },
    });

    const ownPromptResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${prompt.id}/report`)
      .set('Authorization', `Bearer ${authTokenFor(author)}`)
      .send({
        reason: 'spam',
      });
    const unavailablePromptResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${removedPrompt.id}/report`)
      .set('Authorization', `Bearer ${authTokenFor(author)}`)
      .send({
        reason: 'spam',
      });

    expect(ownPromptResponse.status).toBe(400);
    expect(unavailablePromptResponse.status).toBe(403);
  });
});
