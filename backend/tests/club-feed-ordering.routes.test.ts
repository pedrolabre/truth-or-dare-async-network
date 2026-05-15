import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptType,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import clubFeedRoutes from '../src/routes/club-feed.routes';
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
  app.use('/clubs', clubFeedRoutes);

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

function futureDate(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

async function createOrderingScenario() {
  const owner = await createTestUser({ name: 'Dono Ordering' });
  const viewer = await createTestUser({ name: 'Membro Ordering' });
  const author = await createTestUser({ name: 'Autora Ordering' });
  const club = await createTestClub({
    createdById: owner.id,
    memberCount: 3,
  });

  await addUserToClub(club.id, owner.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, viewer.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, author.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
  });

  const pinnedPrompt = await prisma.clubPrompt.create({
    data: {
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.truth,
      content: 'Prompt fixado antigo.',
      isPinned: true,
      likesCount: 1,
      commentsCount: 1,
      answersCount: 1,
      expiresAt: futureDate(120),
      publishedAt: minutesAgo(90),
      createdAt: minutesAgo(90),
      updatedAt: minutesAgo(90),
    },
  });
  const activityPrompt = await prisma.clubPrompt.create({
    data: {
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.truth,
      content: 'Prompt com atividade recente.',
      expiresAt: futureDate(90),
      publishedAt: minutesAgo(80),
      createdAt: minutesAgo(80),
      updatedAt: minutesAgo(5),
    },
  });
  const relevantPrompt = await prisma.clubPrompt.create({
    data: {
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.truth,
      content: 'Prompt mais relevante.',
      likesCount: 8,
      commentsCount: 4,
      answersCount: 3,
      expiresAt: futureDate(180),
      publishedAt: minutesAgo(70),
      createdAt: minutesAgo(70),
      updatedAt: minutesAgo(70),
    },
  });
  const urgentPrompt = await prisma.clubPrompt.create({
    data: {
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.dare,
      content: 'Prompt com prazo proximo.',
      maxAttempts: 3,
      likesCount: 2,
      expiresAt: futureDate(15),
      publishedAt: minutesAgo(60),
      createdAt: minutesAgo(60),
      updatedAt: minutesAgo(60),
    },
  });
  const noDeadlinePrompt = await prisma.clubPrompt.create({
    data: {
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.truth,
      content: 'Prompt sem prazo.',
      expiresAt: null,
      publishedAt: minutesAgo(50),
      createdAt: minutesAgo(50),
      updatedAt: minutesAgo(50),
    },
  });

  return {
    viewer,
    club,
    pinnedPrompt,
    activityPrompt,
    relevantPrompt,
    urgentPrompt,
    noDeadlinePrompt,
  };
}

function feedItemIds(response: request.Response) {
  return response.body.items.map((item: { id: string }) => item.id);
}

describe('GET /clubs/:id/feed ordering', () => {
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

  it('preserva ordenacao padrao com fixados primeiro', async () => {
    const {
      viewer,
      club,
      pinnedPrompt,
      noDeadlinePrompt,
      urgentPrompt,
      relevantPrompt,
      activityPrompt,
    } = await createOrderingScenario();

    const response = await request(app)
      .get(`/clubs/${club.id}/feed`)
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(feedItemIds(response)).toEqual([
      pinnedPrompt.id,
      noDeadlinePrompt.id,
      urgentPrompt.id,
      relevantPrompt.id,
      activityPrompt.id,
    ]);
  });

  it('ordena por atividade recente', async () => {
    const {
      viewer,
      club,
      activityPrompt,
      noDeadlinePrompt,
      urgentPrompt,
      relevantPrompt,
      pinnedPrompt,
    } = await createOrderingScenario();

    const response = await request(app)
      .get(`/clubs/${club.id}/feed`)
      .query({
        order: 'activity',
      })
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(feedItemIds(response)).toEqual([
      activityPrompt.id,
      noDeadlinePrompt.id,
      urgentPrompt.id,
      relevantPrompt.id,
      pinnedPrompt.id,
    ]);
  });

  it('ordena por relevancia usando contadores persistidos', async () => {
    const {
      viewer,
      club,
      relevantPrompt,
      urgentPrompt,
      pinnedPrompt,
      activityPrompt,
      noDeadlinePrompt,
    } = await createOrderingScenario();

    const response = await request(app)
      .get(`/clubs/${club.id}/feed`)
      .query({
        order: 'relevance',
      })
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(feedItemIds(response)).toEqual([
      relevantPrompt.id,
      urgentPrompt.id,
      pinnedPrompt.id,
      activityPrompt.id,
      noDeadlinePrompt.id,
    ]);
  });

  it('ordena por prazo proximo e envia prazos nulos para o fim', async () => {
    const {
      viewer,
      club,
      urgentPrompt,
      activityPrompt,
      pinnedPrompt,
      relevantPrompt,
      noDeadlinePrompt,
    } = await createOrderingScenario();

    const response = await request(app)
      .get(`/clubs/${club.id}/feed`)
      .query({
        order: 'deadline',
      })
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(feedItemIds(response)).toEqual([
      urgentPrompt.id,
      activityPrompt.id,
      pinnedPrompt.id,
      relevantPrompt.id,
      noDeadlinePrompt.id,
    ]);
  });

  it('ordena por conteudo fixado com secundaria estavel', async () => {
    const {
      viewer,
      club,
      pinnedPrompt,
      noDeadlinePrompt,
      urgentPrompt,
      relevantPrompt,
      activityPrompt,
    } = await createOrderingScenario();

    const response = await request(app)
      .get(`/clubs/${club.id}/feed`)
      .query({
        order: 'pinned',
      })
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(feedItemIds(response)).toEqual([
      pinnedPrompt.id,
      noDeadlinePrompt.id,
      urgentPrompt.id,
      relevantPrompt.id,
      activityPrompt.id,
    ]);
  });

  it('retorna 400 para ordenacao invalida', async () => {
    const { viewer, club } = await createOrderingScenario();

    const response = await request(app)
      .get(`/clubs/${club.id}/feed`)
      .query({
        order: 'ranking',
      })
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
      error: 'Ordenacao do feed do clube invalida',
    });
  });
});
