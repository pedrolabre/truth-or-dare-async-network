import express from 'express';
import request from 'supertest';
import {
  ClubMemberStatus,
  ClubStatus,
  LikeTargetType,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import clubLikesRoutes from '../src/routes/club-likes.routes';
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

describe('POST /clubs/:id/like', () => {
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

  it('deve criar like quando o usuario ainda nao curtiu o clube', async () => {
    const owner = await createTestUser({
      name: 'Club Creator',
      email: 'club-creator@test.com',
      password: '123456',
    });
    const liker = await createTestUser({
      name: 'Club Liker',
      email: 'club-liker@test.com',
      password: '123456',
    });
    const club = await createTestClub({
      createdById: owner.id,
    });

    await addUserToClub(club.id, liker.id);

    const response = await request(app)
      .post(`/clubs/${club.id}/like`)
      .set('Authorization', `Bearer ${authTokenFor(liker)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      liked: true,
      likesCount: 1,
    });

    const persistedLike = await prisma.like.findUnique({
      where: {
        userId_targetId_targetType: {
          userId: liker.id,
          targetId: club.id,
          targetType: LikeTargetType.club,
        },
      },
    });

    expect(persistedLike).not.toBeNull();
  });

  it('deve remover like quando ja estiver curtido', async () => {
    const owner = await createTestUser({
      name: 'Club Creator Two',
      email: 'club-creator-two@test.com',
      password: '123456',
    });
    const liker = await createTestUser({
      name: 'Club Liker Two',
      email: 'club-liker-two@test.com',
      password: '123456',
    });
    const club = await createTestClub({
      createdById: owner.id,
    });

    await addUserToClub(club.id, liker.id);
    await prisma.like.create({
      data: {
        userId: liker.id,
        targetId: club.id,
        targetType: LikeTargetType.club,
      },
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/like`)
      .set('Authorization', `Bearer ${authTokenFor(liker)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      liked: false,
      likesCount: 0,
    });

    const persistedLike = await prisma.like.findUnique({
      where: {
        userId_targetId_targetType: {
          userId: liker.id,
          targetId: club.id,
          targetType: LikeTargetType.club,
        },
      },
    });

    expect(persistedLike).toBeNull();
  });

  it('deve retornar 404 quando o id informado pertence a um prompt', async () => {
    const owner = await createTestUser({
      name: 'Club Creator Three',
      email: 'club-creator-three@test.com',
      password: '123456',
    });
    const liker = await createTestUser({
      name: 'Club Liker Three',
      email: 'club-liker-three@test.com',
      password: '123456',
    });
    const club = await createTestClub({
      createdById: owner.id,
    });

    await addUserToClub(club.id, liker.id);

    const prompt = await prisma.clubPrompt.create({
      data: {
        clubId: club.id,
        authorId: owner.id,
        type: 'truth',
        content: 'Prompt nao deve ser curtido como clube',
      },
    });

    const response = await request(app)
      .post(`/clubs/${prompt.id}/like`)
      .set('Authorization', `Bearer ${authTokenFor(liker)}`);

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      code: 'CLUB_NOT_FOUND',
    });
  });

  it('deve bloquear membership inativa e clube indisponivel', async () => {
    const owner = await createTestUser({
      name: 'Club Creator Four',
      email: 'club-creator-four@test.com',
      password: '123456',
    });
    const removedMember = await createTestUser({
      name: 'Removed Club Liker',
      email: 'removed-club-liker@test.com',
      password: '123456',
    });
    const activeMember = await createTestUser({
      name: 'Active Club Liker',
      email: 'active-club-liker@test.com',
      password: '123456',
    });
    const club = await createTestClub({
      createdById: owner.id,
    });
    const archivedClub = await createTestClub({
      createdById: owner.id,
      status: ClubStatus.archived,
    });

    await addUserToClub(club.id, removedMember.id, {
      status: ClubMemberStatus.removed,
    });
    await addUserToClub(archivedClub.id, activeMember.id);

    const removedMemberResponse = await request(app)
      .post(`/clubs/${club.id}/like`)
      .set('Authorization', `Bearer ${authTokenFor(removedMember)}`);
    const archivedClubResponse = await request(app)
      .post(`/clubs/${archivedClub.id}/like`)
      .set('Authorization', `Bearer ${authTokenFor(activeMember)}`);

    expect(removedMemberResponse.status).toBe(403);
    expect(archivedClubResponse.status).toBe(403);
  });
});
