import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubStatus,
} from '../src/generated/prisma/client';
import {
  addUserToClub,
  createTestClub,
  createTestUser,
  resetFeedData,
} from '../src/test-utils/factories';
import { applyTestDatabaseHooks } from './test-db';
import {
  authTokenFor,
  createTestApp,
  createTransferScenario,
} from './helpers/clubs-ownership-transfer.helpers';

describe('clubs.ownership-transfer.routes guards', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it.each([
    ClubMemberRole.admin,
    ClubMemberRole.moderator,
    ClubMemberRole.member,
  ])('bloqueia %s transferindo posse', async (actorRole) => {
    const owner = await createTestUser();
    const actor = await createTestUser();
    const target = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 3,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(club.id, actor.id, {
      role: actorRole,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(club.id, target.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.active,
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/transfer-ownership`)
      .set('Authorization', `Bearer ${authTokenFor(actor)}`)
      .send({
        newOwnerId: target.id,
      });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
  });

  it('bloqueia outsider transferindo posse e owner transferindo para outsider', async () => {
    const outsider = await createTestUser();
    const targetOutsider = await createTestUser();
    const { club, owner, target } = await createTransferScenario();

    const actorResponse = await request(app)
      .post(`/clubs/${club.id}/transfer-ownership`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`)
      .send({
        newOwnerId: target.id,
      });
    const targetResponse = await request(app)
      .post(`/clubs/${club.id}/transfer-ownership`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        newOwnerId: targetOutsider.id,
      });

    expect(actorResponse.status).toBe(403);
    expect(actorResponse.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
    expect(targetResponse.status).toBe(400);
    expect(targetResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
  });

  it.each([
    ClubMemberStatus.invited,
    ClubMemberStatus.requested,
    ClubMemberStatus.removed,
  ])('bloqueia novo owner com status %s', async (status) => {
    const { club, owner, target } = await createTransferScenario(
      ClubMemberRole.member,
      status,
    );

    const response = await request(app)
      .post(`/clubs/${club.id}/transfer-ownership`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        newOwnerId: target.id,
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
  });

  it('bloqueia transferencia para si mesmo e payload ausente', async () => {
    const { club, owner } = await createTransferScenario();

    const selfResponse = await request(app)
      .post(`/clubs/${club.id}/transfer-ownership`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        newOwnerId: owner.id,
      });
    const missingResponse = await request(app)
      .post(`/clubs/${club.id}/transfer-ownership`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({});

    expect(selfResponse.status).toBe(400);
    expect(selfResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
    expect(missingResponse.status).toBe(400);
    expect(missingResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
  });

  it.each([ClubStatus.archived, ClubStatus.suspended])(
    'bloqueia transferencia em clube %s',
    async (status) => {
      const { club, owner, target } = await createTransferScenario(
        ClubMemberRole.member,
        ClubMemberStatus.active,
        status,
      );

      const response = await request(app)
        .post(`/clubs/${club.id}/transfer-ownership`)
        .set('Authorization', `Bearer ${authTokenFor(owner)}`)
        .send({
          newOwnerId: target.id,
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        code: 'CLUB_VALIDATION_ERROR',
      });
    },
  );

  it('retorna 404 para clube deletado e 401 sem token', async () => {
    const { club, owner, target } = await createTransferScenario(
      ClubMemberRole.member,
      ClubMemberStatus.active,
      ClubStatus.deleted,
    );

    const deletedResponse = await request(app)
      .post(`/clubs/${club.id}/transfer-ownership`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        newOwnerId: target.id,
      });
    const unauthorizedResponse = await request(app)
      .post(`/clubs/${club.id}/transfer-ownership`)
      .send({
        newOwnerId: target.id,
      });

    expect(deletedResponse.status).toBe(404);
    expect(deletedResponse.body).toMatchObject({
      code: 'CLUB_NOT_FOUND',
    });
    expect(unauthorizedResponse.status).toBe(401);
  });
});
