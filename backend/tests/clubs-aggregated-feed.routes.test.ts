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

function futureDate(minutes = 60) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

async function createClubWithViewer({
  viewerId,
  ownerId,
  visibility = ClubVisibility.public,
  status = ClubStatus.active,
  memberStatus = ClubMemberStatus.active,
}: {
  viewerId: string;
  ownerId: string;
  visibility?: ClubVisibility;
  status?: ClubStatus;
  memberStatus?: ClubMemberStatus;
}) {
  const club = await createTestClub({
    createdById: ownerId,
    visibility,
    status,
    memberCount: 2,
  });

  await addUserToClub(club.id, ownerId, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, viewerId, {
    role: ClubMemberRole.member,
    status: memberStatus,
  });

  return club;
}

async function createPrompt({
  clubId,
  authorId,
  content,
  createdAt = minutesAgo(10),
  status = ClubPromptStatus.published,
  type = ClubPromptType.truth,
}: {
  clubId: string;
  authorId: string;
  content: string;
  createdAt?: Date;
  status?: ClubPromptStatus;
  type?: ClubPromptType;
}) {
  return prisma.clubPrompt.create({
    data: {
      clubId,
      authorId,
      type,
      status,
      content,
      answersCount: 2,
      commentsCount: 3,
      likesCount: 4,
      expiresAt: futureDate(90),
      publishedAt: createdAt,
      createdAt,
      archivedAt:
        status === ClubPromptStatus.archived ? minutesAgo(1) : undefined,
      removedAt:
        status === ClubPromptStatus.removed ? minutesAgo(1) : undefined,
    },
  });
}

