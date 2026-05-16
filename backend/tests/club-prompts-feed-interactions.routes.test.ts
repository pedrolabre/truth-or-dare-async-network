import request from 'supertest';
import app from '../src/app';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptType,
  ClubVisibility,
  LikeTargetType,
  ProofMediaType,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import {
  addUserToClub,
  createTestClub,
  createTestUser,
  resetFeedData,
} from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { applyTestDatabaseHooks } from './test-db';

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

async function createFeedInteractionScenario() {
  const owner = await createTestUser({ name: 'Dona Fluxo Final' });
  const author = await createTestUser({ name: 'Autora Fluxo Final' });
  const viewer = await createTestUser({ name: 'Viewer Fluxo Final' });
  const responder = await createTestUser({ name: 'Responder Fluxo Final' });
  const outsider = await createTestUser({ name: 'Outsider Fluxo Final' });
  const club = await createTestClub({
    createdById: owner.id,
    name: 'Clube Fluxo Final',
    visibility: ClubVisibility.public,
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
  await addUserToClub(club.id, viewer.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, responder.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
  });

  return {
    owner,
    author,
    viewer,
    responder,
    outsider,
    club,
  };
}

type FeedPromptItem = {
  id: string;
  content: string;
  answersCount: number;
  commentsCount: number;
  likesCount: number;
  viewerState: {
    likedByMe: boolean;
    answeredByMe: boolean;
    canAnswer: boolean;
  };
  recentResponses: {
    id: string;
    text: string;
    likesCount: number;
  }[];
};

function findClubFeedPrompt(items: FeedPromptItem[], promptId: string) {
  return items.find((item) => item.id === promptId);
}

function findAggregatedPromptActivity(
  items: {
    activityType: string;
    prompt: FeedPromptItem;
  }[],
  promptId: string,
) {
  return items.find(
    (item) => item.activityType === 'prompt' && item.prompt.id === promptId,
  );
}

function findAggregatedResponseActivity(
  items: {
    activityType: string;
    response?: {
      id: string;
      likesCount: number;
    };
  }[],
  responseId: string,
) {
  return items.find(
    (item) =>
      item.activityType === 'response' && item.response?.id === responseId,
  );
}

describe('club prompt feed interactions', () => {
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

  it('propaga prompt publicado e interacoes para feed interno agregado e geral', async () => {
    const { author, viewer, responder, club } =
      await createFeedInteractionScenario();
    const authorToken = authTokenFor(author);
    const viewerToken = authTokenFor(viewer);
    const responderToken = authTokenFor(responder);

    const publishResponse = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        type: ClubPromptType.dare,
        content: 'Desafio integrado do Bloco 9.',
        maxAttempts: 3,
        expiresAt: futureDate(90).toISOString(),
        isMembersOnly: true,
      });

    expect(publishResponse.status).toBe(201);

    const promptId = publishResponse.body.id as string;

    const initialInternalFeed = await request(app)
      .get(`/clubs/${club.id}/feed`)
      .set('Authorization', `Bearer ${viewerToken}`);
    const initialAggregatedFeed = await request(app)
      .get('/clubs/feed')
      .set('Authorization', `Bearer ${viewerToken}`);
    const initialGeneralFeed = await request(app)
      .get('/feed')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(initialInternalFeed.status).toBe(200);
    expect(findClubFeedPrompt(initialInternalFeed.body.items, promptId)).toMatchObject({
      id: promptId,
      content: 'Desafio integrado do Bloco 9.',
      answersCount: 0,
      commentsCount: 0,
      likesCount: 0,
      viewerState: {
        likedByMe: false,
        answeredByMe: false,
        canAnswer: true,
      },
    });

    expect(initialAggregatedFeed.status).toBe(200);
    expect(
      findAggregatedPromptActivity(initialAggregatedFeed.body.items, promptId),
    ).toMatchObject({
      prompt: expect.objectContaining({
        id: promptId,
        content: 'Desafio integrado do Bloco 9.',
      }),
    });

    expect(initialGeneralFeed.status).toBe(200);
    expect(initialGeneralFeed.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: promptId,
          type: 'club',
          clubName: 'Clube Fluxo Final',
          badge: 'Desafio',
          quote: 'Desafio integrado do Bloco 9.',
          answersCount: 0,
          likesCount: 0,
          likedByMe: false,
        }),
      ]),
    );

    const promptLikeResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${promptId}/like`)
      .set('Authorization', `Bearer ${viewerToken}`);
    const answerResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${promptId}/responses`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        text: 'Prova integrada do Bloco 9.',
        mediaUrl: 'https://example.com/prova-integrada.mp4',
        mediaType: ProofMediaType.video,
      });
    const commentResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${promptId}/comments`)
      .set('Authorization', `Bearer ${responderToken}`)
      .send({
        text: 'Comentario integrado do Bloco 9.',
      });

    expect(promptLikeResponse.status).toBe(200);
    expect(promptLikeResponse.body).toEqual({
      liked: true,
      likesCount: 1,
    });
    expect(answerResponse.status).toBe(201);
    expect(commentResponse.status).toBe(201);

    const responseId = answerResponse.body.id as string;
    const responseLikeResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${promptId}/responses/${responseId}/like`)
      .set('Authorization', `Bearer ${responderToken}`);

    expect(responseLikeResponse.status).toBe(200);
    expect(responseLikeResponse.body).toEqual({
      liked: true,
      likesCount: 1,
    });

    const [persistedPrompt, persistedResponse, persistedLikes] =
      await Promise.all([
        prisma.clubPrompt.findUniqueOrThrow({
          where: {
            id: promptId,
          },
        }),
        prisma.clubPromptResponse.findUniqueOrThrow({
          where: {
            id: responseId,
          },
        }),
        prisma.like.findMany({
          where: {
            OR: [
              {
                targetId: promptId,
              },
              {
                targetId: responseId,
              },
            ],
          },
          select: {
            targetId: true,
            targetType: true,
          },
          orderBy: {
            targetType: 'asc',
          },
        }),
      ]);

    expect(persistedPrompt).toMatchObject({
      answersCount: 1,
      commentsCount: 1,
      likesCount: 1,
    });
    expect(persistedResponse).toMatchObject({
      likesCount: 1,
    });
    expect(persistedLikes).toEqual(
      expect.arrayContaining([
        {
          targetId: promptId,
          targetType: LikeTargetType.club_prompt,
        },
        {
          targetId: responseId,
          targetType: LikeTargetType.club_response,
        },
      ]),
    );
    expect(persistedLikes).not.toEqual(
      expect.arrayContaining([
        {
          targetId: promptId,
          targetType: LikeTargetType.club,
        },
      ]),
    );

    const internalFeed = await request(app)
      .get(`/clubs/${club.id}/feed`)
      .set('Authorization', `Bearer ${viewerToken}`);
    const aggregatedFeed = await request(app)
      .get('/clubs/feed')
      .set('Authorization', `Bearer ${viewerToken}`);
    const generalFeed = await request(app)
      .get('/feed')
      .set('Authorization', `Bearer ${viewerToken}`);

    const internalPrompt = findClubFeedPrompt(internalFeed.body.items, promptId);
    const aggregatedPrompt = findAggregatedPromptActivity(
      aggregatedFeed.body.items,
      promptId,
    );
    const aggregatedResponse = findAggregatedResponseActivity(
      aggregatedFeed.body.items,
      responseId,
    );

    expect(internalFeed.status).toBe(200);
    expect(internalPrompt).toMatchObject({
      answersCount: 1,
      commentsCount: 1,
      likesCount: 1,
      viewerState: {
        likedByMe: true,
        answeredByMe: true,
        canAnswer: true,
      },
      recentResponses: [
        expect.objectContaining({
          id: responseId,
          text: 'Prova integrada do Bloco 9.',
          likesCount: 1,
        }),
      ],
    });

    expect(aggregatedFeed.status).toBe(200);
    expect(aggregatedPrompt).toMatchObject({
      prompt: expect.objectContaining({
        answersCount: 1,
        commentsCount: 1,
        likesCount: 1,
        viewerState: {
          likedByMe: true,
          answeredByMe: true,
          canAnswer: true,
        },
      }),
    });
    expect(aggregatedResponse).toMatchObject({
      response: expect.objectContaining({
        id: responseId,
        likesCount: 1,
      }),
    });

    expect(generalFeed.status).toBe(200);
    expect(generalFeed.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: promptId,
          type: 'club',
          answersCount: 1,
          likesCount: 1,
          likedByMe: true,
        }),
      ]),
    );
  });

  it('remove prompt arquivado das superficies de feed de clubes e feed geral', async () => {
    const { author, viewer, club } = await createFeedInteractionScenario();
    const authorToken = authTokenFor(author);
    const viewerToken = authTokenFor(viewer);

    const publishResponse = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        type: ClubPromptType.truth,
        content: 'Prompt que sera arquivado no Bloco 9.',
      });

    expect(publishResponse.status).toBe(201);

    const promptId = publishResponse.body.id as string;
    const archiveResponse = await request(app)
      .delete(`/clubs/${club.id}/prompts/${promptId}`)
      .set('Authorization', `Bearer ${authorToken}`);

    expect(archiveResponse.status).toBe(200);
    expect(archiveResponse.body).toMatchObject({
      id: promptId,
      status: 'archived',
    });

    const internalFeed = await request(app)
      .get(`/clubs/${club.id}/feed`)
      .set('Authorization', `Bearer ${viewerToken}`);
    const aggregatedFeed = await request(app)
      .get('/clubs/feed')
      .set('Authorization', `Bearer ${viewerToken}`);
    const generalFeed = await request(app)
      .get('/feed')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(internalFeed.status).toBe(200);
    expect(internalFeed.body.items).toEqual([]);
    expect(JSON.stringify(aggregatedFeed.body)).not.toContain(promptId);
    expect(JSON.stringify(generalFeed.body)).not.toContain(promptId);
    expect(JSON.stringify(generalFeed.body)).not.toContain(
      'Prompt que sera arquivado no Bloco 9.',
    );
  });

  it('mantem responsabilidades separadas para outsider feed agregado e feed geral', async () => {
    const { author, outsider, club } = await createFeedInteractionScenario();
    const authorToken = authTokenFor(author);
    const outsiderToken = authTokenFor(outsider);

    const membersOnlyResponse = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        type: ClubPromptType.truth,
        content: 'Prompt members only fora do feed geral.',
        isMembersOnly: true,
      });
    const publicResponse = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        type: ClubPromptType.truth,
        content: 'Prompt publico aberto no feed geral.',
        isMembersOnly: false,
      });

    expect(membersOnlyResponse.status).toBe(201);
    expect(publicResponse.status).toBe(201);

    const internalFeed = await request(app)
      .get(`/clubs/${club.id}/feed`)
      .set('Authorization', `Bearer ${outsiderToken}`);
    const aggregatedFeed = await request(app)
      .get('/clubs/feed')
      .set('Authorization', `Bearer ${outsiderToken}`);
    const generalFeed = await request(app)
      .get('/feed')
      .set('Authorization', `Bearer ${outsiderToken}`);

    expect(internalFeed.status).toBe(200);
    expect(internalFeed.body.items[0].viewerState).toMatchObject({
      likedByMe: false,
      answeredByMe: false,
      canAnswer: false,
    });
    expect(aggregatedFeed.status).toBe(200);
    expect(aggregatedFeed.body).toEqual({
      items: [],
    });
    expect(generalFeed.status).toBe(200);
    expect(JSON.stringify(generalFeed.body)).toContain(
      'Prompt publico aberto no feed geral.',
    );
    expect(JSON.stringify(generalFeed.body)).not.toContain(
      'Prompt members only fora do feed geral.',
    );
  });
});
