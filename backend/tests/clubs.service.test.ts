import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubStatus,
  ClubVisibility,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import {
  archiveClub,
  ClubServiceError,
  createClub,
  getClubDetails,
  listMyClubs,
  searchClubs,
  updateClub,
} from '../src/services/clubs/core/clubs.service';
import {
  addUserToClub,
  createTestClub,
  createTestUser,
  resetFeedData,
} from '../src/test-utils/factories';
import { applyTestDatabaseHooks } from './test-db';

describe('clubs.service', () => {
  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('cria clube com slug unico, owner automatico, membros iniciais e audit log', async () => {
    const creator = await createTestUser();
    const invited = await createTestUser();

    await createTestClub({
      createdById: creator.id,
      name: 'Clube Coragem',
      slug: 'clube-coragem',
    });

    const club = await createClub({
      creatorId: creator.id,
      name: 'Clube Coragem',
      description: 'Um clube para desafios',
      iconName: 'celebration',
      visibility: 'public',
      rules: 'Respeite todo mundo',
      tags: ['coragem'],
      initialMemberIds: [invited.id],
    });

    expect(club.slug).toBe('clube-coragem-2');
    expect(club.memberCount).toBe(2);
    expect(club.viewerMembership).toMatchObject({
      isMember: true,
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    const memberships = await prisma.clubMember.findMany({
      where: {
        clubId: club.id,
      },
      orderBy: {
        role: 'desc',
      },
    });

    expect(memberships).toHaveLength(2);
    expect(
      memberships.some(
        (membership) =>
          membership.userId === creator.id &&
          membership.role === ClubMemberRole.owner &&
          membership.status === ClubMemberStatus.active,
      ),
    ).toBe(true);
    expect(
      memberships.some(
        (membership) =>
          membership.userId === invited.id &&
          membership.role === ClubMemberRole.member &&
          membership.status === ClubMemberStatus.active,
      ),
    ).toBe(true);

    await expect(
      prisma.clubAuditLog.count({
        where: {
          clubId: club.id,
        },
      }),
    ).resolves.toBe(2);
  });

  it('valida duplicatas e impede adicionar o criador como membro inicial', async () => {
    const creator = await createTestUser();
    const member = await createTestUser();

    await expect(
      createClub({
        creatorId: creator.id,
        name: 'Duplicado',
        initialMemberIds: [member.id, member.id],
      }),
    ).rejects.toMatchObject<Partial<ClubServiceError>>({
      code: 'CLUB_VALIDATION_ERROR',
    });

    await expect(
      createClub({
        creatorId: creator.id,
        name: 'Criador Duplicado',
        initialMemberIds: [creator.id],
      }),
    ).rejects.toMatchObject<Partial<ClubServiceError>>({
      code: 'CLUB_VALIDATION_ERROR',
    });
  });

  it('lista clubes do usuario com papel, status e ultima atividade', async () => {
    const owner = await createTestUser();
    const member = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      name: 'Meu Clube',
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

    const clubs = await listMyClubs(member.id);

    expect(clubs).toHaveLength(1);
    expect(clubs[0]).toMatchObject({
      id: club.id,
      name: 'Meu Clube',
      viewerMembership: {
        isMember: true,
        role: ClubMemberRole.member,
        status: ClubMemberStatus.active,
      },
    });
  });

  it('busca clubes publicos por nome, descricao, slug e tags', async () => {
    const viewer = await createTestUser();
    const owner = await createTestUser();

    const publicClub = await createTestClub({
      createdById: owner.id,
      name: 'Noite das Verdades',
      description: 'Perguntas intensas',
      tags: ['noite'],
    });
    await createTestClub({
      createdById: owner.id,
      name: 'Clube Privado',
      visibility: ClubVisibility.private,
      tags: ['noite'],
    });

    const clubs = await searchClubs({
      userId: viewer.id,
      query: 'noite',
    });

    expect(clubs).toHaveLength(1);
    expect(clubs[0].id).toBe(publicClub.id);
  });

  it('calcula permissao de detalhe e bloqueia edicao por membro comum', async () => {
    const owner = await createTestUser();
    const member = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      name: 'Permissoes',
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

    const details = await getClubDetails({
      clubId: club.id,
      userId: member.id,
    });

    expect(details.permissions.canPostPrompt).toBe(true);
    expect(details.permissions.canEditClub).toBe(false);

    await expect(
      updateClub({
        clubId: club.id,
        userId: member.id,
        name: 'Novo Nome',
      }),
    ).rejects.toMatchObject<Partial<ClubServiceError>>({
      code: 'CLUB_FORBIDDEN',
    });
  });

  it('permite owner editar identidade e arquivar clube', async () => {
    const owner = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      name: 'Antigo',
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    const updated = await updateClub({
      clubId: club.id,
      userId: owner.id,
      name: 'Novo Nome',
      iconName: 'favorite',
      visibility: 'invite_only',
    });

    expect(updated.name).toBe('Novo Nome');
    expect(updated.slug).toBe(club.slug);
    expect(updated.iconName).toBe('favorite');
    expect(updated.visibility).toBe(ClubVisibility.invite_only);

    await archiveClub({
      clubId: club.id,
      userId: owner.id,
    });

    const archived = await prisma.club.findUniqueOrThrow({
      where: {
        id: club.id,
      },
    });

    expect(archived.status).toBe(ClubStatus.archived);
    expect(archived.archivedAt).not.toBeNull();
  });
});
