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
import clubsRoutes from '../src/routes/clubs/clubs.routes';
import clubFeedRoutes from '../src/routes/clubs/feed.routes';
import clubLikesRoutes from '../src/routes/clubs/likes.routes';
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
  app.use('/clubs', clubFeedRoutes);
  app.use('/clubs', clubPromptsRoutes);
  app.use('/clubs', clubsRoutes);
  app.use(clubLikesRoutes);

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

async function createPrivateClubScenario() {
  const owner = await createTestUser({ name: 'Owner Regressao Final' });
  const member = await createTestUser({ name: 'Membro Regressao Final' });
  const removed = await createTestUser({ name: 'Removido Regressao Final' });
  const outsider = await createTestUser({ name: 'Outsider Regressao Final' });
  const club = await createTestClub({
    createdById: owner.id,
    visibility: ClubVisibility.private,
    memberCount: 2,
  });

  await addUserToClub(club.id, owner.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, member.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, removed.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.removed,
    joinedAt: null,
  });

  const prompt = await createTestClubPrompt({
    clubId: club.id,
    authorId: owner.id,
    type: ClubPromptType.truth,
    content: 'Prompt privado para regressao final.',
    expiresAt: futureDate(),
  });
  const promptResponse = await prisma.clubPromptResponse.create({
    data: {
      clubId: club.id,
      promptId: prompt.id,
      userId: member.id,
      text: 'Resposta privada para regressao final.',
      completedAt: new Date(),
    },
  });
  const promptComment = await prisma.clubPromptComment.create({
    data: {
      clubId: club.id,
      promptId: prompt.id,
      userId: member.id,
      text: 'Comentario privado para regressao final.',
    },
  });

  return {
    owner,
    member,
    removed,
    outsider,
    club,
    prompt,
    promptResponse,
    promptComment,
  };
}

