import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptType,
  ClubVisibility,
  NotificationType,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import clubsRoutes from '../src/routes/clubs/clubs.routes';
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

async function createOwnedClub() {
  const owner = await createTestUser();
  const club = await createTestClub({
    createdById: owner.id,
    memberCount: 1,
  });

  await addUserToClub(club.id, owner.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });

  return { owner, club };
}

async function notificationsFor(userId: string) {
  return prisma.notification.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

describe('clubs.notifications.routes', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('cria notificacoes para convite recebido e convite aceito', async () => {
    const { owner, club } = await createOwnedClub();
    const invitee = await createTestUser();

    const inviteResponse = await request(app)
      .post(`/clubs/${club.id}/invites`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        userId: invitee.id,
      });

    expect(inviteResponse.status).toBe(201);
    await expect(notificationsFor(invitee.id)).resolves.toEqual([
      expect.objectContaining({
        actorId: owner.id,
        clubId: club.id,
        type: NotificationType.club_invite_received,
        deepLink: `/clubs/${club.id}`,
        referenceType: 'club_invite',
        referenceId: inviteResponse.body.id,
      }),
    ]);

    const acceptResponse = await request(app)
      .post(`/clubs/invites/${inviteResponse.body.id}/accept`)
      .set('Authorization', `Bearer ${authTokenFor(invitee)}`);

    expect(acceptResponse.status).toBe(200);
    await expect(notificationsFor(owner.id)).resolves.toEqual([
      expect.objectContaining({
        actorId: invitee.id,
        clubId: club.id,
        type: NotificationType.club_invite_accepted,
        referenceType: 'club_invite',
        referenceId: inviteResponse.body.id,
      }),
    ]);
  });

  it('notifica owner/admin em solicitacao e solicitante em aprovacao ou rejeicao', async () => {
    const owner = await createTestUser();
    const admin = await createTestUser();
    const member = await createTestUser();
    const requester = await createTestUser();
    const rejectedRequester = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      visibility: ClubVisibility.private,
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

    const requestResponse = await request(app)
      .post(`/clubs/${club.id}/join-requests`)
      .set('Authorization', `Bearer ${authTokenFor(requester)}`)
      .send({
        message: 'Quero entrar',
      });

    expect(requestResponse.status).toBe(201);
    const requestNotifications = await prisma.notification.findMany({
      where: {
        type: NotificationType.club_join_request_received,
        referenceId: requestResponse.body.id,
      },
    });

    expect(requestNotifications).toHaveLength(2);
    expect(requestNotifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: admin.id,
          actorId: requester.id,
        }),
        expect.objectContaining({
          userId: owner.id,
          actorId: requester.id,
        }),
      ]),
    );
    await expect(notificationsFor(member.id)).resolves.toEqual([]);

    const approveResponse = await request(app)
      .post(`/clubs/join-requests/${requestResponse.body.id}/approve`)
      .set('Authorization', `Bearer ${authTokenFor(admin)}`);

    expect(approveResponse.status).toBe(200);
    await expect(
      prisma.notification.findFirst({
        where: {
          userId: requester.id,
          type: NotificationType.club_join_request_approved,
          referenceId: requestResponse.body.id,
        },
      }),
    ).resolves.toMatchObject({
      actorId: admin.id,
      clubId: club.id,
      referenceType: 'club_join_request',
    });

    const rejectedRequestResponse = await request(app)
      .post(`/clubs/${club.id}/join-requests`)
      .set('Authorization', `Bearer ${authTokenFor(rejectedRequester)}`)
      .send();

    expect(rejectedRequestResponse.status).toBe(201);

    const rejectResponse = await request(app)
      .post(`/clubs/join-requests/${rejectedRequestResponse.body.id}/reject`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);

    expect(rejectResponse.status).toBe(200);
    await expect(
      prisma.notification.findFirst({
        where: {
          userId: rejectedRequester.id,
          type: NotificationType.club_join_request_rejected,
          referenceId: rejectedRequestResponse.body.id,
        },
      }),
    ).resolves.toMatchObject({
      actorId: owner.id,
      clubId: club.id,
      referenceType: 'club_join_request',
    });
  });

  it('novo prompt notifica apenas membros ativos elegiveis, exceto autor e mutados', async () => {
    const author = await createTestUser();
    const activeMember = await createTestUser();
    const mutedMember = await createTestUser();
    const invitedMember = await createTestUser();
    const removedMember = await createTestUser();
    const blockedMember = await createTestUser();
    const outsider = await createTestUser();
    const club = await createTestClub({
      createdById: author.id,
      memberCount: 2,
    });

    await addUserToClub(club.id, author.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(club.id, activeMember.id);
    await addUserToClub(club.id, mutedMember.id, {
      mutedUntil: futureDate(120),
    });
    await addUserToClub(club.id, invitedMember.id, {
      status: ClubMemberStatus.invited,
      joinedAt: null,
    });
    await addUserToClub(club.id, removedMember.id, {
      status: ClubMemberStatus.removed,
      joinedAt: null,
    });
    await addUserToClub(club.id, blockedMember.id, {
      status: ClubMemberStatus.blocked,
      joinedAt: null,
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(author)}`)
      .send({
        type: ClubPromptType.truth,
        content: 'Qual pergunta vale para o clube todo?',
      });

    expect(response.status).toBe(201);

    const promptNotifications = await prisma.notification.findMany({
      where: {
        type: NotificationType.club_new_prompt,
        clubId: club.id,
      },
    });

    expect(promptNotifications).toEqual([
      expect.objectContaining({
        userId: activeMember.id,
        actorId: author.id,
        referenceType: 'club_prompt',
        referenceId: response.body.id,
      }),
    ]);
    expect(promptNotifications.map((notification) => notification.userId)).not.toEqual(
      expect.arrayContaining([
        author.id,
        mutedMember.id,
        invitedMember.id,
        removedMember.id,
        blockedMember.id,
        outsider.id,
      ]),
    );
  });

  it('resposta notifica autor do prompt, exceto autores respondendo e autores mutados', async () => {
    const author = await createTestUser();
    const responder = await createTestUser();
    const mutedAuthor = await createTestUser();
    const club = await createTestClub({
      createdById: author.id,
      memberCount: 3,
    });

    await addUserToClub(club.id, author.id);
    await addUserToClub(club.id, responder.id);
    await addUserToClub(club.id, mutedAuthor.id, {
      mutedUntil: futureDate(120),
    });

    const prompt = await createTestClubPrompt({
      clubId: club.id,
      authorId: author.id,
    });
    const ownPrompt = await createTestClubPrompt({
      clubId: club.id,
      authorId: responder.id,
      content: 'Prompt para resposta propria.',
    });
    const mutedPrompt = await createTestClubPrompt({
      clubId: club.id,
      authorId: mutedAuthor.id,
      content: 'Prompt de autor mutado.',
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/prompts/${prompt.id}/responses`)
      .set('Authorization', `Bearer ${authTokenFor(responder)}`)
      .send({
        text: 'Resposta de outro membro.',
      });
    const ownResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${ownPrompt.id}/responses`)
      .set('Authorization', `Bearer ${authTokenFor(responder)}`)
      .send({
        text: 'Respondendo meu proprio prompt.',
      });
    const mutedResponse = await request(app)
      .post(`/clubs/${club.id}/prompts/${mutedPrompt.id}/responses`)
      .set('Authorization', `Bearer ${authTokenFor(responder)}`)
      .send({
        text: 'Resposta para autor mutado.',
      });

    expect(response.status).toBe(201);
    expect(ownResponse.status).toBe(201);
    expect(mutedResponse.status).toBe(201);

    await expect(
      prisma.notification.findMany({
        where: {
          type: NotificationType.club_prompt_response,
          clubId: club.id,
        },
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        userId: author.id,
        actorId: responder.id,
        referenceType: 'club_prompt_response',
        referenceId: response.body.id,
      }),
    ]);
  });

  it('comentario notifica autor e mencoes validas sem duplicidade', async () => {
    const author = await createTestUser({ username: 'autorclub' });
    const commenter = await createTestUser({ username: 'comentador' });
    const mentioned = await createTestUser({ username: 'mencionada' });
    const outsider = await createTestUser({ username: 'foradoclube' });
    const club = await createTestClub({
      createdById: author.id,
      memberCount: 3,
    });

    await addUserToClub(club.id, author.id);
    await addUserToClub(club.id, commenter.id);
    await addUserToClub(club.id, mentioned.id);

    const prompt = await createTestClubPrompt({
      clubId: club.id,
      authorId: author.id,
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/prompts/${prompt.id}/comments`)
      .set('Authorization', `Bearer ${authTokenFor(commenter)}`)
      .send({
        text: 'Comentario com @autorclub @mencionada @foradoclube.',
      });

    expect(response.status).toBe(201);

    const commentNotifications = await prisma.notification.findMany({
      where: {
        clubId: club.id,
        referenceId: response.body.id,
      },
    });

    expect(commentNotifications).toHaveLength(2);
    expect(commentNotifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: mentioned.id,
          actorId: commenter.id,
          type: NotificationType.club_mention,
          referenceType: 'club_prompt_comment',
        }),
        expect.objectContaining({
          userId: author.id,
          actorId: commenter.id,
          type: NotificationType.club_prompt_comment,
          referenceType: 'club_prompt_comment',
        }),
      ]),
    );

    await expect(notificationsFor(outsider.id)).resolves.toEqual([]);
    await expect(notificationsFor(commenter.id)).resolves.toEqual([]);
  });

  it('promocao notifica usuario promovido mesmo com clube mutado e rebaixamento nao notifica', async () => {
    const { owner, club } = await createOwnedClub();
    const member = await createTestUser();

    await addUserToClub(club.id, member.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.active,
      mutedUntil: futureDate(120),
    });

    const promoteResponse = await request(app)
      .patch(`/clubs/${club.id}/members/${member.id}/role`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        role: ClubMemberRole.moderator,
      });

    expect(promoteResponse.status).toBe(200);
    await expect(
      prisma.notification.findMany({
        where: {
          userId: member.id,
          type: NotificationType.club_member_promoted,
        },
      }),
    ).resolves.toHaveLength(1);

    const demoteResponse = await request(app)
      .patch(`/clubs/${club.id}/members/${member.id}/role`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        role: ClubMemberRole.member,
      });

    expect(demoteResponse.status).toBe(200);
    await expect(
      prisma.notification.findMany({
        where: {
          userId: member.id,
          type: NotificationType.club_member_promoted,
        },
      }),
    ).resolves.toHaveLength(1);
  });
});
