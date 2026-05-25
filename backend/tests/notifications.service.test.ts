import { NotificationType } from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import {
  countUnreadNotifications,
  createNotification,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationServiceError,
} from '../src/services/notifications.service';
import { emitClubInviteReceivedEvent } from '../src/services/clubs/club-events.service';
import {
  createTestClub,
  createTestNotification,
  createTestUser,
  resetFeedData,
} from '../src/test-utils/factories';
import { applyTestDatabaseHooks } from './test-db';

describe('notifications.service', () => {
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

  it('cria notificacao persistente', async () => {
    const user = await createTestUser();
    const actor = await createTestUser();
    const club = await createTestClub({
      createdById: actor.id,
    });

    const notification = await createNotification({
      userId: user.id,
      actorId: actor.id,
      type: NotificationType.club_invite_received,
      title: 'Convite recebido',
      body: 'Voce recebeu um convite.',
      deepLink: `/clubs/${club.id}`,
      clubId: club.id,
      referenceType: 'club_invite',
      referenceId: 'invite-1',
    });

    expect(notification).toMatchObject({
      type: NotificationType.club_invite_received,
      title: 'Convite recebido',
      deepLink: `/clubs/${club.id}`,
      clubId: club.id,
      referenceType: 'club_invite',
      referenceId: 'invite-1',
      readAt: null,
    });

    await expect(
      prisma.notification.count({
        where: {
          userId: user.id,
        },
      }),
    ).resolves.toBe(1);
  });

  it('suprime self-notification quando actorId e userId sao iguais', async () => {
    const user = await createTestUser();

    const notification = await createNotification({
      userId: user.id,
      actorId: user.id,
      type: NotificationType.club_created,
      title: 'Clube criado',
      body: 'Seu clube foi criado.',
      deepLink: '/clubs/club-1',
      dedupeKey: 'self-notification',
    });

    expect(notification).toBeNull();

    await expect(prisma.notification.count()).resolves.toBe(0);
  });

  it('mantem idempotencia por dedupeKey', async () => {
    const user = await createTestUser();

    const first = await createNotification({
      userId: user.id,
      type: NotificationType.club_new_prompt,
      title: 'Primeira',
      body: 'Primeira notificacao',
      deepLink: '/clubs/club-1',
      dedupeKey: 'prompt:1:user:1',
    });
    const second = await createNotification({
      userId: user.id,
      type: NotificationType.club_new_prompt,
      title: 'Segunda',
      body: 'Segunda notificacao',
      deepLink: '/clubs/club-1',
      dedupeKey: 'prompt:1:user:1',
    });

    expect(second?.id).toBe(first?.id);
    expect(second?.title).toBe('Primeira');
    await expect(prisma.notification.count()).resolves.toBe(1);
  });

  it('lista somente notificacoes do usuario e filtra nao lidas', async () => {
    const user = await createTestUser();
    const otherUser = await createTestUser();

    const unread = await createTestNotification({
      userId: user.id,
      title: 'Nao lida',
      createdAt: new Date('2026-05-23T12:00:00.000Z'),
    });
    await createTestNotification({
      userId: user.id,
      title: 'Lida',
      readAt: new Date(),
      createdAt: new Date('2026-05-23T11:00:00.000Z'),
    });
    await createTestNotification({
      userId: otherUser.id,
      title: 'Outra pessoa',
    });

    const notifications = await listNotificationsForUser({
      userId: user.id,
      read: false,
    });

    expect(notifications.items).toEqual([
      expect.objectContaining({
        id: unread.id,
        title: 'Nao lida',
        readAt: null,
      }),
    ]);

    await expect(countUnreadNotifications(user.id)).resolves.toEqual({
      unreadCount: 1,
    });
  });

  it('trata listagem, contagem e leitura como inbox unica independente de clube', async () => {
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
      type: NotificationType.club_member_promoted,
      title: 'Atividade fora de clube',
      deepLink: '/feed/truth-1',
      clubId: null,
      referenceType: 'feed_like',
      referenceId: 'like-1',
      createdAt: new Date('2026-05-23T13:00:00.000Z'),
    });
    await createTestNotification({
      userId: otherUser.id,
      actorId: actor.id,
      title: 'Atividade de outro usuario',
      clubId: null,
      referenceType: 'account_event',
      referenceId: 'account-1',
    });

    const notifications = await listNotificationsForUser({
      userId: user.id,
    });

    expect(notifications.items).toEqual([
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
    ]);
    await expect(countUnreadNotifications(user.id)).resolves.toEqual({
      unreadCount: 2,
    });

    const readResult = await markNotificationRead({
      userId: user.id,
      notificationId: feedLikeNotification.id,
    });

    expect(readResult.notification).toMatchObject({
      id: feedLikeNotification.id,
      clubId: null,
      referenceType: 'feed_like',
      readAt: expect.any(String),
    });
    await expect(countUnreadNotifications(user.id)).resolves.toEqual({
      unreadCount: 1,
    });

    await expect(markAllNotificationsRead(user.id)).resolves.toEqual({
      updatedCount: 1,
    });
    await expect(countUnreadNotifications(user.id)).resolves.toEqual({
      unreadCount: 0,
    });
    await expect(countUnreadNotifications(otherUser.id)).resolves.toEqual({
      unreadCount: 1,
    });
  });

  it('marca uma notificacao como lida e bloqueia notificacao de outro usuario', async () => {
    const user = await createTestUser();
    const otherUser = await createTestUser();
    const ownNotification = await createTestNotification({
      userId: user.id,
    });
    const otherNotification = await createTestNotification({
      userId: otherUser.id,
    });

    const result = await markNotificationRead({
      userId: user.id,
      notificationId: ownNotification.id,
    });

    expect(result.notification.readAt).not.toBeNull();

    await expect(
      markNotificationRead({
        userId: user.id,
        notificationId: otherNotification.id,
      }),
    ).rejects.toMatchObject<Partial<NotificationServiceError>>({
      code: 'NOTIFICATION_FORBIDDEN',
      statusCode: 403,
    });
  });

  it('marca todas as notificacoes do usuario como lidas', async () => {
    const user = await createTestUser();
    const otherUser = await createTestUser();

    await createTestNotification({
      userId: user.id,
    });
    await createTestNotification({
      userId: user.id,
    });
    await createTestNotification({
      userId: otherUser.id,
    });

    await expect(markAllNotificationsRead(user.id)).resolves.toEqual({
      updatedCount: 2,
    });
    await expect(countUnreadNotifications(user.id)).resolves.toEqual({
      unreadCount: 0,
    });
    await expect(countUnreadNotifications(otherUser.id)).resolves.toEqual({
      unreadCount: 1,
    });
  });

  it('emite contrato basico de evento de clube sem plugar produtores reais', async () => {
    const inviter = await createTestUser();
    const invitee = await createTestUser();
    const club = await createTestClub({
      createdById: inviter.id,
      name: 'Clube Eventos',
    });

    const notification = await emitClubInviteReceivedEvent({
      clubId: club.id,
      clubName: club.name,
      inviteId: 'invite-event-1',
      inviteeId: invitee.id,
      inviterId: inviter.id,
    });

    expect(notification).toMatchObject({
      type: NotificationType.club_invite_received,
      actorId: inviter.id,
      clubId: club.id,
      referenceType: 'club_invite',
      referenceId: 'invite-event-1',
      deepLink: `/clubs/${club.id}`,
    });
  });
});