describe('clubs moderation final regression routes', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('nega detalhe, feed e lista interna de clube privado para outsider e membro removido', async () => {
    const { outsider, removed, club } = await createPrivateClubScenario();

    const responses = await Promise.all([
      request(app)
        .get(`/clubs/${club.id}`)
        .set('Authorization', `Bearer ${authTokenFor(outsider)}`),
      request(app)
        .get(`/clubs/${club.id}`)
        .set('Authorization', `Bearer ${authTokenFor(removed)}`),
      request(app)
        .get(`/clubs/${club.id}/feed`)
        .set('Authorization', `Bearer ${authTokenFor(outsider)}`),
      request(app)
        .get(`/clubs/${club.id}/feed`)
        .set('Authorization', `Bearer ${authTokenFor(removed)}`),
      request(app)
        .get(`/clubs/${club.id}/members`)
        .set('Authorization', `Bearer ${authTokenFor(outsider)}`),
      request(app)
        .get(`/clubs/${club.id}/members`)
        .set('Authorization', `Bearer ${authTokenFor(removed)}`),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        code: 'CLUB_FORBIDDEN',
      });
    }
  });

  it('nega prompt, respostas, comentarios, reports e likes privados para outsider e membro removido', async () => {
    const { outsider, removed, club, prompt, promptResponse, promptComment } =
      await createPrivateClubScenario();

    const responses = await Promise.all([
      request(app)
        .post(`/clubs/${club.id}/prompts/${prompt.id}/like`)
        .set('Authorization', `Bearer ${authTokenFor(outsider)}`),
      request(app)
        .post(`/clubs/${club.id}/prompts/${prompt.id}/like`)
        .set('Authorization', `Bearer ${authTokenFor(removed)}`),
      request(app)
        .post(`/clubs/${club.id}/prompts/${prompt.id}/responses`)
        .set('Authorization', `Bearer ${authTokenFor(outsider)}`)
        .send({
          text: 'Resposta outsider bloqueada.',
        }),
      request(app)
        .post(`/clubs/${club.id}/prompts/${prompt.id}/responses`)
        .set('Authorization', `Bearer ${authTokenFor(removed)}`)
        .send({
          text: 'Resposta removido bloqueada.',
        }),
      request(app)
        .post(`/clubs/${club.id}/prompts/${prompt.id}/comments`)
        .set('Authorization', `Bearer ${authTokenFor(outsider)}`)
        .send({
          text: 'Comentario outsider bloqueado.',
        }),
      request(app)
        .post(`/clubs/${club.id}/prompts/${prompt.id}/comments`)
        .set('Authorization', `Bearer ${authTokenFor(removed)}`)
        .send({
          text: 'Comentario removido bloqueado.',
        }),
      request(app)
        .post(`/clubs/${club.id}/prompts/${prompt.id}/report`)
        .set('Authorization', `Bearer ${authTokenFor(outsider)}`)
        .send({
          reason: 'spam',
        }),
      request(app)
        .post(
          `/clubs/${club.id}/prompts/${prompt.id}/responses/${promptResponse.id}/report`,
        )
        .set('Authorization', `Bearer ${authTokenFor(removed)}`)
        .send({
          reason: 'spam',
        }),
      request(app)
        .post(
          `/clubs/${club.id}/prompts/${prompt.id}/comments/${promptComment.id}/report`,
        )
        .set('Authorization', `Bearer ${authTokenFor(outsider)}`)
        .send({
          reason: 'spam',
        }),
      request(app)
        .post(`/clubs/${club.id}/prompts/${prompt.id}/responses/${promptResponse.id}/like`)
        .set('Authorization', `Bearer ${authTokenFor(removed)}`),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        code: 'CLUB_FORBIDDEN',
      });
    }

    await expect(
      prisma.like.count({
        where: {
          targetId: {
            in: [prompt.id, promptResponse.id],
          },
          targetType: {
            in: [LikeTargetType.club_prompt, LikeTargetType.club_response],
          },
        },
      }),
    ).resolves.toBe(0);
    await expect(prisma.clubReport.count()).resolves.toBe(0);
    await expect(prisma.clubPromptResponse.count()).resolves.toBe(1);
    await expect(prisma.clubPromptComment.count()).resolves.toBe(1);
  });

  it('nega bloqueio, suspensao e remocao por usuario sem permissao sem alterar o alvo', async () => {
    const { member, removed, club } = await createPrivateClubScenario();

    const blockResponse = await request(app)
      .post(`/clubs/${club.id}/members/${member.id}/block`)
      .set('Authorization', `Bearer ${authTokenFor(removed)}`);
    const suspendResponse = await request(app)
      .post(`/clubs/${club.id}/members/${member.id}/suspend-posting`)
      .set('Authorization', `Bearer ${authTokenFor(removed)}`)
      .send({
        suspendedUntil: futureDate().toISOString(),
      });
    const removeResponse = await request(app)
      .post(`/clubs/${club.id}/members/${member.id}/remove`)
      .set('Authorization', `Bearer ${authTokenFor(removed)}`);

    for (const response of [blockResponse, suspendResponse, removeResponse]) {
      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        code: 'CLUB_FORBIDDEN',
      });
    }

    await expect(
      prisma.clubMember.findUniqueOrThrow({
        where: {
          clubId_userId: {
            clubId: club.id,
            userId: member.id,
          },
        },
      }),
    ).resolves.toMatchObject({
      status: ClubMemberStatus.active,
      postingSuspendedUntil: null,
    });
  });

  it('protege owner contra auto-remocao, auto-bloqueio e auto-suspensao', async () => {
    const { owner, club } = await createPrivateClubScenario();

    const leaveResponse = await request(app)
      .post(`/clubs/${club.id}/leave`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);
    const selfRemoveResponse = await request(app)
      .post(`/clubs/${club.id}/members/${owner.id}/remove`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);
    const selfBlockResponse = await request(app)
      .post(`/clubs/${club.id}/members/${owner.id}/block`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);
    const selfSuspendResponse = await request(app)
      .post(`/clubs/${club.id}/members/${owner.id}/suspend-posting`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        suspendedUntil: futureDate().toISOString(),
      });

    for (const response of [
      leaveResponse,
      selfRemoveResponse,
      selfBlockResponse,
      selfSuspendResponse,
    ]) {
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        code: 'CLUB_VALIDATION_ERROR',
      });
    }

    await expect(
      prisma.clubMember.findUniqueOrThrow({
        where: {
          clubId_userId: {
            clubId: club.id,
            userId: owner.id,
          },
        },
      }),
    ).resolves.toMatchObject({
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
      postingSuspendedUntil: null,
    });
    await expect(
      prisma.club.findUniqueOrThrow({
        where: {
          id: club.id,
        },
      }),
    ).resolves.toMatchObject({
      createdById: owner.id,
      memberCount: 2,
    });
  });
});