describe('GET /clubs/feed', () => {
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
    const response = await request(app).get('/clubs/feed');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      error: expect.any(String),
    });
  });

  it('retorna 200 vazio para usuario sem clubes e preserva ordem da rota agregada', async () => {
    const viewer = await createTestUser();

    const response = await request(app)
      .get('/clubs/feed')
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [],
    });
  });

  it('agrega prompts e respostas recentes dos clubes ativos do usuario', async () => {
    const owner = await createTestUser({ name: 'Dona Clube' });
    const viewer = await createTestUser({ name: 'Membro Agregado' });
    const author = await createTestUser({ name: 'Autora Agregada' });
    const responder = await createTestUser({ name: 'Pessoa Resposta' });
    const publicClub = await createClubWithViewer({
      viewerId: viewer.id,
      ownerId: owner.id,
    });
    const privateClub = await createClubWithViewer({
      viewerId: viewer.id,
      ownerId: owner.id,
      visibility: ClubVisibility.private,
    });

    await addUserToClub(publicClub.id, author.id);
    await addUserToClub(publicClub.id, responder.id);
    await addUserToClub(privateClub.id, author.id);
    await addUserToClub(privateClub.id, responder.id);

    const likedPrompt = await createPrompt({
      clubId: publicClub.id,
      authorId: author.id,
      content: 'Prompt curtido no agregado.',
      createdAt: minutesAgo(20),
    });
    const privatePrompt = await createPrompt({
      clubId: privateClub.id,
      authorId: author.id,
      content: 'Prompt privado com resposta recente.',
      createdAt: minutesAgo(15),
      type: ClubPromptType.dare,
    });

    await prisma.like.create({
      data: {
        userId: viewer.id,
        targetId: likedPrompt.id,
        targetType: LikeTargetType.club_prompt,
      },
    });
    await prisma.like.create({
      data: {
        userId: viewer.id,
        targetId: privatePrompt.id,
        targetType: LikeTargetType.club,
      },
    });
    await prisma.clubPromptResponse.create({
      data: {
        clubId: publicClub.id,
        promptId: likedPrompt.id,
        userId: viewer.id,
        text: 'Resposta do proprio usuario.',
        likesCount: 6,
        commentsCount: 1,
        completedAt: minutesAgo(12),
        createdAt: minutesAgo(12),
      },
    });
    const recentResponse = await prisma.clubPromptResponse.create({
      data: {
        clubId: privateClub.id,
        promptId: privatePrompt.id,
        userId: responder.id,
        text: 'Resposta recente agregada.',
        likesCount: 7,
        commentsCount: 2,
        completedAt: minutesAgo(2),
        createdAt: minutesAgo(2),
      },
    });

    const response = await request(app)
      .get('/clubs/feed')
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);

    expect(response.status).toBe(200);
    expect(response.body.items[0]).toMatchObject({
      id: `response:${recentResponse.id}`,
      activityType: 'response',
      club: {
        id: privateClub.id,
        viewerMembership: {
          isMember: true,
          status: ClubMemberStatus.active,
        },
      },
      prompt: {
        id: privatePrompt.id,
        likesCount: 4,
        answersCount: 2,
        commentsCount: 3,
      },
      response: {
        id: recentResponse.id,
        likesCount: 7,
        commentsCount: 2,
      },
    });
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: `prompt:${likedPrompt.id}`,
          activityType: 'prompt',
          club: expect.objectContaining({
            id: publicClub.id,
          }),
          prompt: expect.objectContaining({
            id: likedPrompt.id,
            answersCount: 2,
            commentsCount: 3,
            likesCount: 4,
            viewerState: {
              likedByMe: true,
              answeredByMe: true,
              canAnswer: true,
            },
            recentResponses: [
              expect.objectContaining({
                text: 'Resposta do proprio usuario.',
                likesCount: 6,
                commentsCount: 1,
              }),
            ],
          }),
        }),
        expect.objectContaining({
          id: `prompt:${privatePrompt.id}`,
          prompt: expect.objectContaining({
            viewerState: expect.objectContaining({
              likedByMe: false,
              canAnswer: true,
            }),
          }),
        }),
      ]),
    );
  });

  it('nao vaza atividades de outsiders memberships inativas ou clubes indisponiveis', async () => {
    const owner = await createTestUser();
    const viewer = await createTestUser();
    const author = await createTestUser();
    const allowedClub = await createClubWithViewer({
      viewerId: viewer.id,
      ownerId: owner.id,
    });
    const outsiderClub = await createTestClub({
      createdById: owner.id,
      visibility: ClubVisibility.private,
    });
    const removedClub = await createClubWithViewer({
      viewerId: viewer.id,
      ownerId: owner.id,
      memberStatus: ClubMemberStatus.removed,
    });
    const inviteOnlyClub = await createClubWithViewer({
      viewerId: viewer.id,
      ownerId: owner.id,
      visibility: ClubVisibility.invite_only,
    });
    const archivedClub = await createClubWithViewer({
      viewerId: viewer.id,
      ownerId: owner.id,
      status: ClubStatus.archived,
    });
    const suspendedClub = await createClubWithViewer({
      viewerId: viewer.id,
      ownerId: owner.id,
      status: ClubStatus.suspended,
    });
    const deletedClub = await createClubWithViewer({
      viewerId: viewer.id,
      ownerId: owner.id,
      status: ClubStatus.deleted,
    });
    const softDeletedClub = await createClubWithViewer({
      viewerId: viewer.id,
      ownerId: owner.id,
    });

    await prisma.club.update({
      where: {
        id: softDeletedClub.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    const scenarios = [
      [allowedClub.id, 'Prompt permitido.'],
      [outsiderClub.id, 'Prompt outsider privado.'],
      [removedClub.id, 'Prompt membership removida.'],
      [inviteOnlyClub.id, 'Prompt invite only permitido.'],
      [archivedClub.id, 'Prompt clube arquivado.'],
      [suspendedClub.id, 'Prompt clube suspenso.'],
      [deletedClub.id, 'Prompt clube deletado.'],
      [softDeletedClub.id, 'Prompt clube soft deleted.'],
    ] as const;

    for (const [clubId, content] of scenarios) {
      await addUserToClub(clubId, author.id);
      await createPrompt({
        clubId,
        authorId: author.id,
        content,
      });
    }

    const response = await request(app)
      .get('/clubs/feed')
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);
    const promptContents = response.body.items
      .filter((item: { activityType: string }) => item.activityType === 'prompt')
      .map((item: { prompt: { content: string } }) => item.prompt.content);

    expect(response.status).toBe(200);
    expect(promptContents).toEqual(
      expect.arrayContaining([
        'Prompt permitido.',
        'Prompt invite only permitido.',
      ]),
    );
    expect(promptContents).not.toEqual(
      expect.arrayContaining([
        'Prompt outsider privado.',
        'Prompt membership removida.',
        'Prompt clube arquivado.',
        'Prompt clube suspenso.',
        'Prompt clube deletado.',
        'Prompt clube soft deleted.',
      ]),
    );
  });

  it('oculta prompts e respostas arquivados ou removidos', async () => {
    const owner = await createTestUser();
    const viewer = await createTestUser();
    const author = await createTestUser();
    const responder = await createTestUser();
    const club = await createClubWithViewer({
      viewerId: viewer.id,
      ownerId: owner.id,
    });

    await addUserToClub(club.id, author.id);
    await addUserToClub(club.id, responder.id);

    const visiblePrompt = await createPrompt({
      clubId: club.id,
      authorId: author.id,
      content: 'Prompt visivel.',
    });
    await createPrompt({
      clubId: club.id,
      authorId: author.id,
      content: 'Prompt arquivado.',
      status: ClubPromptStatus.archived,
    });
    await createPrompt({
      clubId: club.id,
      authorId: author.id,
      content: 'Prompt removido.',
      status: ClubPromptStatus.removed,
    });
    await prisma.clubPromptResponse.create({
      data: {
        clubId: club.id,
        promptId: visiblePrompt.id,
        userId: responder.id,
        text: 'Resposta visivel.',
        createdAt: minutesAgo(1),
      },
    });
    await prisma.clubPromptResponse.create({
      data: {
        clubId: club.id,
        promptId: visiblePrompt.id,
        userId: responder.id,
        text: 'Resposta arquivada.',
        archivedAt: minutesAgo(1),
        createdAt: minutesAgo(1),
      },
    });
    await prisma.clubPromptResponse.create({
      data: {
        clubId: club.id,
        promptId: visiblePrompt.id,
        userId: responder.id,
        text: 'Resposta removida.',
        removedAt: minutesAgo(1),
        createdAt: minutesAgo(1),
      },
    });

    const response = await request(app)
      .get('/clubs/feed')
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);
    const serializedFeed = JSON.stringify(response.body);

    expect(response.status).toBe(200);
    expect(serializedFeed).toContain('Prompt visivel.');
    expect(serializedFeed).toContain('Resposta visivel.');
    expect(serializedFeed).not.toContain('Prompt arquivado.');
    expect(serializedFeed).not.toContain('Prompt removido.');
    expect(serializedFeed).not.toContain('Resposta arquivada.');
    expect(serializedFeed).not.toContain('Resposta removida.');
  });

  it('nao vaza prompt de outro clube por resposta com clubId inconsistente', async () => {
    const owner = await createTestUser();
    const viewer = await createTestUser();
    const author = await createTestUser();
    const responder = await createTestUser();
    const allowedClub = await createClubWithViewer({
      viewerId: viewer.id,
      ownerId: owner.id,
    });
    const hiddenClub = await createTestClub({
      createdById: owner.id,
      visibility: ClubVisibility.private,
    });

    await addUserToClub(allowedClub.id, author.id);
    await addUserToClub(allowedClub.id, responder.id);
    await addUserToClub(hiddenClub.id, author.id);

    const visiblePrompt = await createPrompt({
      clubId: allowedClub.id,
      authorId: author.id,
      content: 'Prompt permitido no clube correto.',
    });
    const hiddenPrompt = await createPrompt({
      clubId: hiddenClub.id,
      authorId: author.id,
      content: 'Prompt privado nao deve vazar.',
    });

    await prisma.clubPromptResponse.create({
      data: {
        clubId: allowedClub.id,
        promptId: visiblePrompt.id,
        userId: responder.id,
        text: 'Resposta consistente visivel.',
        createdAt: minutesAgo(2),
      },
    });
    await prisma.clubPromptResponse.create({
      data: {
        clubId: allowedClub.id,
        promptId: hiddenPrompt.id,
        userId: responder.id,
        text: 'Resposta inconsistente nao deve vazar.',
        createdAt: minutesAgo(1),
      },
    });

    const response = await request(app)
      .get('/clubs/feed')
      .set('Authorization', `Bearer ${authTokenFor(viewer)}`);
    const serializedFeed = JSON.stringify(response.body);

    expect(response.status).toBe(200);
    expect(serializedFeed).toContain('Prompt permitido no clube correto.');
    expect(serializedFeed).toContain('Resposta consistente visivel.');
    expect(serializedFeed).not.toContain('Prompt privado nao deve vazar.');
    expect(serializedFeed).not.toContain(
      'Resposta inconsistente nao deve vazar.',
    );
  });
});
