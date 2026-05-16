import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptStatus,
  ClubPromptType,
  ClubStatus,
  ClubVisibility,
  LikeTargetType,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import { getFeedClubItems } from '../src/services/feed-club-items.service';
import {
  addUserToClub,
  createTestClub,
  createTestUser,
  resetFeedData,
} from '../src/test-utils/factories';
import { applyTestDatabaseHooks } from './test-db';

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

function futureDate(minutes = 60) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function pastDate(minutes = 60) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

async function createPrompt({
  clubId,
  authorId,
  content,
  type = ClubPromptType.truth,
  status = ClubPromptStatus.published,
  answersCount = 0,
  likesCount = 0,
  isMembersOnly = true,
  expiresAt = futureDate(),
  publishedAt = minutesAgo(10),
  createdAt = publishedAt ?? undefined,
  archivedAt,
  removedAt,
}: {
  clubId: string;
  authorId: string;
  content: string;
  type?: ClubPromptType;
  status?: ClubPromptStatus;
  answersCount?: number;
  likesCount?: number;
  isMembersOnly?: boolean;
  expiresAt?: Date | null;
  publishedAt?: Date | null;
  createdAt?: Date;
  archivedAt?: Date | null;
  removedAt?: Date | null;
}) {
  return prisma.clubPrompt.create({
    data: {
      clubId,
      authorId,
      type,
      status,
      content,
      answersCount,
      likesCount,
      isMembersOnly,
      expiresAt,
      publishedAt,
      createdAt,
      archivedAt:
        archivedAt ??
        (status === ClubPromptStatus.archived ? minutesAgo(1) : undefined),
      removedAt:
        removedAt ??
        (status === ClubPromptStatus.removed ? minutesAgo(1) : undefined),
    },
  });
}

async function createClubProjectionScenario({
  viewerStatus,
  visibility = ClubVisibility.public,
  clubStatus = ClubStatus.active,
  isMembersOnly = true,
  content = 'Prompt projetado no feed geral.',
  publishedAt = minutesAgo(10),
}: {
  viewerStatus?: ClubMemberStatus;
  visibility?: ClubVisibility;
  clubStatus?: ClubStatus;
  isMembersOnly?: boolean;
  content?: string;
  publishedAt?: Date;
} = {}) {
  const owner = await createTestUser();
  const author = await createTestUser({ name: 'Autora Feed Geral' });
  const viewer = await createTestUser({ name: 'Viewer Feed Geral' });
  const club = await createTestClub({
    createdById: owner.id,
    visibility,
    status: clubStatus,
    memberCount: viewerStatus ? 3 : 2,
  });

  await addUserToClub(club.id, owner.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, author.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
  });

  if (viewerStatus) {
    await addUserToClub(club.id, viewer.id, {
      role: ClubMemberRole.member,
      status: viewerStatus,
    });
  }

  const prompt = await createPrompt({
    clubId: club.id,
    authorId: author.id,
    content,
    isMembersOnly,
    publishedAt,
  });

  return {
    owner,
    author,
    viewer,
    club,
    prompt,
  };
}

async function createPromptForViewer({
  ownerId,
  authorId,
  viewerId,
  content,
  visibility,
  viewerStatus,
  isMembersOnly,
}: {
  ownerId: string;
  authorId: string;
  viewerId: string;
  content: string;
  visibility: ClubVisibility;
  viewerStatus?: ClubMemberStatus;
  isMembersOnly: boolean;
}) {
  const club = await createTestClub({
    createdById: ownerId,
    visibility,
    memberCount: viewerStatus ? 3 : 2,
  });

  await addUserToClub(club.id, ownerId, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, authorId, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
  });

  if (viewerStatus) {
    await addUserToClub(club.id, viewerId, {
      role: ClubMemberRole.member,
      status: viewerStatus,
    });
  }

  return createPrompt({
    clubId: club.id,
    authorId,
    content,
    isMembersOnly,
  });
}

