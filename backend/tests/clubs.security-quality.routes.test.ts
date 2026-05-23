import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptType,
  ClubVisibility,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import clubsRoutes from '../src/routes/clubs/clubs.routes';
import clubFeedRoutes from '../src/routes/clubs/feed.routes';
import clubPromptsRoutes from '../src/routes/clubs/prompts.routes';
import { CLUB_RATE_LIMITS } from '../src/services/clubs/rate-limit.service';
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

async function createPrivatePromptScenario() {
  const owner = await createTestUser({ name: 'Owner Segurança' });
  const member = await createTestUser({ name: 'Membro Segurança' });
  const removed = await createTestUser({ name: 'Removido Segurança' });
  const outsider = await createTestUser({ name: 'Outsider Segurança' });
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
    content: 'Prompt privado para validar membership.',
    expiresAt: futureDate(),
  });

  return {
    owner,
    member,
    removed,
    outsider,
    club,
    prompt,
  };
}

async function createModerationScenario() {
  const owner = await createTestUser({ name: 'Owner Moderacao' });
  const admin = await createTestUser({ name: 'Admin Moderacao' });
  const member = await createTestUser({ name: 'Membro Moderado' });
  const outsider = await createTestUser({ name: 'Outsider Moderacao' });
  const club = await createTestClub({
    createdById: owner.id,
    memberCount: 3,
  });

  await addUserToClub(club.id, owner.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, admin.id, {
    role: ClubMemberRole.admin,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, member.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
  });

  return {
    owner,
    admin,
    member,
    outsider,
    club,
  };
}

