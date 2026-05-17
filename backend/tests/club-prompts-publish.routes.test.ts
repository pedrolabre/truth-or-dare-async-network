import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptType,
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

async function createClubWithAuthor(role: ClubMemberRole = ClubMemberRole.member) {
  const owner = await createTestUser();
  const author = await createTestUser();
  const club = await createTestClub({
    createdById: owner.id,
    memberCount: 2,
  });

  await addUserToClub(club.id, owner.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, author.id, {
    role,
    status: ClubMemberStatus.active,
  });

  return {
    author,
    club,
  };
}

describe('POST /clubs/:id/prompts publish', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('publica verdade no clube e persiste metadados de publicacao', async () => {
    const { author, club } = await createClubWithAuthor();

    const response = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(author)}`)
      .send({
        type: ClubPromptType.truth,
        content: 'Qual verdade voce publicaria apenas neste clube?',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.truth,
      status: 'published',
      content: 'Qual verdade voce publicaria apenas neste clube?',
      maxAttempts: null,
      publishedAt: expect.any(String),
    });

    const persistedPrompt = await prisma.clubPrompt.findUniqueOrThrow({
      where: {
        id: response.body.id,
      },
    });

    expect(persistedPrompt).toMatchObject({
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.truth,
      status: 'published',
      content: 'Qual verdade voce publicaria apenas neste clube?',
      maxAttempts: null,
    });
    expect(persistedPrompt.publishedAt).not.toBeNull();
  });

  it('publica desafio no clube com dados persistidos de desafio', async () => {
    const { author, club } = await createClubWithAuthor(
      ClubMemberRole.moderator,
    );
    const expiresAt = futureDate(90);

    const response = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(author)}`)
      .send({
        type: ClubPromptType.dare,
        content: 'Publique uma prova criativa do desafio.',
        maxAttempts: 3,
        expiresAt: expiresAt.toISOString(),
        difficulty: 'hard',
        isPinned: true,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      type: ClubPromptType.dare,
      status: 'published',
      maxAttempts: 3,
      expiresAt: expiresAt.toISOString(),
      difficulty: 'hard',
      isPinned: true,
    });

    const persistedPrompt = await prisma.clubPrompt.findUniqueOrThrow({
      where: {
        id: response.body.id,
      },
    });

    expect(persistedPrompt).toMatchObject({
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.dare,
      status: 'published',
      content: 'Publique uma prova criativa do desafio.',
      maxAttempts: 3,
      difficulty: 'hard',
      isPinned: true,
    });
    expect(persistedPrompt.expiresAt?.toISOString()).toBe(
      expiresAt.toISOString(),
    );
  });

  it('atualiza contadores e atividade do clube ao publicar prompt', async () => {
    const { author, club } = await createClubWithAuthor();

    const response = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(author)}`)
      .send({
        type: ClubPromptType.truth,
        content: 'Qual pergunta deve aparecer como atividade do clube?',
      });

    expect(response.status).toBe(201);

    const updatedClub = await prisma.club.findUniqueOrThrow({
      where: {
        id: club.id,
      },
    });

    expect(updatedClub.promptCount).toBe(1);
    expect(updatedClub.lastActivityAt).not.toBeNull();
  });
});