describe('getFeedClubItems', () => {
  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('projeta prompts publicados com contrato contadores persistidos e like club_prompt', async () => {
    const owner = await createTestUser();
    const author = await createTestUser({ name: 'Autora Contadores' });
    const viewer = await createTestUser({ name: 'Viewer Contadores' });
    const club = await createTestClub({
      createdById: owner.id,
      name: 'Clube Feed Geral',
      visibility: ClubVisibility.public,
      memberCount: 3,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(club.id, author.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(club.id, viewer.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.active,
    });

    const likedPrompt = await createPrompt({
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.dare,
      content: 'Desafio com contadores persistidos.',
      answersCount: 7,
      likesCount: 13,
      publishedAt: minutesAgo(5),
    });
    const legacyClubLikePrompt = await createPrompt({
      clubId: club.id,
      authorId: author.id,
      content: 'Prompt com like legado de clube.',
      answersCount: 3,
      likesCount: 5,
      publishedAt: minutesAgo(10),
    });

    await prisma.like.create({
      data: {
        userId: viewer.id,
        targetId: likedPrompt.id,
        targetType: LikeTargetType.club_prompt,
      },
    });
    await prisma.like.create({
      data: {
        userId: viewer.id,
        targetId: legacyClubLikePrompt.id,
        targetType: LikeTargetType.club,
      },
    });

    const response = await getFeedClubItems(viewer.id);

    expect(response).toEqual([
      {
        id: likedPrompt.id,
        type: 'club',
        clubName: 'Clube Feed Geral',
        badge: 'Desafio',
        quote: 'Desafio com contadores persistidos.',
        answersCount: 7,
        likesCount: 13,
        likedByMe: true,
      },
      {
        id: legacyClubLikePrompt.id,
        type: 'club',
        clubName: 'Clube Feed Geral',
        badge: 'Verdade',
        quote: 'Prompt com like legado de clube.',
        answersCount: 3,
        likesCount: 5,
        likedByMe: false,
      },
    ]);
  });

  it('retorna vazio quando nao ha usuario autenticado', async () => {
    const { club, author } = await createClubProjectionScenario({
      isMembersOnly: false,
      content: 'Prompt publico sem viewer.',
    });

    await createPrompt({
      clubId: club.id,
      authorId: author.id,
      content: 'Outro prompt publico sem viewer.',
      isMembersOnly: false,
    });

    const response = await getFeedClubItems();

    expect(response).toEqual([]);
  });

  it('respeita visibilidade membership ativa e prompts members only', async () => {
    const viewer = await createTestUser({ name: 'Viewer Permissoes' });
    const owner = await createTestUser({ name: 'Dona Permissoes' });
    const author = await createTestUser({ name: 'Autora Permissoes' });

    await createPromptForViewer({
      ownerId: owner.id,
      authorId: author.id,
      viewerId: viewer.id,
      content: 'Prompt publico aberto para outsider.',
      visibility: ClubVisibility.public,
      isMembersOnly: false,
    });
    await createPromptForViewer({
      ownerId: owner.id,
      authorId: author.id,
      viewerId: viewer.id,
      content: 'Prompt publico members only para outsider.',
      visibility: ClubVisibility.public,
      isMembersOnly: true,
    });
    await createPromptForViewer({
      ownerId: owner.id,
      authorId: author.id,
      viewerId: viewer.id,
      content: 'Prompt privado para outsider.',
      visibility: ClubVisibility.private,
      isMembersOnly: false,
    });
    await createPromptForViewer({
      ownerId: owner.id,
      authorId: author.id,
      viewerId: viewer.id,
      content: 'Prompt invite only para outsider.',
      visibility: ClubVisibility.invite_only,
      isMembersOnly: false,
    });
    await createPromptForViewer({
      ownerId: owner.id,
      authorId: author.id,
      viewerId: viewer.id,
      content: 'Prompt privado para membro ativo.',
      visibility: ClubVisibility.private,
      viewerStatus: ClubMemberStatus.active,
      isMembersOnly: true,
    });
    await createPromptForViewer({
      ownerId: owner.id,
      authorId: author.id,
      viewerId: viewer.id,
      content: 'Prompt invite only para membro ativo.',
      visibility: ClubVisibility.invite_only,
      viewerStatus: ClubMemberStatus.active,
      isMembersOnly: true,
    });
    await createPromptForViewer({
      ownerId: owner.id,
      authorId: author.id,
      viewerId: viewer.id,
      content: 'Prompt publico para membership removida.',
      visibility: ClubVisibility.public,
      viewerStatus: ClubMemberStatus.removed,
      isMembersOnly: false,
    });

    const response = await getFeedClubItems(viewer.id);
    const quotes = response.map((item) => item.quote);

    expect(quotes).toHaveLength(3);
    expect(quotes).toEqual(
      expect.arrayContaining([
        'Prompt publico aberto para outsider.',
        'Prompt privado para membro ativo.',
        'Prompt invite only para membro ativo.',
      ]),
    );
    expect(quotes).not.toEqual(
      expect.arrayContaining([
        'Prompt publico members only para outsider.',
        'Prompt privado para outsider.',
        'Prompt invite only para outsider.',
        'Prompt publico para membership removida.',
      ]),
    );
  });

  it('oculta clubes indisponiveis prompts indisponiveis e prompts expirados', async () => {
    const visibleScenario = await createClubProjectionScenario({
      viewerStatus: ClubMemberStatus.active,
      content: 'Prompt visivel no feed geral.',
    });
    const archivedClubScenario = await createClubProjectionScenario({
      viewerStatus: ClubMemberStatus.active,
      clubStatus: ClubStatus.archived,
      content: 'Prompt de clube arquivado.',
    });
    const suspendedClubScenario = await createClubProjectionScenario({
      viewerStatus: ClubMemberStatus.active,
      clubStatus: ClubStatus.suspended,
      content: 'Prompt de clube suspenso.',
    });
    const deletedClubScenario = await createClubProjectionScenario({
      viewerStatus: ClubMemberStatus.active,
      clubStatus: ClubStatus.deleted,
      content: 'Prompt de clube deletado.',
    });
    const softDeletedClubScenario = await createClubProjectionScenario({
      viewerStatus: ClubMemberStatus.active,
      content: 'Prompt de clube soft deleted.',
    });

    await prisma.club.update({
      where: {
        id: softDeletedClubScenario.club.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    await createPrompt({
      clubId: visibleScenario.club.id,
      authorId: visibleScenario.author.id,
      content: 'Prompt em draft.',
      status: ClubPromptStatus.draft,
    });
    await createPrompt({
      clubId: visibleScenario.club.id,
      authorId: visibleScenario.author.id,
      content: 'Prompt arquivado.',
      status: ClubPromptStatus.archived,
    });
    await createPrompt({
      clubId: visibleScenario.club.id,
      authorId: visibleScenario.author.id,
      content: 'Prompt removido.',
      status: ClubPromptStatus.removed,
    });
    await createPrompt({
      clubId: visibleScenario.club.id,
      authorId: visibleScenario.author.id,
      content: 'Prompt publicado com archivedAt.',
      archivedAt: new Date(),
    });
    await createPrompt({
      clubId: visibleScenario.club.id,
      authorId: visibleScenario.author.id,
      content: 'Prompt publicado com removedAt.',
      removedAt: new Date(),
    });
    await createPrompt({
      clubId: visibleScenario.club.id,
      authorId: visibleScenario.author.id,
      content: 'Prompt expirado.',
      expiresAt: pastDate(),
    });

    const response = await getFeedClubItems(visibleScenario.viewer.id);
    const quotes = response.map((item) => item.quote);

    expect(quotes).toEqual(['Prompt visivel no feed geral.']);
    expect(archivedClubScenario.prompt.id).toBeDefined();
    expect(suspendedClubScenario.prompt.id).toBeDefined();
    expect(deletedClubScenario.prompt.id).toBeDefined();
  });

  it('limita a projecao a dez prompts de clube preservando publicacao recente', async () => {
    const { viewer, club, author } = await createClubProjectionScenario({
      viewerStatus: ClubMemberStatus.active,
      content: 'Prompt base fora do limite.',
      publishedAt: minutesAgo(40),
    });

    const prompts = [];

    for (let index = 0; index < 12; index += 1) {
      const prompt = await createPrompt({
        clubId: club.id,
        authorId: author.id,
        content: `Prompt projetado ${index + 1}.`,
        publishedAt: minutesAgo(index + 1),
      });

      prompts.push(prompt);
    }

    const response = await getFeedClubItems(viewer.id);

    expect(response).toHaveLength(10);
    expect(response.map((item) => item.id)).toEqual(
      prompts.slice(0, 10).map((prompt) => prompt.id),
    );
    expect(response.map((item) => item.quote)).not.toContain(
      'Prompt base fora do limite.',
    );
  });
});
