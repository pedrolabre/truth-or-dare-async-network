import {
  ClubMemberStatus,
  ClubPromptType,
  ClubStatus,
  ClubVisibility,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import {
  searchClubs,
  getRecommendedUsers,
  getTrendingClubs,
  SearchServiceError,
  searchContent,
  searchUsers,
} from '../src/services/search/search.service';
import {
  addUserToClub,
  createTestClub,
  createTestClubPrompt,
  createTestDare,
  createTestTruth,
  createTestUser,
  resetFeedData,
} from '../src/test-utils/factories';
import { applyTestDatabaseHooks } from './test-db';

describe('search.service', () => {
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

  it('rejeita busca vazia ou curta com erro padronizado', async () => {
    const viewer = await createTestUser();

    await expect(searchUsers('', { userId: viewer.id })).rejects.toMatchObject<
      Partial<SearchServiceError>
    >({
      code: 'SEARCH_QUERY_TOO_SHORT',
      statusCode: 400,
    });

    await expect(searchClubs('a', { userId: viewer.id })).rejects.toMatchObject<
      Partial<SearchServiceError>
    >({
      code: 'SEARCH_QUERY_TOO_SHORT',
      statusCode: 400,
    });
  });

  it('rejeita busca longa com erro padronizado', async () => {
    const viewer = await createTestUser();
    const longQuery = 'x'.repeat(81);

    await expect(
      searchUsers(longQuery, { userId: viewer.id }),
    ).rejects.toMatchObject<Partial<SearchServiceError>>({
      code: 'SEARCH_QUERY_TOO_LONG',
      statusCode: 400,
    });
  });

  it('busca usuarios por nome, username e bio retornando somente campos publicos', async () => {
    const viewer = await createTestUser();
    const userByName = await createTestUser({
      name: 'Marina Busca',
      email: 'marina-search-service@test.com',
      username: 'maresia',
    });
    const userByUsername = await createTestUser({
      name: 'Usuario Comum',
      email: 'username-search-service@test.com',
      username: 'desafio_total',
    });
    const userByBio = await createTestUser({
      name: 'Biografia Publica',
      email: 'bio-search-service@test.com',
      username: 'biografia-publica',
    });
    await prisma.user.update({
      where: {
        id: userByBio.id,
      },
      data: {
        bio: 'Gosta de desafios criativos em grupo',
      },
    });

    const nameResult = await searchUsers('Marina', { userId: viewer.id });
    const usernameResult = await searchUsers('desafio_total', {
      userId: viewer.id,
    });
    const bioResult = await searchUsers('criativos', { userId: viewer.id });

    expect(nameResult.items).toEqual([
      expect.objectContaining({
        id: userByName.id,
        name: 'Marina Busca',
        username: 'maresia',
        bio: null,
        avatarUrl: null,
        level: null,
        mutualCount: 0,
      }),
    ]);
    expect(usernameResult.items[0].id).toBe(userByUsername.id);
    expect(bioResult.items[0].id).toBe(userByBio.id);
    expect(nameResult.items[0]).not.toHaveProperty('email');
    expect(nameResult.items[0]).not.toHaveProperty('passwordHash');
  });

  it('oculta usuario privado sem permissao e exibe quando ha clube ativo em comum', async () => {
    const viewer = await createTestUser();
    const outsider = await createTestUser();
    const owner = await createTestUser();
    const privateUser = await createTestUser({
      name: 'Privado Busca Usuario',
      email: 'private-search-user@test.com',
      username: 'privado_busca',
      isPrivate: true,
    });
    const sharedClub = await createTestClub({
      createdById: owner.id,
      name: 'Privacidade Usuarios',
    });

    await addUserToClub(sharedClub.id, viewer.id);
    await addUserToClub(sharedClub.id, privateUser.id);

    const outsiderResult = await searchUsers('Privado Busca', {
      userId: outsider.id,
    });
    const permittedResult = await searchUsers('Privado Busca', {
      userId: viewer.id,
    });

    expect(outsiderResult.items).toEqual([]);
    expect(permittedResult.items).toEqual([
      expect.objectContaining({
        id: privateUser.id,
        username: 'privado_busca',
      }),
    ]);
  });

  it('retorna lista vazia quando nao ha resultados', async () => {
    const viewer = await createTestUser();

    const users = await searchUsers('semresultado', { userId: viewer.id });
    const clubs = await searchClubs('semresultado', { userId: viewer.id });

    expect(users).toEqual({
      items: [],
      nextCursor: null,
    });
    expect(clubs).toEqual({
      items: [],
      nextCursor: null,
    });
  });

  it('pagina resultados por cursor e offset', async () => {
    const viewer = await createTestUser();
    await createTestUser({
      name: 'Busca Paginada A',
      email: 'search-page-a@test.com',
    });
    await createTestUser({
      name: 'Busca Paginada B',
      email: 'search-page-b@test.com',
    });
    await createTestUser({
      name: 'Busca Paginada C',
      email: 'search-page-c@test.com',
    });

    const firstPage = await searchUsers('Busca Paginada', {
      userId: viewer.id,
      limit: 2,
    });
    const secondPage = await searchUsers('Busca Paginada', {
      userId: viewer.id,
      limit: 2,
      cursor: firstPage.nextCursor,
    });
    const offsetPage = await searchUsers('Busca Paginada', {
      userId: viewer.id,
      limit: 2,
      offset: 2,
    });

    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.nextCursor).toBe(firstPage.items[1].id);
    expect(secondPage.items).toHaveLength(1);
    expect(secondPage.nextCursor).toBeNull();
    expect(offsetPage.items.map((item) => item.id)).toEqual(
      secondPage.items.map((item) => item.id),
    );
  });

  it('filtra clubes por visibilidade, status publico e bloqueio do viewer', async () => {
    const viewer = await createTestUser();
    const owner = await createTestUser();
    const publicClub = await createTestClub({
      createdById: owner.id,
      name: 'Noite das Verdades',
      description: 'Perguntas intensas para amigos',
      slug: 'noite-das-verdades',
      tags: ['noite'],
      memberCount: 30,
    });
    await createTestClub({
      createdById: owner.id,
      name: 'Noite Privada',
      visibility: ClubVisibility.private,
      tags: ['noite'],
    });
    await createTestClub({
      createdById: owner.id,
      name: 'Noite Arquivada',
      status: ClubStatus.archived,
      tags: ['noite'],
    });
    const blockedClub = await createTestClub({
      createdById: owner.id,
      name: 'Noite Bloqueada',
      tags: ['noite'],
    });
    await addUserToClub(blockedClub.id, viewer.id, {
      status: ClubMemberStatus.blocked,
    });

    const result = await searchClubs('noite', { userId: viewer.id });

    expect(result.items).toEqual([
      expect.objectContaining({
        id: publicClub.id,
        name: 'Noite das Verdades',
        slug: 'noite-das-verdades',
        description: 'Perguntas intensas para amigos',
        iconName: 'groups',
        avatarUrl: null,
        memberCount: 30,
        tags: ['noite'],
      }),
    ]);
  });

  it('exibe clube privado somente para membro ativo', async () => {
    const viewer = await createTestUser();
    const outsider = await createTestUser();
    const owner = await createTestUser();
    const privateClub = await createTestClub({
      createdById: owner.id,
      name: 'Clube Privado Permitido',
      visibility: ClubVisibility.private,
      tags: ['privado-permitido'],
    });

    await addUserToClub(privateClub.id, viewer.id, {
      status: ClubMemberStatus.active,
    });

    const outsiderResult = await searchClubs('privado-permitido', {
      userId: outsider.id,
    });
    const memberResult = await searchClubs('privado-permitido', {
      userId: viewer.id,
    });

    expect(outsiderResult.items).toEqual([]);
    expect(memberResult.items).toEqual([
      expect.objectContaining({
        id: privateClub.id,
      }),
    ]);
  });

  it('calcula mutualCount por clubes ativos em comum no schema atual', async () => {
    const viewer = await createTestUser();
    const owner = await createTestUser();
    const target = await createTestUser({
      name: 'Usuario Mutual',
      email: 'mutual-target@test.com',
    });
    const otherTarget = await createTestUser({
      name: 'Usuario Mutual Dois',
      email: 'mutual-other@test.com',
    });
    const firstClub = await createTestClub({
      createdById: owner.id,
      name: 'Mutual Clube Um',
    });
    const secondClub = await createTestClub({
      createdById: owner.id,
      name: 'Mutual Clube Dois',
    });
    const otherClub = await createTestClub({
      createdById: owner.id,
      name: 'Mutual Clube Tres',
    });

    await addUserToClub(firstClub.id, viewer.id);
    await addUserToClub(firstClub.id, target.id);
    await addUserToClub(secondClub.id, viewer.id);
    await addUserToClub(secondClub.id, target.id);
    await addUserToClub(otherClub.id, otherTarget.id);

    const result = await searchUsers('Usuario Mutual', { userId: viewer.id });

    expect(result.items).toEqual([
      expect.objectContaining({
        id: target.id,
        mutualCount: 2,
      }),
      expect.objectContaining({
        id: otherTarget.id,
        mutualCount: 0,
      }),
    ]);
  });

  it('calcula isTrending por crescimento de membros nas ultimas 48 horas', async () => {
    const now = new Date('2026-05-29T15:00:00.000Z');
    const viewer = await createTestUser();
    const owner = await createTestUser();
    const recentMemberOne = await createTestUser();
    const recentMemberTwo = await createTestUser();
    const oldMember = await createTestUser();
    const trendingClub = await createTestClub({
      createdById: owner.id,
      name: 'Clube Tendencia',
      tags: ['tendencia'],
    });
    const stableClub = await createTestClub({
      createdById: owner.id,
      name: 'Clube Estavel',
      tags: ['tendencia'],
    });

    await addUserToClub(trendingClub.id, recentMemberOne.id, {
      joinedAt: new Date('2026-05-29T10:00:00.000Z'),
    });
    await addUserToClub(trendingClub.id, recentMemberTwo.id, {
      joinedAt: new Date('2026-05-28T10:00:00.000Z'),
    });
    await addUserToClub(stableClub.id, oldMember.id, {
      joinedAt: new Date('2026-05-20T10:00:00.000Z'),
    });

    const result = await searchClubs('tendencia', {
      userId: viewer.id,
      now,
      trendingMemberGrowthThreshold: 2,
    });

    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: trendingClub.id,
          isTrending: true,
        }),
        expect.objectContaining({
          id: stableClub.id,
          isTrending: false,
        }),
      ]),
    );
  });

  it('aplica filtros de nivel minimo e maximo de usuarios', async () => {
    const viewer = await createTestUser();
    const lowLevelUser = await createTestUser({
      name: 'Nivel Busca Baixo',
      email: 'search-level-low@test.com',
    });
    const highLevelUser = await createTestUser({
      name: 'Nivel Busca Alto',
      email: 'search-level-high@test.com',
    });

    await createTestTruth({
      authorId: lowLevelUser.id,
      targetUserId: viewer.id,
      content: 'Atividade de nivel baixo.',
    });
    await createTestTruth({
      authorId: highLevelUser.id,
      targetUserId: viewer.id,
      content: 'Atividade de nivel alto um.',
    });
    await createTestDare({
      authorId: highLevelUser.id,
      targetUserId: viewer.id,
      content: 'Atividade de nivel alto dois.',
    });

    const minResult = await searchUsers('Nivel Busca', {
      userId: viewer.id,
      minLevel: 2,
    });
    const maxResult = await searchUsers('Nivel Busca', {
      userId: viewer.id,
      maxLevel: 1,
    });

    expect(minResult.items).toEqual([
      expect.objectContaining({
        id: highLevelUser.id,
        level: 2,
      }),
    ]);
    expect(maxResult.items).toEqual([
      expect.objectContaining({
        id: lowLevelUser.id,
        level: 1,
      }),
    ]);
  });

  it('aplica filtro de usuarios online usando atividade recente em clube ativo', async () => {
    const now = new Date('2026-05-30T15:00:00.000Z');
    const viewer = await createTestUser();
    const owner = await createTestUser();
    const onlineUser = await createTestUser({
      name: 'Online Busca Presente',
      email: 'search-online-present@test.com',
    });
    const offlineUser = await createTestUser({
      name: 'Online Busca Ausente',
      email: 'search-online-absent@test.com',
    });
    const club = await createTestClub({
      createdById: owner.id,
      name: 'Clube Online Busca',
    });

    await addUserToClub(club.id, onlineUser.id, {
      lastSeenAt: new Date('2026-05-30T14:57:00.000Z'),
    });
    await addUserToClub(club.id, offlineUser.id, {
      lastSeenAt: new Date('2026-05-30T14:40:00.000Z'),
    });

    const result = await searchUsers('Online Busca', {
      userId: viewer.id,
      onlineOnly: true,
      now,
    });

    expect(result.items).toEqual([
      expect.objectContaining({
        id: onlineUser.id,
        isOnline: true,
      }),
    ]);
  });

  it('aplica filtros de visibilidade publica e tag de clube sem vazar clubes privados', async () => {
    const viewer = await createTestUser();
    const owner = await createTestUser();
    const taggedClub = await createTestClub({
      createdById: owner.id,
      name: 'Filtro Clube Noite',
      tags: ['noite', 'desafio'],
    });
    await createTestClub({
      createdById: owner.id,
      name: 'Filtro Clube Escola',
      tags: ['escola'],
    });
    await createTestClub({
      createdById: owner.id,
      name: 'Filtro Clube Privado',
      visibility: ClubVisibility.private,
      tags: ['noite'],
    });

    const result = await searchClubs('Filtro Clube', {
      userId: viewer.id,
      clubVisibility: 'public',
      clubTag: 'noite',
    });

    expect(result.items).toEqual([
      expect.objectContaining({
        id: taggedClub.id,
        tags: ['noite', 'desafio'],
      }),
    ]);
  });

  it('busca conteudo em verdades, desafios e comentarios permitidos', async () => {
    const viewer = await createTestUser();
    const author = await createTestUser({
      name: 'Autora Conteudo',
      email: 'search-content-author@test.com',
    });
    const truth = await createTestTruth({
      authorId: author.id,
      targetUserId: viewer.id,
      content: 'Verdade com palavra mosaico para busca.',
    });
    const dare = await createTestDare({
      authorId: author.id,
      targetUserId: viewer.id,
      content: 'Desafio mosaico ainda ativo.',
      expiresAt: new Date('2026-06-01T12:00:00.000Z'),
    });
    const truthComment = await prisma.truthComment.create({
      data: {
        truthId: truth.id,
        userId: viewer.id,
        text: 'Comentario mosaico em verdade publica.',
      },
    });
    const club = await createTestClub({
      createdById: author.id,
      name: 'Clube Conteudo',
      visibility: ClubVisibility.public,
    });
    const prompt = await createTestClubPrompt({
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.truth,
      content: 'Prompt mosaico aberto para todos.',
      expiresAt: new Date('2026-06-01T12:00:00.000Z'),
    });
    await prisma.clubPrompt.update({
      where: {
        id: prompt.id,
      },
      data: {
        isMembersOnly: false,
      },
    });
    const promptComment = await prisma.clubPromptComment.create({
      data: {
        clubId: club.id,
        promptId: prompt.id,
        userId: viewer.id,
        text: 'Comentario mosaico em prompt visivel.',
      },
    });

    const result = await searchContent('mosaico', {
      userId: viewer.id,
      now: new Date('2026-05-30T12:00:00.000Z'),
      limit: 10,
    });

    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: `truth:${truth.id}`,
          sourceType: 'truth',
          contentType: 'truth',
          route: 'feed-comments',
        }),
        expect.objectContaining({
          id: `dare:${dare.id}`,
          sourceType: 'dare',
          contentType: 'dare',
          route: 'action-screen',
        }),
        expect.objectContaining({
          id: `truth_comment:${truthComment.id}`,
          sourceType: 'truth_comment',
          contentType: 'comment',
          parentId: truth.id,
        }),
        expect.objectContaining({
          id: `club_prompt:${prompt.id}`,
          sourceType: 'club_prompt',
          clubId: club.id,
          route: 'club-detail',
        }),
        expect.objectContaining({
          id: `club_prompt_comment:${promptComment.id}`,
          sourceType: 'club_prompt_comment',
          parentId: prompt.id,
          clubId: club.id,
        }),
      ]),
    );
    expect(result.nextCursor).toBeNull();
  });

  it('retorna conteudo vazio sem resultados', async () => {
    const viewer = await createTestUser();

    const result = await searchContent('semconteudo', {
      userId: viewer.id,
    });

    expect(result).toEqual({
      items: [],
      nextCursor: null,
    });
  });

  it('exclui conteudo de clube privado, removido, expirado e bloqueado', async () => {
    const now = new Date('2026-05-30T12:00:00.000Z');
    const viewer = await createTestUser();
    const owner = await createTestUser();
    const visibleClub = await createTestClub({
      createdById: owner.id,
      name: 'Conteudo Visivel',
      visibility: ClubVisibility.public,
    });
    const visiblePrompt = await createTestClubPrompt({
      clubId: visibleClub.id,
      authorId: owner.id,
      content: 'Seguranca conteudo visivel.',
      expiresAt: new Date('2026-06-01T12:00:00.000Z'),
    });
    await prisma.clubPrompt.update({
      where: {
        id: visiblePrompt.id,
      },
      data: {
        isMembersOnly: false,
      },
    });
    const privateClub = await createTestClub({
      createdById: owner.id,
      name: 'Conteudo Privado',
      visibility: ClubVisibility.private,
    });
    await createTestClubPrompt({
      clubId: privateClub.id,
      authorId: owner.id,
      content: 'Seguranca conteudo privado.',
    });
    const removedPrompt = await createTestClubPrompt({
      clubId: visibleClub.id,
      authorId: owner.id,
      content: 'Seguranca conteudo removido.',
    });
    await prisma.clubPrompt.update({
      where: {
        id: removedPrompt.id,
      },
      data: {
        removedAt: now,
      },
    });
    await createTestDare({
      authorId: owner.id,
      targetUserId: viewer.id,
      content: 'Seguranca conteudo expirado.',
      expiresAt: new Date('2026-05-01T12:00:00.000Z'),
    });
    const blockedClub = await createTestClub({
      createdById: owner.id,
      name: 'Conteudo Bloqueado',
      visibility: ClubVisibility.public,
    });
    await addUserToClub(blockedClub.id, viewer.id, {
      status: ClubMemberStatus.blocked,
    });
    await createTestClubPrompt({
      clubId: blockedClub.id,
      authorId: owner.id,
      content: 'Seguranca conteudo bloqueado.',
    });

    const result = await searchContent('seguranca', {
      userId: viewer.id,
      now,
      limit: 10,
    });

    expect(result.items).toEqual([
      expect.objectContaining({
        id: `club_prompt:${visiblePrompt.id}`,
      }),
    ]);
  });

  it('oculta conteudo de usuarios privados e permite conteudo de clube privado para membro ativo', async () => {
    const outsider = await createTestUser();
    const member = await createTestUser();
    const privateAuthor = await createTestUser({
      name: 'Autora Privada Conteudo',
      email: 'private-content-author@test.com',
      isPrivate: true,
    });
    const owner = await createTestUser();
    const privateClub = await createTestClub({
      createdById: owner.id,
      name: 'Clube Conteudo Privado Permitido',
      visibility: ClubVisibility.private,
    });

    await addUserToClub(privateClub.id, member.id);
    await addUserToClub(privateClub.id, owner.id);
    await createTestTruth({
      authorId: privateAuthor.id,
      targetUserId: outsider.id,
      content: 'Privacidade termo usuario privado.',
    });
    const privatePrompt = await createTestClubPrompt({
      clubId: privateClub.id,
      authorId: owner.id,
      content: 'Privacidade termo clube privado.',
    });

    const outsiderResult = await searchContent('privacidade termo', {
      userId: outsider.id,
      limit: 10,
    });
    const memberResult = await searchContent('privacidade termo', {
      userId: member.id,
      limit: 10,
    });

    expect(outsiderResult.items).toEqual([]);
    expect(memberResult.items).toEqual([
      expect.objectContaining({
        id: `club_prompt:${privatePrompt.id}`,
        clubId: privateClub.id,
      }),
    ]);
  });

  it('traduz falhas de persistencia para SEARCH_UNAVAILABLE', async () => {
    const viewer = await createTestUser();
    const findManySpy = jest
      .spyOn(prisma.user, 'findMany')
      .mockRejectedValueOnce(new Error('database unavailable') as never);

    await expect(searchUsers('falha', { userId: viewer.id })).rejects.toMatchObject<
      Partial<SearchServiceError>
    >({
      code: 'SEARCH_UNAVAILABLE',
      statusCode: 503,
    });

    findManySpy.mockRestore();
  });

  it('recomenda usuarios por clubes ativos em comum e atividade recente', async () => {
    const now = new Date('2026-05-29T15:00:00.000Z');
    const viewer = await createTestUser();
    const owner = await createTestUser();
    const recommended = await createTestUser({
      name: 'Usuario Recomendado Busca',
      email: 'recommended-search-service@test.com',
      username: 'recomendado_busca',
      createdAt: new Date('2026-05-28T10:00:00.000Z'),
    });
    const lessRelevant = await createTestUser({
      name: 'Usuario Recomendado Distante',
      email: 'recommended-distant-search-service@test.com',
      createdAt: new Date('2026-05-29T10:00:00.000Z'),
    });
    const sharedClub = await createTestClub({
      createdById: owner.id,
      name: 'Clube Recomendacao',
    });

    await addUserToClub(sharedClub.id, viewer.id);
    await addUserToClub(sharedClub.id, recommended.id);
    await createTestTruth({
      authorId: recommended.id,
      targetUserId: viewer.id,
      content: 'Verdade recente para recomendacao.',
      createdAt: new Date('2026-05-29T12:00:00.000Z'),
    });
    await createTestDare({
      authorId: lessRelevant.id,
      targetUserId: viewer.id,
      content: 'Desafio recente sem clube em comum.',
      createdAt: new Date('2026-05-29T12:30:00.000Z'),
    });

    const result = await getRecommendedUsers({
      userId: viewer.id,
      now,
      limit: 5,
    });

    expect(result[0]).toMatchObject({
      id: recommended.id,
      name: 'Usuario Recomendado Busca',
      username: 'recomendado_busca',
      avatarUrl: null,
      level: null,
      mutualCount: 1,
    });
    expect(result[0]).not.toHaveProperty('email');
    expect(result[0]).not.toHaveProperty('passwordHash');
    expect(result.map((user) => user.id)).not.toContain(viewer.id);
  });

  it('retorna recomendados vazio quando nao ha candidatos', async () => {
    const viewer = await createTestUser();

    const result = await getRecommendedUsers({
      userId: viewer.id,
      limit: 5,
    });

    expect(result).toEqual([]);
  });

  it('retorna clubes em alta por crescimento, atividade e prompts recentes', async () => {
    const now = new Date('2026-05-29T15:00:00.000Z');
    const viewer = await createTestUser();
    const owner = await createTestUser();
    const recentMember = await createTestUser();
    const trendingClub = await createTestClub({
      createdById: owner.id,
      name: 'Clube Alta Servico',
      tags: ['alta-servico'],
      memberCount: 8,
    });
    const promptClub = await createTestClub({
      createdById: owner.id,
      name: 'Clube Prompt Recente',
      tags: ['alta-servico'],
      memberCount: 4,
    });

    await addUserToClub(trendingClub.id, recentMember.id, {
      joinedAt: new Date('2026-05-29T12:00:00.000Z'),
    });
    await createTestClubPrompt({
      clubId: promptClub.id,
      authorId: owner.id,
      content: 'Prompt recente para alta.',
      createdAt: new Date('2026-05-29T13:00:00.000Z'),
    });
    await prisma.club.update({
      where: {
        id: promptClub.id,
      },
      data: {
        promptCount: 1,
        lastActivityAt: new Date('2026-05-29T13:00:00.000Z'),
      },
    });

    const result = await getTrendingClubs({
      userId: viewer.id,
      now,
      trendingMemberGrowthThreshold: 1,
      limit: 5,
    });

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: trendingClub.id,
          isTrending: true,
        }),
        expect.objectContaining({
          id: promptClub.id,
          isTrending: true,
        }),
      ]),
    );
    expect(result[0]).not.toHaveProperty('createdById');
  });

  it('retorna clubes em alta vazio quando nao ha clubes elegiveis', async () => {
    const viewer = await createTestUser();
    const owner = await createTestUser();
    await createTestClub({
      createdById: owner.id,
      name: 'Clube Sem Alta',
    });

    const result = await getTrendingClubs({
      userId: viewer.id,
      now: new Date('2026-05-29T15:00:00.000Z'),
      limit: 5,
    });

    expect(result).toEqual([]);
  });
});
