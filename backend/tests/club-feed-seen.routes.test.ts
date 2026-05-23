import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  NotificationType,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import clubsRoutes from '../src/routes/clubs/clubs.routes';
import clubFeedRoutes from '../src/routes/clubs/feed.routes';
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
  app.use('/clubs', clubFeedRoutes);
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

function pastDate(minutes = 60) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

async function createClubWithMember() {
  const owner = await createTestUser();
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

  return { owner, member, club };
}

describe('club-feed-seen.routes', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('POST /clubs/:id/feed/seen exige autenticacao', async () => {
    const response = await request(app).post('/clubs/club-id/feed/seen');

    expect(response.status).toBe(401);
  });

  it('POST /clubs/:id/feed/seen bloqueia outsider e membership invalida', async () => {
    const { member, club } = await createClubWithMember();
    const outsider = await createTestUser();
    const removedMember = await createTestUser();

    await addUserToClub(club.id, removedMember.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.removed,
      joinedAt: null,
    });

    const outsiderResponse = await request(app)
      .post(`/clubs/${club.id}/feed/seen`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`);
    const removedResponse = await request(app)
      .post(`/clubs/${club.id}/feed/seen`)
      .set('Authorization', `Bearer ${authTokenFor(removedMember)}`);
    const activeResponse = await request(app)
      .post(`/clubs/${club.id}/feed/seen`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);

    expect(outsiderResponse.status).toBe(403);
    expect(removedResponse.status).toBe(403);
    expect(activeResponse.status).toBe(200);
  });

  it('POST /clubs/:id/feed/seen atualiza lastSeenAt e marca apenas atividade do clube como lida', async () => {
    const { owner, member, club } = await createClubWithMember();
    const otherClub = await createTestClub({
      createdById: owner.id,
      memberCount: 1,
    });

    await addUserToClub(otherClub.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    const promptNotification = await createTestNotification({
      userId: member.id,
      actorId: owner.id,
      type: NotificationType.club_new_prompt,
      clubId: club.id,
      referenceType: 'club_prompt',
      referenceId: 'prompt-1',
    });
    const commentNotification = await createTestNotification({
      userId: member.id,
      actorId: owner.id,
      type: NotificationType.club_prompt_comment,
      clubId: club.id,
      referenceType: 'club_prompt_comment',
      referenceId: 'comment-1',
    });
    const adminNotification = await createTestNotification({
      userId: member.id,
      actorId: owner.id,
      type: NotificationType.club_invite_accepted,
      clubId: club.id,
      referenceType: 'club_invite',
      referenceId: 'invite-1',
    });
    const otherClubNotification = await createTestNotification({
      userId: member.id,
      actorId: owner.id,
      type: NotificationType.club_new_prompt,
      clubId: otherClub.id,
      referenceType: 'club_prompt',
      referenceId: 'prompt-other',
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/feed/seen`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      lastSeenAt: expect.any(String),
      readCount: 2,
      unreadCount: 1,
    });

    const membership = await prisma.clubMember.findUniqueOrThrow({
      where: {
        clubId_userId: {
          clubId: club.id,
          userId: member.id,
        },
      },
    });
    const notifications = await prisma.notification.findMany({
      where: {
        id: {
          in: [
            promptNotification.id,
            commentNotification.id,
            adminNotification.id,
            otherClubNotification.id,
          ],
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    expect(membership.lastSeenAt?.toISOString()).toBe(response.body.lastSeenAt);
    expect(
      notifications.filter((notification) => notification.readAt).map(
        (notification) => notification.id,
      ),
    ).toEqual(
      expect.arrayContaining([promptNotification.id, commentNotification.id]),
    );
    expect(
      notifications.find((notification) => notification.id === adminNotification.id)
        ?.readAt,
    ).toBeNull();
    expect(
      notifications.find(
        (notification) => notification.id === otherClubNotification.id,
      )?.readAt,
    ).toBeNull();
  });

  it('GET /clubs/my retorna contadores de nao lidos por clube e estado de mute', async () => {
    const { owner, member, club } = await createClubWithMember();
    const secondClub = await createTestClub({
      createdById: owner.id,
      memberCount: 2,
    });
    const mutedUntil = futureDate(240);
    const lastSeenAt = pastDate(15);

    await addUserToClub(secondClub.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(secondClub.id, member.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.active,
      mutedUntil,
      lastSeenAt,
    });
    await createTestNotification({
      userId: member.id,
      actorId: owner.id,
      clubId: club.id,
      type: NotificationType.club_new_prompt,
    });
    await createTestNotification({
      userId: member.id,
      actorId: owner.id,
      clubId: club.id,
      type: NotificationType.club_prompt_comment,
    });
    await createTestNotification({
      userId: member.id,
      actorId: owner.id,
      clubId: club.id,
      type: NotificationType.club_prompt_response,
      readAt: new Date(),
    });
    await createTestNotification({
      userId: member.id,
      actorId: owner.id,
      clubId: secondClub.id,
      type: NotificationType.club_prompt_comment,
    });

    const response = await request(app)
      .get('/clubs/my')
      .set('Authorization', `Bearer ${authTokenFor(member)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: club.id,
          viewerActivity: expect.objectContaining({
            unreadCount: 2,
            isMuted: false,
            mutedUntil: null,
          }),
        }),
        expect.objectContaining({
          id: secondClub.id,
          viewerActivity: expect.objectContaining({
            unreadCount: 1,
            isMuted: true,
            mutedUntil: mutedUntil.toISOString(),
            lastSeenAt: lastSeenAt.toISOString(),
          }),
        }),
      ]),
    );
  });

  it('GET /clubs/:id retorna atividade do viewer e estado de mute', async () => {
    const { owner, member, club } = await createClubWithMember();
    const mutedUntil = futureDate(240);
    const lastSeenAt = pastDate(30);

    await addUserToClub(club.id, member.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.active,
      mutedUntil,
      lastSeenAt,
    });
    await createTestNotification({
      userId: member.id,
      actorId: owner.id,
      clubId: club.id,
      type: NotificationType.club_new_prompt,
    });

    const response = await request(app)
      .get(`/clubs/${club.id}`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: club.id,
      viewerActivity: {
        unreadCount: 1,
        isMuted: true,
        mutedUntil: mutedUntil.toISOString(),
        lastSeenAt: lastSeenAt.toISOString(),
      },
    });
  });
});