describe('clubs security and quality routes', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('permite owner/admin bloquear membro e registra auditoria', async () => {
    const { admin, member, club } = await createModerationScenario();

    const response = await request(app)
      .post(`/clubs/${club.id}/members/${member.id}/block`)
      .set('Authorization', `Bearer ${authTokenFor(admin)}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      clubId: club.id,
      userId: member.id,
      status: ClubMemberStatus.blocked,
      postingSuspendedUntil: null,
    });
    await expect(
      prisma.club.findUniqueOrThrow({
        where: {
          id: club.id,
        },
      }),
    ).resolves.toMatchObject({
      memberCount: 2,
    });
    await expect(
      prisma.clubAuditLog.count({
        where: {
          clubId: club.id,
          actorId: admin.id,
          targetUserId: member.id,
          action: 'club_member_blocked',
        },
      }),
    ).resolves.toBe(1);
  });

  it('nega bloqueio por usuario sem permissao e protege owner de si mesmo', async () => {
    const { owner, member, club } = await createModerationScenario();

    const memberBlockResponse = await request(app)
      .post(`/clubs/${club.id}/members/${owner.id}/block`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);
    const ownerSelfBlockResponse = await request(app)
      .post(`/clubs/${club.id}/members/${owner.id}/block`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);
    const ownerSelfSuspendResponse = await request(app)
      .post(`/clubs/${club.id}/members/${owner.id}/suspend-posting`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        suspendedUntil: futureDate().toISOString(),
      });

    expect(memberBlockResponse.status).toBe(403);
    expect(ownerSelfBlockResponse.status).toBe(400);
    expect(ownerSelfSuspendResponse.status).toBe(400);
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
    });
  });

  it('suspende postagem temporariamente e bloqueia prompt resposta e comentario', async () => {
    const { owner, member, club } = await createModerationScenario();
    const prompt = await createTestClubPrompt({
      clubId: club.id,
      authorId: owner.id,
      type: ClubPromptType.truth,
      content: 'Prompt para usuario suspenso responder.',
      expiresAt: futureDate(),
    });
    const suspendedUntil = futureDate(120);

    const suspendResponse = await request(app)
      .post(`/clubs/${club.id}/members/${member.id}/suspend-posting`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        suspendedUntil: suspendedUntil.toISOString(),
      });
    const promptResponse = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        type: ClubPromptType.truth,
        content: 'Prompt que nao deve ser criado.',
      });
    const answerResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${prompt.id}/responses`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        text: 'Resposta bloqueada pela suspensao.',
      });
    const commentResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${prompt.id}/comments`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        text: 'Comentario bloqueado pela suspensao.',
      });

    expect(suspendResponse.status).toBe(200);
    expect(suspendResponse.body.postingSuspendedUntil).toBe(
      suspendedUntil.toISOString(),
    );
    for (const response of [promptResponse, answerResponse, commentResponse]) {
      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        code: 'CLUB_POSTING_SUSPENDED',
      });
    }
    await expect(
      prisma.clubAuditLog.count({
        where: {
          clubId: club.id,
          actorId: owner.id,
          targetUserId: member.id,
          action: 'club_member_posting_suspended',
        },
      }),
    ).resolves.toBe(1);
  });

  it('aplica lista de palavras bloqueadas ao criar prompt resposta e comentario', async () => {
    const owner = await createTestUser();
    const member = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      blockedWords: ['spoiler'],
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

    const prompt = await createTestClubPrompt({
      clubId: club.id,
      authorId: owner.id,
      type: ClubPromptType.truth,
      content: 'Prompt limpo para filtro de interacoes.',
      expiresAt: futureDate(),
    });
    const createPromptResponse = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        type: ClubPromptType.truth,
        content: 'Este prompt tem spoiler no texto.',
      });
    const answerResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${prompt.id}/responses`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        text: 'Resposta com spoiler no texto.',
      });
    const commentResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${prompt.id}/comments`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        text: 'Comentario com spoiler no texto.',
      });

    for (const response of [
      createPromptResponse,
      answerResponse,
      commentResponse,
    ]) {
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        code: 'CLUB_VALIDATION_ERROR',
      });
    }
  });

  it('aplica rate limit para criacao de clubes convites e prompts', async () => {
    const owner = await createTestUser();
    const invitee = await createTestUser();
    const member = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
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

    for (let index = 0; index < CLUB_RATE_LIMITS.create_club.max; index += 1) {
      await createTestClub({
        createdById: owner.id,
        name: `Clube limite ${index}`,
      });
    }

    for (
      let index = 0;
      index < CLUB_RATE_LIMITS.create_club_invite.max;
      index += 1
    ) {
      const limitedInvitee = await createTestUser({
        name: `Convidado limite ${index}`,
      });

      await prisma.clubInvite.create({
        data: {
          clubId: club.id,
          inviterId: owner.id,
          inviteeId: limitedInvitee.id,
          status: ClubMemberStatus.invited,
        },
      });
    }

    for (
      let index = 0;
      index < CLUB_RATE_LIMITS.create_club_prompt.max;
      index += 1
    ) {
      await createTestClubPrompt({
        clubId: club.id,
        authorId: member.id,
        content: `Prompt de limite ${index}`,
      });
    }

    const createClubResponse = await request(app)
      .post('/clubs')
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        name: 'Clube acima do limite',
      });
    const inviteResponse = await request(app)
      .post(`/clubs/${club.id}/invites`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        userId: invitee.id,
      });
    const promptResponse = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        type: ClubPromptType.truth,
        content: 'Prompt acima do limite.',
      });

    for (const response of [
      createClubResponse,
      inviteResponse,
      promptResponse,
    ]) {
      expect(response.status).toBe(429);
      expect(response.body).toMatchObject({
        code: 'CLUB_RATE_LIMIT_EXCEEDED',
      });
    }
  });

  it('impede convite repetido recente para o mesmo usuario', async () => {
    const owner = await createTestUser();
    const invitee = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    const firstInviteResponse = await request(app)
      .post(`/clubs/${club.id}/invites`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        userId: invitee.id,
      });
    const declineResponse = await request(app)
      .post(`/clubs/invites/${firstInviteResponse.body.id}/decline`)
      .set('Authorization', `Bearer ${authTokenFor(invitee)}`);
    const repeatedInviteResponse = await request(app)
      .post(`/clubs/${club.id}/invites`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        userId: invitee.id,
      });

    expect(firstInviteResponse.status).toBe(201);
    expect(declineResponse.status).toBe(200);
    expect(repeatedInviteResponse.status).toBe(409);
    expect(repeatedInviteResponse.body).toMatchObject({
      code: 'CLUB_DUPLICATE_INVITE',
    });
  });

  it('bloqueia detalhe e feed privado para outsider e membro removido', async () => {
    const { outsider, removed, club } = await createPrivatePromptScenario();

    const outsiderDetailsResponse = await request(app)
      .get(`/clubs/${club.id}`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`);
    const removedDetailsResponse = await request(app)
      .get(`/clubs/${club.id}`)
      .set('Authorization', `Bearer ${authTokenFor(removed)}`);
    const outsiderFeedResponse = await request(app)
      .get(`/clubs/${club.id}/feed`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`);
    const removedFeedResponse = await request(app)
      .get(`/clubs/${club.id}/feed`)
      .set('Authorization', `Bearer ${authTokenFor(removed)}`);

    for (const response of [
      outsiderDetailsResponse,
      removedDetailsResponse,
      outsiderFeedResponse,
      removedFeedResponse,
    ]) {
      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        code: 'CLUB_FORBIDDEN',
      });
    }
  });

  it('likes respostas e comentarios em clube privado respeitam membership ativa', async () => {
    const { outsider, removed, club, prompt } = await createPrivatePromptScenario();

    const outsiderLikeResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${prompt.id}/like`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`);
    const removedLikeResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${prompt.id}/like`)
      .set('Authorization', `Bearer ${authTokenFor(removed)}`);
    const outsiderAnswerResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${prompt.id}/responses`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`)
      .send({
        text: 'Resposta sem membership.',
      });
    const removedCommentResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${prompt.id}/comments`)
      .set('Authorization', `Bearer ${authTokenFor(removed)}`)
      .send({
        text: 'Comentario sem membership ativa.',
      });

    for (const response of [
      outsiderLikeResponse,
      removedLikeResponse,
      outsiderAnswerResponse,
      removedCommentResponse,
    ]) {
      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        code: 'CLUB_FORBIDDEN',
      });
    }
  });
});
