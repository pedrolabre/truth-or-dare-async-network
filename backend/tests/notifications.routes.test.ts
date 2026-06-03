jest.mock('../src/services/auth/email.service', () =>
  jest.requireActual('../src/services/auth/email.mock'),
);

import express from 'express';
import request from 'supertest';
import {
  ClubVisibility,
  NotificationType,
} from '../src/generated/prisma/client';
import notificationsRoutes from '../src/routes/notifications.routes';
import { prisma } from '../src/lib/prisma';
import {
  createTestClub,
  createTestNotification,
  createTestPasswordResetToken,
  createTestUser,
  resetFeedData,
} from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { applyTestDatabaseHooks } from './test-db';
import { emitClubInviteReceivedEvent } from '../src/services/clubs/club-events.service';
import { createTruth } from '../src/services/truths/truths.service';
import { createPasswordResetSessionToken } from '../src/services/auth/password-reset.tokens';
import { resetPassword } from '../src/services/auth/password-reset.service';

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use('/notifications', notificationsRoutes);

  return app;
}

function authTokenFor(user: { id: string; email: string; name: string }) {
  return generateToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });
}

describe('notifications.routes', () => {
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

  it('exige autenticacao nas rotas de notificacoes', async () => {
    const listResponse = await request(app).get('/notifications');
    const countResponse = await request(app).get('/notifications/unread-count');
    const markReadResponse = await request(app).patch(
      '/notifications/notification-1/read',
    );
    const readAllResponse = await request(app).post('/notifications/read-all');

    expect(listResponse.status).toBe(401);
    expect(countResponse.status).toBe(401);
    expect(markReadResponse.status).toBe(401);
    expect(readAllResponse.status).toBe(401);
  });

  it('lista notificacoes do usuario autenticado como inbox unica', async () => {
    const user = await createTestUser();
    const actor = await createTestUser();
    const otherUser = await createTestUser();
    const club = await createTestClub({
      createdById: actor.id,
    });
    const clubNotification = await createTestNotification({
      userId: user.id,
      actorId: actor.id,
      type: NotificationType.club_new_prompt,
      title: 'Atividade de clube',
      deepLink: `/clubs/${club.id}`,
      clubId: club.id,
      referenceType: 'club_prompt',
      referenceId: 'prompt-1',
      createdAt: new Date('2026-05-23T12:00:00.000Z'),
    });
    const feedLikeNotification = await createTestNotification({
      userId: user.id,
      actorId: actor.id,
      type: NotificationType.feed_like,
      title: 'Atividade fora de clube',
      deepLink: '/feed/truth-1',
      clubId: null,
      referenceType: 'feed_like',
      referenceId: 'like-1',
      createdAt: new Date('2026-05-23T13:00:00.000Z'),
    });
    await createTestNotification({
      userId: otherUser.id,
      title: 'Notificacao alheia',
    });

    const response = await request(app)
      .get('/notifications')
      .set('Authorization', `Bearer ${authTokenFor(user)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [
        expect.objectContaining({
          id: feedLikeNotification.id,
          clubId: null,
          referenceType: 'feed_like',
        }),
        expect.objectContaining({
          id: clubNotification.id,
          clubId: club.id,
          referenceType: 'club_prompt',
        }),
      ],
      nextCursor: null,
    });
  });

  it('filtra e conta notificacoes nao lidas', async () => {
    const user = await createTestUser();
    const actor = await createTestUser();
    const club = await createTestClub({
      createdById: actor.id,
    });

    await createTestNotification({
      userId: user.id,
      actorId: actor.id,
      title: 'Nao lida de clube',
      clubId: club.id,
      referenceType: 'club_prompt',
      createdAt: new Date('2026-05-23T12:00:00.000Z'),
    });
    await createTestNotification({
      userId: user.id,
      actorId: actor.id,
      title: 'Nao lida fora de clube',
      clubId: null,
      referenceType: 'feed_like',
      createdAt: new Date('2026-05-23T13:00:00.000Z'),
    });
    await createTestNotification({
      userId: user.id,
      title: 'Lida fora de clube',
      type: NotificationType.account_password_reset_completed,
      clubId: null,
      referenceType: 'account_event',
      readAt: new Date(),
    });

    const token = authTokenFor(user);
    const listResponse = await request(app)
      .get('/notifications')
      .query({
        read: 'false',
      })
      .set('Authorization', `Bearer ${token}`);
    const countResponse = await request(app)
      .get('/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toEqual([
      expect.objectContaining({
        title: 'Nao lida fora de clube',
        clubId: null,
        referenceType: 'feed_like',
        readAt: null,
      }),
      expect.objectContaining({
        title: 'Nao lida de clube',
        clubId: club.id,
        referenceType: 'club_prompt',
        readAt: null,
      }),
    ]);
    expect(countResponse.status).toBe(200);
    expect(countResponse.body).toEqual({
      unreadCount: 2,
    });
  });

  it('marca qualquer notificacao propria como lida sem exigir clube', async () => {
    const user = await createTestUser();
    const notification = await createTestNotification({
      userId: user.id,
      clubId: null,
      referenceType: 'feed_like',
      referenceId: 'like-1',
    });

    const response = await request(app)
      .patch(`/notifications/${notification.id}/read`)
      .set('Authorization', `Bearer ${authTokenFor(user)}`);

    expect(response.status).toBe(200);
    expect(response.body.notification).toMatchObject({
      id: notification.id,
      clubId: null,
      referenceType: 'feed_like',
      readAt: expect.any(String),
    });
  });

  it('impede marcar notificacao de outro usuario', async () => {
    const user = await createTestUser();
    const otherUser = await createTestUser();
    const notification = await createTestNotification({
      userId: otherUser.id,
    });

    const response = await request(app)
      .patch(`/notifications/${notification.id}/read`)
      .set('Authorization', `Bearer ${authTokenFor(user)}`);

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      code: 'NOTIFICATION_FORBIDDEN',
    });
  });

  it('marca todas as notificacoes do usuario como lidas', async () => {
    const user = await createTestUser();
    const actor = await createTestUser();
    const otherUser = await createTestUser();
    const club = await createTestClub({
      createdById: actor.id,
    });

    await createTestNotification({
      userId: user.id,
      actorId: actor.id,
      clubId: club.id,
      referenceType: 'club_prompt',
    });
    await createTestNotification({
      userId: user.id,
      actorId: actor.id,
      clubId: null,
      referenceType: 'feed_like',
    });
    await createTestNotification({
      userId: otherUser.id,
      actorId: actor.id,
      clubId: null,
      referenceType: 'account_event',
    });

    const response = await request(app)
      .post('/notifications/read-all')
      .set('Authorization', `Bearer ${authTokenFor(user)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      updatedCount: 2,
    });

    const remainingUnread = await prisma.notification.count({
      where: {
        userId: otherUser.id,
        readAt: null,
      },
    });

    expect(remainingUnread).toBe(1);
  });

  it('retorna eventos reais de Clubes, Feed e Conta na mesma inbox e le qualquer dominio', async () => {
    const user = await createTestUser({
      password: 'OldPass1',
    });
    const clubActor = await createTestUser();
    const feedActor = await createTestUser();
    const club = await createTestClub({
      createdById: clubActor.id,
      name: 'Clube Inbox Unica',
    });

    const clubNotification = await emitClubInviteReceivedEvent({
      clubId: club.id,
      clubName: club.name,
      inviteId: 'invite-inbox-unica',
      inviteeId: user.id,
      inviterId: clubActor.id,
    });
    const truth = await createTruth({
      authorId: feedActor.id,
      targetUserId: user.id,
      content: 'Qual notificacao deve aparecer junto na inbox?',
    });
    const passwordResetToken = await createTestPasswordResetToken({
      userId: user.id,
    });
    const resetToken = createPasswordResetSessionToken({
      userId: user.id,
      tokenId: passwordResetToken.token.id,
    });

    await resetPassword({
      resetToken,
      newPassword: 'NovaSenha123',
    });

    const feedNotification = await prisma.notification.findUnique({
      where: {
        dedupeKey: `feed_truth_received:${user.id}:${truth.id}`,
      },
    });
    const accountNotification = await prisma.notification.findUnique({
      where: {
        dedupeKey: `account_password_reset_completed:${user.id}:${passwordResetToken.token.id}`,
      },
    });
    const token = authTokenFor(user);

    expect(clubNotification).toMatchObject({
      type: NotificationType.club_invite_received,
      actorId: clubActor.id,
      clubId: club.id,
      referenceType: 'club_invite',
    });
    expect(feedNotification).toMatchObject({
      userId: user.id,
      type: NotificationType.feed_truth_received,
      clubId: null,
      referenceType: 'truth',
      referenceId: truth.id,
    });
    expect(accountNotification).toMatchObject({
      userId: user.id,
      type: NotificationType.account_password_reset_completed,
      clubId: null,
      referenceType: 'password_reset_token',
      referenceId: passwordResetToken.token.id,
    });

    const listResponse = await request(app)
      .get('/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: clubNotification?.id,
          type: NotificationType.club_invite_received,
          clubId: club.id,
          referenceType: 'club_invite',
        }),
        expect.objectContaining({
          id: feedNotification?.id,
          type: NotificationType.feed_truth_received,
          clubId: null,
          referenceType: 'truth',
        }),
        expect.objectContaining({
          id: accountNotification?.id,
          type: NotificationType.account_password_reset_completed,
          clubId: null,
          referenceType: 'password_reset_token',
        }),
      ]),
    );

    const unreadCountResponse = await request(app)
      .get('/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`);

    expect(unreadCountResponse.status).toBe(200);
    expect(unreadCountResponse.body).toEqual({
      unreadCount: 3,
    });

    const markFeedReadResponse = await request(app)
      .patch(`/notifications/${feedNotification?.id}/read`)
      .set('Authorization', `Bearer ${token}`);

    expect(markFeedReadResponse.status).toBe(200);
    expect(markFeedReadResponse.body.notification).toMatchObject({
      id: feedNotification?.id,
      type: NotificationType.feed_truth_received,
      readAt: expect.any(String),
    });

    const readAllResponse = await request(app)
      .post('/notifications/read-all')
      .set('Authorization', `Bearer ${token}`);

    expect(readAllResponse.status).toBe(200);
    expect(readAllResponse.body).toEqual({
      updatedCount: 2,
    });

    await expect(
      prisma.notification.count({
        where: {
          userId: user.id,
          readAt: null,
        },
      }),
    ).resolves.toBe(0);
  });

  it('nao expoe dados sensiveis de clube privado em notificacoes', async () => {
    const invitee = await createTestUser();
    const inviter = await createTestUser();
    const privateClub = await createTestClub({
      createdById: inviter.id,
      name: 'Clube Secreto Notificacao',
      visibility: ClubVisibility.private,
    });

    const notification = await emitClubInviteReceivedEvent({
      clubId: privateClub.id,
      clubName: privateClub.name,
      inviteId: 'invite-private-notification',
      inviteeId: invitee.id,
      inviterId: inviter.id,
    });
    const listResponse = await request(app)
      .get('/notifications')
      .set('Authorization', `Bearer ${authTokenFor(invitee)}`);
    const serializedNotification = JSON.stringify({
      notification,
      list: listResponse.body,
    });

    expect(notification).toMatchObject({
      title: 'Atividade privada',
      body: 'Ha uma atualizacao privada disponivel para sua conta.',
      deepLink: '/notifications',
      actorId: null,
      clubId: null,
      referenceType: null,
      referenceId: null,
    });
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toEqual([
      expect.objectContaining({
        title: 'Atividade privada',
        deepLink: '/notifications',
        clubId: null,
        referenceType: null,
        referenceId: null,
      }),
    ]);
    expect(serializedNotification).not.toContain(privateClub.name);
    expect(serializedNotification).not.toContain(`/clubs/${privateClub.id}`);
  });
});
