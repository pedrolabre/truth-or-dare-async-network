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
import clubPromptsRoutes from '../src/routes/club-prompts.routes';
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

function futureDate(minutes = 60) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

async function createEditablePromptScenario({
  promptCreatedAt,
  clubStatus = ClubStatus.active,
  promptStatus = ClubPromptStatus.published,
}: {
  promptCreatedAt?: Date;
  clubStatus?: ClubStatus;
  promptStatus?: ClubPromptStatus;
} = {}) {
  const owner = await createTestUser();
  const admin = await createTestUser();
  const moderator = await createTestUser();
  const author = await createTestUser();
  const member = await createTestUser();
  const club = await createTestClub({
    createdById: owner.id,
    status: clubStatus,
    memberCount: 5,
  });

  await addUserToClub(club.id, owner.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, admin.id, {
    role: ClubMemberRole.admin,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, moderator.id, {
    role: ClubMemberRole.moderator,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, author.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, member.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
  });

  const prompt = await prisma.clubPrompt.create({
    data: {
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.truth,
      status: promptStatus,
      content: 'Pergunta original do clube.',
      createdAt: promptCreatedAt,
      archivedAt:
        promptStatus === ClubPromptStatus.archived ? new Date() : undefined,
      removedAt:
        promptStatus === ClubPromptStatus.removed ? new Date() : undefined,
    },
  });

  return {
    owner,
    admin,
    moderator,
    author,
    member,
    club,
    prompt,
  };
}

describe('PATCH /clubs/:id/prompts/:promptId edit', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('retorna 401 sem token', async () => {
    const response = await request(app)
      .patch('/clubs/club-id/prompts/prompt-id')
      .send({
        content: 'Edicao sem token.',
      });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      error: expect.any(String),
    });
  });

  it('permite autor editar campos completos dentro da janela', async () => {
    const { author, club, prompt } = await createEditablePromptScenario();
    const expiresAt = futureDate(90);

    const response = await request(app)
      .patch(`/clubs/${club.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(author)}`)
      .send({
        type: ClubPromptType.dare,
        content: 'Desafio editado pelo autor.',
        maxAttempts: 4,
        expiresAt: expiresAt.toISOString(),
        difficulty: 'medium',
        attachments: [
          {
            type: 'image',
            url: 'https://example.com/edit.png',
            name: 'edit.png',
          },
        ],
        isMembersOnly: false,
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: prompt.id,
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.dare,
      content: 'Desafio editado pelo autor.',
      maxAttempts: 4,
      expiresAt: expiresAt.toISOString(),
      difficulty: 'medium',
      isMembersOnly: false,
      viewerState: {
        canEdit: true,
        canRemove: true,
      },
    });
    expect(response.body.attachments).toEqual([
      expect.objectContaining({
        type: 'image',
        url: 'https://example.com/edit.png',
      }),
    ]);

    const persistedPrompt = await prisma.clubPrompt.findUniqueOrThrow({
      where: {
        id: prompt.id,
      },
    });

    expect(persistedPrompt).toMatchObject({
      type: ClubPromptType.dare,
      content: 'Desafio editado pelo autor.',
      maxAttempts: 4,
      difficulty: 'medium',
      isMembersOnly: false,
    });
  });

  it('permite owner e admin editarem prompt de outro autor', async () => {
    const { owner, admin, club, prompt } = await createEditablePromptScenario({
      promptCreatedAt: minutesAgo(60),
    });

    const ownerResponse = await request(app)
      .patch(`/clubs/${club.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        content: 'Edicao do owner.',
        isPinned: true,
      });
    const adminResponse = await request(app)
      .patch(`/clubs/${club.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(admin)}`)
      .send({
        content: 'Edicao do admin.',
      });

    expect(ownerResponse.status).toBe(200);
    expect(ownerResponse.body).toMatchObject({
      content: 'Edicao do owner.',
      isPinned: true,
    });
    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body).toMatchObject({
      content: 'Edicao do admin.',
      isPinned: true,
    });
  });

  it('bloqueia membro autor tentando fixar prompt', async () => {
    const { author, club, prompt } = await createEditablePromptScenario();

    const response = await request(app)
      .patch(`/clubs/${club.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(author)}`)
      .send({
        isPinned: true,
      });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
  });

  it('bloqueia moderator nao autor e membro comum nao autor', async () => {
    const { moderator, member, club, prompt } =
      await createEditablePromptScenario();

    const moderatorResponse = await request(app)
      .patch(`/clubs/${club.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(moderator)}`)
      .send({
        content: 'Moderador tentando editar.',
      });
    const memberResponse = await request(app)
      .patch(`/clubs/${club.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        content: 'Membro tentando editar.',
      });

    expect(moderatorResponse.status).toBe(403);
    expect(memberResponse.status).toBe(403);
  });

  it('bloqueia autor apos janela de edicao ou com resposta existente', async () => {
    const expiredScenario = await createEditablePromptScenario({
      promptCreatedAt: minutesAgo(20),
    });
    const answeredScenario = await createEditablePromptScenario();

    await prisma.clubPromptResponse.create({
      data: {
        clubId: answeredScenario.club.id,
        promptId: answeredScenario.prompt.id,
        userId: answeredScenario.member.id,
        text: 'Resposta existente.',
      },
    });

    const expiredResponse = await request(app)
      .patch(
        `/clubs/${expiredScenario.club.id}/prompts/${expiredScenario.prompt.id}`,
      )
      .set('Authorization', `Bearer ${authTokenFor(expiredScenario.author)}`)
      .send({
        content: 'Edicao depois da janela.',
      });
    const answeredResponse = await request(app)
      .patch(
        `/clubs/${answeredScenario.club.id}/prompts/${answeredScenario.prompt.id}`,
      )
      .set('Authorization', `Bearer ${authTokenFor(answeredScenario.author)}`)
      .send({
        content: 'Edicao com resposta existente.',
      });

    expect(expiredResponse.status).toBe(403);
    expect(answeredResponse.status).toBe(403);
  });

  it('bloqueia prompt arquivado removido ou clube inativo', async () => {
    const archivedPromptScenario = await createEditablePromptScenario({
      promptStatus: ClubPromptStatus.archived,
    });
    const removedPromptScenario = await createEditablePromptScenario({
      promptStatus: ClubPromptStatus.removed,
    });
    const archivedClubScenario = await createEditablePromptScenario({
      clubStatus: ClubStatus.archived,
    });

    const archivedPromptResponse = await request(app)
      .patch(
        `/clubs/${archivedPromptScenario.club.id}/prompts/${archivedPromptScenario.prompt.id}`,
      )
      .set('Authorization', `Bearer ${authTokenFor(archivedPromptScenario.admin)}`)
      .send({
        content: 'Edicao de prompt arquivado.',
      });
    const removedPromptResponse = await request(app)
      .patch(
        `/clubs/${removedPromptScenario.club.id}/prompts/${removedPromptScenario.prompt.id}`,
      )
      .set('Authorization', `Bearer ${authTokenFor(removedPromptScenario.admin)}`)
      .send({
        content: 'Edicao de prompt removido.',
      });
    const archivedClubResponse = await request(app)
      .patch(
        `/clubs/${archivedClubScenario.club.id}/prompts/${archivedClubScenario.prompt.id}`,
      )
      .set('Authorization', `Bearer ${authTokenFor(archivedClubScenario.admin)}`)
      .send({
        content: 'Edicao em clube arquivado.',
      });

    expect(archivedPromptResponse.status).toBe(403);
    expect(removedPromptResponse.status).toBe(403);
    expect(archivedClubResponse.status).toBe(403);
  });

  it('retorna 400 para payload invalido ou vazio', async () => {
    const { author, club, prompt } = await createEditablePromptScenario();

    const invalidResponse = await request(app)
      .patch(`/clubs/${club.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(author)}`)
      .send({
        content: '  ',
      });
    const emptyResponse = await request(app)
      .patch(`/clubs/${club.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(author)}`)
      .send({});

    expect(invalidResponse.status).toBe(400);
    expect(invalidResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
    expect(emptyResponse.status).toBe(400);
    expect(emptyResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
  });

  it('retorna 404 para prompt inexistente ou de outro clube', async () => {
    const { author, club, prompt } = await createEditablePromptScenario();
    const otherOwner = await createTestUser();
    const otherClub = await createTestClub({
      createdById: otherOwner.id,
      memberCount: 1,
    });

    await addUserToClub(otherClub.id, otherOwner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    const missingResponse = await request(app)
      .patch(`/clubs/${club.id}/prompts/prompt-inexistente`)
      .set('Authorization', `Bearer ${authTokenFor(author)}`)
      .send({
        content: 'Edicao inexistente.',
      });
    const wrongClubResponse = await request(app)
      .patch(`/clubs/${otherClub.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(author)}`)
      .send({
        content: 'Edicao no clube errado.',
      });

    expect(missingResponse.status).toBe(404);
    expect(wrongClubResponse.status).toBe(404);
  });

  it('registra audit log ao editar prompt', async () => {
    const { admin, club, prompt } = await createEditablePromptScenario();

    const response = await request(app)
      .patch(`/clubs/${club.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(admin)}`)
      .send({
        content: 'Prompt editado com auditoria.',
      });

    expect(response.status).toBe(200);

    await expect(
      prisma.clubAuditLog.findFirst({
        where: {
          clubId: club.id,
          actorId: admin.id,
          action: 'club_prompt_updated',
          entityType: 'club_prompt',
          entityId: prompt.id,
        },
      }),
    ).resolves.toMatchObject({
      action: 'club_prompt_updated',
    });
  });
});
