import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptStatus,
  ClubPromptType,
  ClubStatus,
  ProofMediaType,
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

async function createResponseScenario({
  clubStatus = ClubStatus.active,
  promptStatus = ClubPromptStatus.published,
  promptType = ClubPromptType.truth,
  memberStatus = ClubMemberStatus.active,
  expiresAt,
}: {
  clubStatus?: ClubStatus;
  promptStatus?: ClubPromptStatus;
  promptType?: ClubPromptType;
  memberStatus?: ClubMemberStatus;
  expiresAt?: Date | null;
} = {}) {
  const owner = await createTestUser();
  const author = await createTestUser();
  const member = await createTestUser();
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
      type: promptType,
      status: promptStatus,
      content:
        promptType === ClubPromptType.truth
          ? 'Qual verdade voce contaria ao clube?'
          : 'Entregue uma prova criativa ao clube.',
      maxAttempts: promptType === ClubPromptType.dare ? 2 : null,
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

describe('POST /clubs/:id/prompts/:promptId/responses', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('retorna 401 sem token', async () => {
    const response = await request(app)
      .post('/clubs/club-id/prompts/prompt-id/responses')
      .send({
        text: 'Resposta sem token.',
      });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      error: expect.any(String),
    });
  });

  it('permite membro ativo responder prompt de verdade', async () => {
    const { member, club, prompt } = await createResponseScenario();

    const response = await request(app)
      .post(`/clubs/${club.id}/prompts/${prompt.id}/responses`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        text: 'Minha resposta sincera para o clube.',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      clubId: club.id,
      promptId: prompt.id,
      userId: member.id,
      userName: member.name,
      text: 'Minha resposta sincera para o clube.',
      mediaUrl: null,
      mediaType: null,
      dareProofId: null,
      attemptsUsed: 0,
      completedAt: expect.any(String),
      likesCount: 0,
      commentsCount: 0,
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
          action: 'club_prompt_response_created',
          entityType: 'club_prompt_response',
        },
      }),
    ]);

    expect(persistedPrompt.answersCount).toBe(1);
    expect(updatedClub.lastActivityAt).not.toBeNull();
    expect(auditLog).toMatchObject({
      entityId: response.body.id,
    });
  });

  it('permite membro ativo entregar prova de desafio', async () => {
    const { member, club, prompt } = await createResponseScenario({
      promptType: ClubPromptType.dare,
      expiresAt: futureDate(90),
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/prompts/${prompt.id}/responses`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        text: 'Prova entregue com contexto.',
        mediaUrl: 'https://example.com/prova.mp4',
        mediaType: ProofMediaType.video,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      clubId: club.id,
      promptId: prompt.id,
      userId: member.id,
      text: 'Prova entregue com contexto.',
      mediaUrl: 'https://example.com/prova.mp4',
      mediaType: ProofMediaType.video,
      attemptsUsed: 1,
      completedAt: expect.any(String),
    });

    await expect(
      prisma.clubPrompt.findUniqueOrThrow({
        where: {
          id: prompt.id,
        },
      }),
    ).resolves.toMatchObject({
      answersCount: 1,
    });
  });

  it('bloqueia verdade duplicada e desafio sem tentativas disponiveis', async () => {
    const truthScenario = await createResponseScenario();
    const dareScenario = await createResponseScenario({
      promptType: ClubPromptType.dare,
      expiresAt: futureDate(90),
    });

    await prisma.clubPromptResponse.create({
      data: {
        clubId: truthScenario.club.id,
        promptId: truthScenario.prompt.id,
        userId: truthScenario.member.id,
        text: 'Resposta ja existente.',
        completedAt: new Date(),
      },
    });
    await prisma.clubPromptResponse.createMany({
      data: [
        {
          clubId: dareScenario.club.id,
          promptId: dareScenario.prompt.id,
          userId: dareScenario.member.id,
          mediaUrl: 'https://example.com/prova-1.mp4',
          mediaType: ProofMediaType.video,
          attemptsUsed: 1,
          completedAt: new Date(),
        },
        {
          clubId: dareScenario.club.id,
          promptId: dareScenario.prompt.id,
          userId: dareScenario.member.id,
          mediaUrl: 'https://example.com/prova-2.mp4',
          mediaType: ProofMediaType.video,
          attemptsUsed: 2,
          completedAt: new Date(),
        },
      ],
    });

    const duplicateTruthResponse = await request(app)
      .post(
        `/clubs/${truthScenario.club.id}/prompts/${truthScenario.prompt.id}/responses`,
      )
      .set('Authorization', `Bearer ${authTokenFor(truthScenario.member)}`)
      .send({
        text: 'Tentando responder de novo.',
      });
    const exhaustedDareResponse = await request(app)
      .post(
        `/clubs/${dareScenario.club.id}/prompts/${dareScenario.prompt.id}/responses`,
      )
      .set('Authorization', `Bearer ${authTokenFor(dareScenario.member)}`)
      .send({
        mediaUrl: 'https://example.com/prova-3.mp4',
        mediaType: ProofMediaType.video,
      });

    expect(duplicateTruthResponse.status).toBe(400);
    expect(duplicateTruthResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
    expect(exhaustedDareResponse.status).toBe(400);
    expect(exhaustedDareResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
  });

  it('bloqueia outsider membership inativa clube inativo e prompt indisponivel', async () => {
    const outsiderScenario = await createResponseScenario();
    const inactiveMembershipScenario = await createResponseScenario({
      memberStatus: ClubMemberStatus.removed,
    });
    const archivedClubScenario = await createResponseScenario({
      clubStatus: ClubStatus.archived,
    });
    const removedPromptScenario = await createResponseScenario({
      promptStatus: ClubPromptStatus.removed,
    });
    const expiredPromptScenario = await createResponseScenario({
      expiresAt: pastDate(5),
    });

    const outsiderResponse = await request(app)
      .post(
        `/clubs/${outsiderScenario.club.id}/prompts/${outsiderScenario.prompt.id}/responses`,
      )
      .set('Authorization', `Bearer ${authTokenFor(outsiderScenario.outsider)}`)
      .send({
        text: 'Outsider tentando responder.',
      });
    const inactiveMembershipResponse = await request(app)
      .post(
        `/clubs/${inactiveMembershipScenario.club.id}/prompts/${inactiveMembershipScenario.prompt.id}/responses`,
      )
      .set(
        'Authorization',
        `Bearer ${authTokenFor(inactiveMembershipScenario.member)}`,
      )
      .send({
        text: 'Membership inativa tentando responder.',
      });
    const archivedClubResponse = await request(app)
      .post(
        `/clubs/${archivedClubScenario.club.id}/prompts/${archivedClubScenario.prompt.id}/responses`,
      )
      .set('Authorization', `Bearer ${authTokenFor(archivedClubScenario.member)}`)
      .send({
        text: 'Clube arquivado tentando receber resposta.',
      });
    const removedPromptResponse = await request(app)
      .post(
        `/clubs/${removedPromptScenario.club.id}/prompts/${removedPromptScenario.prompt.id}/responses`,
      )
      .set('Authorization', `Bearer ${authTokenFor(removedPromptScenario.member)}`)
      .send({
        text: 'Prompt removido tentando receber resposta.',
      });
    const expiredPromptResponse = await request(app)
      .post(
        `/clubs/${expiredPromptScenario.club.id}/prompts/${expiredPromptScenario.prompt.id}/responses`,
      )
      .set('Authorization', `Bearer ${authTokenFor(expiredPromptScenario.member)}`)
      .send({
        text: 'Prompt expirado tentando receber resposta.',
      });

    expect(outsiderResponse.status).toBe(403);
    expect(inactiveMembershipResponse.status).toBe(403);
    expect(archivedClubResponse.status).toBe(403);
    expect(removedPromptResponse.status).toBe(403);
    expect(expiredPromptResponse.status).toBe(403);
  });

  it('retorna 404 para clube deletado prompt inexistente ou de outro clube', async () => {
    const scenario = await createResponseScenario();
    const deletedClubScenario = await createResponseScenario({
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
        `/clubs/${deletedClubScenario.club.id}/prompts/${deletedClubScenario.prompt.id}/responses`,
      )
      .set('Authorization', `Bearer ${authTokenFor(deletedClubScenario.member)}`)
      .send({
        text: 'Clube deletado tentando receber resposta.',
      });
    const missingPromptResponse = await request(app)
      .post(`/clubs/${scenario.club.id}/prompts/prompt-inexistente/responses`)
      .set('Authorization', `Bearer ${authTokenFor(scenario.member)}`)
      .send({
        text: 'Prompt inexistente.',
      });
    const wrongClubResponse = await request(app)
      .post(`/clubs/${otherClub.id}/prompts/${scenario.prompt.id}/responses`)
      .set('Authorization', `Bearer ${authTokenFor(scenario.member)}`)
      .send({
        text: 'Prompt em outro clube.',
      });

    expect(deletedClubResponse.status).toBe(404);
    expect(missingPromptResponse.status).toBe(404);
    expect(wrongClubResponse.status).toBe(404);
  });

  it('retorna 400 para payload invalido', async () => {
    const truthScenario = await createResponseScenario();
    const dareScenario = await createResponseScenario({
      promptType: ClubPromptType.dare,
    });

    const invalidTruthResponse = await request(app)
      .post(
        `/clubs/${truthScenario.club.id}/prompts/${truthScenario.prompt.id}/responses`,
      )
      .set('Authorization', `Bearer ${authTokenFor(truthScenario.member)}`)
      .send({
        text: '  ',
      });
    const invalidDareResponse = await request(app)
      .post(
        `/clubs/${dareScenario.club.id}/prompts/${dareScenario.prompt.id}/responses`,
      )
      .set('Authorization', `Bearer ${authTokenFor(dareScenario.member)}`)
      .send({
        mediaUrl: 'https://example.com/prova.mp4',
        mediaType: 'image',
      });

    expect(invalidTruthResponse.status).toBe(400);
    expect(invalidTruthResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
    expect(invalidDareResponse.status).toBe(400);
    expect(invalidDareResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
  });
});
