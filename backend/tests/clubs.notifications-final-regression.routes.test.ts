import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptType,
  NotificationType,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import clubsRoutes from '../src/routes/clubs/clubs.routes';
import clubFeedRoutes from '../src/routes/clubs/feed.routes';
import clubPromptsRoutes from '../src/routes/clubs/prompts.routes';
import notificationsRoutes from '../src/routes/notifications.routes';
import {
  addUserToClub,
  createTestClub,
  createTestNotification,
  createTestUser,
  resetFeedData,
} from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { applyTestDatabaseHooks } from './test-db';

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use('/clubs', clubPromptsRoutes);
  app.use('/clubs', clubFeedRoutes);
  app.use('/clubs', clubsRoutes);
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

function futureDate(minutes = 60) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

describe('clubs.notifications-final-regression.routes', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('mantem emissao, supressao por mute, feed visto e contador por clube coerentes', async () => {
    const owner = await createTestUser();
    const activeMember = await createTestUser();
    const mutedMember = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 3,
    });
    const mutedUntil = futureDate(180);

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(club.id, activeMember.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(club.id, mutedMember.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.active,
      mutedUntil,
    });

    const promptResponse = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        type: ClubPromptType.truth,
        content: 'Qual atividade deveria acender badge no clube?',
      });

    expect(promptResponse.status).toBe(201);

    const activeNotifications = await prisma.notification.findMany({
      where: {
        userId: activeMember.id,
        clubId: club.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    const mutedNotifications = await prisma.notification.findMany({
      where: {
        userId: mutedMember.id,
        clubId: club.id,
      },
    });

    expect(activeNotifications).toEqual([
      expect.objectContaining({
        type: NotificationType.club_new_prompt,
        actorId: owner.id,
        referenceType: 'club_prompt',
        referenceId: promptResponse.body.id,
        readAt: null,
      }),
    ]);
    expect(mutedNotifications).toEqual([]);

    await createTestNotification({
      userId: activeMember.id,
      actorId: owner.id,
      type: NotificationType.club_member_promoted,
      clubId: club.id,
      referenceType: 'club_member',
      referenceId: activeMember.id,
    });

    const beforeSeenResponse = await request(app)
      .get(`/clubs/${club.id}`)
      .set('Authorization', `Bearer ${authTokenFor(activeMember)}`);

    expect(beforeSeenResponse.status).toBe(200);
    expect(beforeSeenResponse.body.viewerActivity).toMatchObject({
      unreadCount: 2,
      mutedUntil: null,
      isMuted: false,
    });

    const mutedDetailsResponse = await request(app)
      .get(`/clubs/${club.id}`)
      .set('Authorization', `Bearer ${authTokenFor(mutedMember)}`);

    expect(mutedDetailsResponse.status).toBe(200);
    expect(mutedDetailsResponse.body.viewerActivity).toMatchObject({
      unreadCount: 0,
      mutedUntil: mutedUntil.toISOString(),
      isMuted: true,
    });

    const seenResponse = await request(app)
      .post(`/clubs/${club.id}/feed/seen`)
      .set('Authorization', `Bearer ${authTokenFor(activeMember)}`);

    expect(seenResponse.status).toBe(200);
    expect(seenResponse.body).toMatchObject({
      lastSeenAt: expect.any(String),
      readCount: 1,
      unreadCount: 1,
    });

    const afterSeenResponse = await request(app)
      .get(`/clubs/${club.id}`)
      .set('Authorization', `Bearer ${authTokenFor(activeMember)}`);

    expect(afterSeenResponse.status).toBe(200);
    expect(afterSeenResponse.body.viewerActivity).toMatchObject({
      unreadCount: 1,
      lastSeenAt: seenResponse.body.lastSeenAt,
      mutedUntil: null,
      isMuted: false,
    });

    const notificationsListResponse = await request(app)
      .get('/notifications')
      .set('Authorization', `Bearer ${authTokenFor(activeMember)}`);

    expect(notificationsListResponse.status).toBe(200);
    expect(notificationsListResponse.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: NotificationType.club_new_prompt,
          readAt: expect.any(String),
        }),
        expect.objectContaining({
          type: NotificationType.club_member_promoted,
          readAt: null,
        }),
      ]),
    );
  });
});
