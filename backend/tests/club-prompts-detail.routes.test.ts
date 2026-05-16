import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptType,
  ClubVisibility,
  LikeTargetType,
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

function futureDate(minutes = 60) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function pastDate(minutes = 60) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

async function createClubPromptDetailScenario() {
  const owner = await createTestUser();
  const author = await createTestUser();
  const member = await createTestUser();
  const moderator = await createTestUser();
  const club = await createTestClub({
    createdById: owner.id,
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
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, moderator.id, {
    role: ClubMemberRole.moderator,
    status: ClubMemberStatus.active,
  });

  const expiresAt = futureDate(120);
  const prompt = await prisma.clubPrompt.create({
    data: {
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.dare,
      content: 'Mostre uma prova criativa para o clube.',
      maxAttempts: 3,
      expiresAt,
      difficulty: 'hard',
      attachments: [
        {
          type: 'image',
          url: 'https://example.com/prompt-detail.png',
          name: 'prompt-detail.png',
        },
      ],
      isPinned: true,
      isMembersOnly: true,
      publishedAt: new Date(),
    },
  });

  return {
    owner,
    author,
    member,
    moderator,
    club,
    prompt,
    expiresAt,
  };
}

describe('GET /clubs/:id/prompts/:promptId detail', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('retorna 401 sem token', async () => {
    const response = await request(app).get('/clubs/club-id/prompts/prompt-id');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      error: expect.any(String),
    });
  });

  it('retorna detalhe completo do prompt para membro ativo', async () => {
    const { member, club, prompt, expiresAt } =
      await createClubPromptDetailScenario();

    const response = await request(app)
      .get(`/clubs/${club.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: prompt.id,
      clubId: club.id,
      authorId: prompt.authorId,
      type: ClubPromptType.dare,
      status: 'published',
      content: 'Mostre uma prova criativa para o clube.',
      difficulty: 'hard',
      maxAttempts: 3,
      expiresAt: expiresAt.toISOString(),
      isPinned: true,
      isMembersOnly: true,
      archivedAt: null,
      removedAt: null,
      removedById: null,
      removalReason: null,
      responses: [],
      viewerState: {
        likedByMe: false,
        answeredByMe: false,
        canAnswer: true,
        canEdit: false,
        canRemove: false,
      },
    });
    expect(response.body.attachments).toEqual([
      expect.objectContaining({
        type: 'image',
        url: 'https://example.com/prompt-detail.png',
      }),
    ]);
  });

  it('inclui respostas existentes e estado do visualizador', async () => {
    const { member, club, prompt } = await createClubPromptDetailScenario();

    await prisma.clubPromptResponse.create({
      data: {
        clubId: club.id,
        promptId: prompt.id,
        userId: member.id,
        text: 'Resposta do membro.',
        attemptsUsed: 1,
        completedAt: new Date(),
      },
    });
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
      answeredByMe: true,
      canAnswer: true,
    });
    expect(response.body.responses).toEqual([
      expect.objectContaining({
        clubId: club.id,
        promptId: prompt.id,
        userId: member.id,
        userName: member.name,
        text: 'Resposta do membro.',
        attemptsUsed: 1,
      }),
    ]);
  });

  it('ignora respostas arquivadas ou removidas no detalhe e no answeredByMe', async () => {
    const { member, club, prompt } = await createClubPromptDetailScenario();

    await prisma.clubPromptResponse.createMany({
      data: [
        {
          clubId: club.id,
          promptId: prompt.id,
          userId: member.id,
          text: 'Resposta arquivada do membro.',
          archivedAt: new Date(),
          completedAt: new Date(),
        },
        {
          clubId: club.id,
          promptId: prompt.id,
          userId: member.id,
          text: 'Resposta removida do membro.',
          removedAt: new Date(),
          completedAt: new Date(),
        },
      ],
    });

    const response = await request(app)
      .get(`/clubs/${club.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);

    expect(response.status).toBe(200);
    expect(response.body.viewerState).toMatchObject({
      answeredByMe: false,
    });
    expect(response.body.responses).toEqual([]);
  });

  it('marca prompt expirado como indisponivel para resposta no detalhe', async () => {
    const { member, club, prompt } = await createClubPromptDetailScenario();

    await prisma.clubPrompt.update({
      where: {
        id: prompt.id,
      },
      data: {
        expiresAt: pastDate(5),
      },
    });

    const response = await request(app)
      .get(`/clubs/${club.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);

    expect(response.status).toBe(200);
    expect(response.body.viewerState).toMatchObject({
      canAnswer: false,
    });
  });

  it('calcula permissoes de detalhe para autor e moderador', async () => {
    const { author, moderator, club, prompt } =
      await createClubPromptDetailScenario();

    const authorResponse = await request(app)
      .get(`/clubs/${club.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(author)}`);
    const moderatorResponse = await request(app)
      .get(`/clubs/${club.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(moderator)}`);

    expect(authorResponse.status).toBe(200);
    expect(authorResponse.body.viewerState).toMatchObject({
      canEdit: true,
      canRemove: true,
    });
    expect(moderatorResponse.status).toBe(200);
    expect(moderatorResponse.body.viewerState).toMatchObject({
      canEdit: false,
      canRemove: true,
    });
  });

  it('retorna 404 para prompt inexistente ou de outro clube', async () => {
    const { member, club, prompt } = await createClubPromptDetailScenario();
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
      .get(`/clubs/${club.id}/prompts/prompt-inexistente`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);
    const wrongClubResponse = await request(app)
      .get(`/clubs/${otherClub.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);

    expect(missingResponse.status).toBe(404);
    expect(missingResponse.body).toMatchObject({
      code: 'CLUB_NOT_FOUND',
    });
    expect(wrongClubResponse.status).toBe(404);
    expect(wrongClubResponse.body).toMatchObject({
      code: 'CLUB_NOT_FOUND',
    });
  });

  it('bloqueia usuario sem acesso em clube privado', async () => {
    const owner = await createTestUser();
    const author = await createTestUser();
    const outsider = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      visibility: ClubVisibility.private,
      memberCount: 2,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(club.id, author.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.active,
    });

    const prompt = await prisma.clubPrompt.create({
      data: {
        clubId: club.id,
        authorId: author.id,
        type: ClubPromptType.truth,
        content: 'Pergunta privada do clube.',
      },
    });

    const response = await request(app)
      .get(`/clubs/${club.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`);

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
  });
});
