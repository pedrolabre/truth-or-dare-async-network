import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubStatus,
} from '../src/generated/prisma/client';
import { getClubPermissions } from '../src/services/clubs/core/permissions';
import {
  addUserToClub,
  createTestClub,
  createTestUser,
  resetFeedData,
} from '../src/test-utils/factories';
import { applyTestDatabaseHooks } from './test-db';

describe('clubs.permissions', () => {
  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it.each([
    [
      ClubMemberRole.owner,
      {
        podeEditar: true,
        podeConvidar: true,
        podeModerar: true,
        podePostar: true,
        podeResponder: true,
      },
    ],
    [
      ClubMemberRole.admin,
      {
        podeEditar: true,
        podeConvidar: true,
        podeModerar: true,
        podePostar: true,
        podeResponder: true,
      },
    ],
    [
      ClubMemberRole.moderator,
      {
        podeEditar: false,
        podeConvidar: false,
        podeModerar: true,
        podePostar: true,
        podeResponder: true,
      },
    ],
    [
      ClubMemberRole.member,
      {
        podeEditar: false,
        podeConvidar: false,
        podeModerar: false,
        podePostar: true,
        podeResponder: true,
      },
    ],
  ])('calcula permissoes para membro ativo %s', async (role, expected) => {
    const owner = await createTestUser();
    const viewer = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 2,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(club.id, viewer.id, {
      role,
      status: ClubMemberStatus.active,
    });

    await expect(getClubPermissions(viewer.id, club.id)).resolves.toEqual(
      expected,
    );
  });

  it.each([ClubMemberStatus.invited, ClubMemberStatus.requested, ClubMemberStatus.removed])(
    'nega permissoes internas para status %s',
    async (status) => {
      const owner = await createTestUser();
      const viewer = await createTestUser();
      const club = await createTestClub({
        createdById: owner.id,
        memberCount: 1,
      });

      await addUserToClub(club.id, owner.id, {
        role: ClubMemberRole.owner,
        status: ClubMemberStatus.active,
      });
      await addUserToClub(club.id, viewer.id, {
        role: ClubMemberRole.member,
        status,
      });

      await expect(getClubPermissions(viewer.id, club.id)).resolves.toEqual({
        podeEditar: false,
        podeConvidar: false,
        podeModerar: false,
        podePostar: false,
        podeResponder: false,
      });
    },
  );

  it('nega permissoes internas para outsider e clube arquivado', async () => {
    const owner = await createTestUser();
    const outsider = await createTestUser();
    const archivedMember = await createTestUser();
    const publicClub = await createTestClub({
      createdById: owner.id,
      memberCount: 1,
    });
    const archivedClub = await createTestClub({
      createdById: owner.id,
      status: ClubStatus.archived,
      memberCount: 1,
    });

    await addUserToClub(publicClub.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(archivedClub.id, archivedMember.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    await expect(getClubPermissions(outsider.id, publicClub.id)).resolves.toEqual({
      podeEditar: false,
      podeConvidar: false,
      podeModerar: false,
      podePostar: false,
      podeResponder: false,
    });

    await expect(
      getClubPermissions(archivedMember.id, archivedClub.id),
    ).resolves.toEqual({
      podeEditar: false,
      podeConvidar: false,
      podeModerar: false,
      podePostar: false,
      podeResponder: false,
    });
  });
});
