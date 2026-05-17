import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptStatus,
  ClubPromptType,
  ClubStatus,
  ClubVisibility,
  LikeTargetType,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import clubFeedRoutes from '../src/routes/clubs/feed.routes';
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

function futureDate(minutes = 60) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

async function createClubFeedScenario({
  clubStatus = ClubStatus.active,
  visibility = ClubVisibility.public,
  memberStatus = ClubMemberStatus.active,
}: {
  clubStatus?: ClubStatus;
  visibility?: ClubVisibility;
  memberStatus?: ClubMemberStatus;
} = {}) {
  const owner = await createTestUser();
  const author = await createTestUser({ name: 'Autora Feed' });
  const member = await createTestUser({ name: 'Membro Feed' });
  const responder = await createTestUser({ name: 'Pessoa Resposta' });
  const outsider = await createTestUser({ name: 'Pessoa Fora' });
  const club = await createTestClub({
    createdById: owner.id,
    status: clubStatus,
    visibility,
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

  const olderPrompt = await prisma.clubPrompt.create({
    data: {
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.truth,
      content: 'Prompt antigo do feed interno.',
      publishedAt: minutesAgo(40),
      createdAt: minutesAgo(40),
    },
  });
  const pinnedPrompt = await prisma.clubPrompt.create({
    data: {
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.dare,
      content: 'Prompt fixado do feed interno.',
      maxAttempts: 3,
      expiresAt: futureDate(120),
      answersCount: 2,
      commentsCount: 1,
      likesCount: 1,
      isPinned: true,
      publishedAt: minutesAgo(10),
      createdAt: minutesAgo(10),
    },
  });

  await prisma.like.create({
    data: {
      userId: member.id,
      targetId: pinnedPrompt.id,
      targetType: LikeTargetType.club_prompt,
    },
  });
  await prisma.clubPromptResponse.create({
    data: {
      clubId: club.id,
      promptId: pinnedPrompt.id,
      userId: member.id,
      text: 'Resposta do proprio membro.',
      completedAt: minutesAgo(9),
      createdAt: minutesAgo(9),
    },
  });
  await prisma.clubPromptResponse.create({
    data: {
      clubId: club.id,
      promptId: pinnedPrompt.id,
      userId: responder.id,
      text: 'Resposta recente visivel.',
      likesCount: 2,
      completedAt: minutesAgo(5),
      createdAt: minutesAgo(5),
    },
  });
  await prisma.clubPromptResponse.create({
    data: {
      clubId: club.id,
      promptId: pinnedPrompt.id,
      userId: responder.id,
      text: 'Resposta removida.',
      removedAt: minutesAgo(4),
      completedAt: minutesAgo(4),
      createdAt: minutesAgo(4),
    },
  });
  await prisma.clubPromptResponse.create({
    data: {
      clubId: club.id,
      promptId: pinnedPrompt.id,
      userId: responder.id,
      text: 'Resposta arquivada.',
      archivedAt: minutesAgo(3),
      completedAt: minutesAgo(3),
      createdAt: minutesAgo(3),
    },
  });
  await prisma.clubPrompt.createMany({
    data: [
      {
        clubId: club.id,
        authorId: author.id,
        type: ClubPromptType.truth,
        status: ClubPromptStatus.archived,
        content: 'Prompt arquivado fora do feed.',
        archivedAt: minutesAgo(2),
      },
      {
        clubId: club.id,
        authorId: author.id,
        type: ClubPromptType.truth,
        status: ClubPromptStatus.removed,
        content: 'Prompt removido fora do feed.',
        removedAt: minutesAgo(1),
      },
    ],
  });

  return {
    owner,
    author,
    member,
    responder,
    outsider,
    club,
    olderPrompt,
    pinnedPrompt,
  };
}

describe('GET /clubs/:id/feed', () => {
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

  it('retorna 401 sem token', async () => {
    const response = await request(app).get('/clubs/club-id/feed');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      error: expect.any(String),
    });
  });

  it('retorna feed interno com prompts contadores estado do usuario e respostas recentes', async () => {
    const { member, club, pinnedPrompt, olderPrompt } =
      await createClubFeedScenario();

    const response = await request(app)
      .get(`/clubs/${club.id}/feed`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);

    expect(response.status).toBe(200);
    expect(response.body.club).toMatchObject({
      id: club.id,
      name: club.name,
      viewerMembership: {
        isMember: true,
        status: ClubMemberStatus.active,
      },
    });
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items[0]).toMatchObject({
      id: pinnedPrompt.id,
      type: ClubPromptType.dare,
      answersCount: 2,
      commentsCount: 1,
      likesCount: 1,
      isPinned: true,
      viewerState: {
        likedByMe: true,
        answeredByMe: true,
        canAnswer: true,
      },
    });
    expect(response.body.items[0].recentResponses).toEqual([
      expect.objectContaining({
        text: 'Resposta recente visivel.',
        userName: 'Pessoa Resposta',
        likesCount: 2,
      }),
      expect.objectContaining({
        text: 'Resposta do proprio membro.',
        userName: 'Membro Feed',
      }),
    ]);
    expect(response.body.items[1]).toMatchObject({
      id: olderPrompt.id,
      viewerState: {
        likedByMe: false,
        answeredByMe: false,
        canAnswer: true,
      },
      recentResponses: [],
    });
  });

  it('oculta prompts e respostas indisponiveis', async () => {
    const { member, club } = await createClubFeedScenario();

    const response = await request(app)
      .get(`/clubs/${club.id}/feed`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);

    expect(response.status).toBe(200);
    expect(
      response.body.items.map((item: { content: string }) => item.content),
    ).not.toEqual(
      expect.arrayContaining([
        'Prompt arquivado fora do feed.',
        'Prompt removido fora do feed.',
      ]),
    );
    expect(response.body.items[0].recentResponses).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'Resposta removida.',
        }),
        expect.objectContaining({
          text: 'Resposta arquivada.',
        }),
      ]),
    );
  });

  it('permite visualizacao de clube publico por outsider mas bloqueia interacao', async () => {
    const { outsider, club } = await createClubFeedScenario();

    const response = await request(app)
      .get(`/clubs/${club.id}/feed`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`);

    expect(response.status).toBe(200);
    expect(response.body.club.viewerMembership).toMatchObject({
      isMember: false,
      role: null,
      status: null,
    });
    expect(response.body.items[0].viewerState).toMatchObject({
      likedByMe: false,
      answeredByMe: false,
      canAnswer: false,
    });
  });

  it('bloqueia outsider membership inativa e clube indisponivel', async () => {
    const privateScenario = await createClubFeedScenario({
      visibility: ClubVisibility.private,
    });
    const inactiveMembershipScenario = await createClubFeedScenario({
      memberStatus: ClubMemberStatus.removed,
    });
    const archivedClubScenario = await createClubFeedScenario({
      clubStatus: ClubStatus.archived,
    });
    const suspendedClubScenario = await createClubFeedScenario({
      clubStatus: ClubStatus.suspended,
    });

    const privateOutsiderResponse = await request(app)
      .get(`/clubs/${privateScenario.club.id}/feed`)
      .set('Authorization', `Bearer ${authTokenFor(privateScenario.outsider)}`);
    const inactiveMembershipResponse = await request(app)
      .get(`/clubs/${inactiveMembershipScenario.club.id}/feed`)
      .set(
        'Authorization',
        `Bearer ${authTokenFor(inactiveMembershipScenario.member)}`,
      );
    const archivedClubResponse = await request(app)
      .get(`/clubs/${archivedClubScenario.club.id}/feed`)
      .set('Authorization', `Bearer ${authTokenFor(archivedClubScenario.member)}`);
    const suspendedClubResponse = await request(app)
      .get(`/clubs/${suspendedClubScenario.club.id}/feed`)
      .set(
        'Authorization',
        `Bearer ${authTokenFor(suspendedClubScenario.member)}`,
      );

    expect(privateOutsiderResponse.status).toBe(403);
    expect(inactiveMembershipResponse.status).toBe(403);
    expect(archivedClubResponse.status).toBe(403);
    expect(suspendedClubResponse.status).toBe(403);
  });

  it('retorna 404 para clube deletado soft deleted ou inexistente', async () => {
    const deletedClubScenario = await createClubFeedScenario({
      clubStatus: ClubStatus.deleted,
    });
    const softDeletedClubScenario = await createClubFeedScenario();

    await prisma.club.update({
      where: {
        id: softDeletedClubScenario.club.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    const deletedClubResponse = await request(app)
      .get(`/clubs/${deletedClubScenario.club.id}/feed`)
      .set('Authorization', `Bearer ${authTokenFor(deletedClubScenario.member)}`);
    const softDeletedClubResponse = await request(app)
      .get(`/clubs/${softDeletedClubScenario.club.id}/feed`)
      .set(
        'Authorization',
        `Bearer ${authTokenFor(softDeletedClubScenario.member)}`,
      );
    const missingClubResponse = await request(app)
      .get('/clubs/clube-inexistente/feed')
      .set(
        'Authorization',
        `Bearer ${authTokenFor(softDeletedClubScenario.member)}`,
      );

    expect(deletedClubResponse.status).toBe(404);
    expect(softDeletedClubResponse.status).toBe(404);
    expect(missingClubResponse.status).toBe(404);
  });
});
