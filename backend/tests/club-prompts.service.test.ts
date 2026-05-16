import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptType,
  ClubStatus,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import { ClubServiceError } from '../src/services/clubs/core/clubs.service';
import { createClubPrompt } from '../src/services/clubs/prompts/prompts.service';
import {
  addUserToClub,
  createTestClub,
  createTestUser,
  resetFeedData,
} from '../src/test-utils/factories';
import { applyTestDatabaseHooks } from './test-db';

function futureDate(minutes = 60) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

async function createActiveClubWithMember(role: ClubMemberRole) {
  const owner = await createTestUser();
  const author = await createTestUser();
  const club = await createTestClub({
    createdById: owner.id,
    memberCount: 2,
  });

  await addUserToClub(club.id, owner.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, author.id, {
    role,
    status: ClubMemberStatus.active,
  });

  return {
    owner,
    author,
    club,
  };
}

describe('club-prompts.service', () => {
  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('cria prompt de verdade por membro ativo e atualiza contadores do clube', async () => {
    const { author, club } = await createActiveClubWithMember(
      ClubMemberRole.member,
    );

    const prompt = await createClubPrompt({
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.truth,
      content: 'Qual foi a verdade mais dificil que voce ja contou?',
    });

    expect(prompt).toMatchObject({
      clubId: club.id,
      authorId: author.id,
      authorName: author.name,
      type: ClubPromptType.truth,
      status: 'published',
      content: 'Qual foi a verdade mais dificil que voce ja contou?',
      maxAttempts: null,
      answersCount: 0,
      commentsCount: 0,
      likesCount: 0,
      isPinned: false,
      isMembersOnly: true,
    });
    expect(prompt.publishedAt).toEqual(expect.any(String));

    const updatedClub = await prisma.club.findUniqueOrThrow({
      where: {
        id: club.id,
      },
    });

    expect(updatedClub.promptCount).toBe(1);
    expect(updatedClub.lastActivityAt).not.toBeNull();
  });

  it('cria prompt de desafio com tentativas, prazo, dificuldade e anexos', async () => {
    const { author, club } = await createActiveClubWithMember(
      ClubMemberRole.member,
    );
    const expiresAt = futureDate(90);

    const prompt = await createClubPrompt({
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.dare,
      content: 'Envie uma prova criativa do desafio.',
      maxAttempts: 3,
      expiresAt,
      difficulty: 'medium',
      attachments: [
        {
          type: 'image',
          url: 'https://example.com/desafio.png',
          name: 'desafio.png',
        },
      ],
    });

    expect(prompt).toMatchObject({
      type: ClubPromptType.dare,
      maxAttempts: 3,
      difficulty: 'medium',
    });
    expect(prompt.expiresAt).toBe(expiresAt.toISOString());
    expect(prompt.attachments).toEqual([
      expect.objectContaining({
        type: 'image',
        url: 'https://example.com/desafio.png',
      }),
    ]);
  });

  it('registra audit log de criacao de prompt', async () => {
    const { author, club } = await createActiveClubWithMember(
      ClubMemberRole.member,
    );

    const prompt = await createClubPrompt({
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.truth,
      content: 'Conte algo que quase ninguem sabe.',
    });

    await expect(
      prisma.clubAuditLog.findFirst({
        where: {
          clubId: club.id,
          actorId: author.id,
          action: 'club_prompt_created',
          entityType: 'club_prompt',
          entityId: prompt.id,
        },
      }),
    ).resolves.toMatchObject({
      action: 'club_prompt_created',
    });
  });

  it('bloqueia outsider e membro sem status ativo', async () => {
    const owner = await createTestUser();
    const outsider = await createTestUser();
    const invited = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });
    await addUserToClub(club.id, invited.id, {
      role: ClubMemberRole.member,
      status: ClubMemberStatus.invited,
    });

    const input = {
      clubId: club.id,
      type: ClubPromptType.truth,
      content: 'Pergunta bloqueada para quem nao pode postar.',
    };

    await expect(
      createClubPrompt({
        ...input,
        authorId: outsider.id,
      }),
    ).rejects.toMatchObject<Partial<ClubServiceError>>({
      code: 'CLUB_FORBIDDEN',
    });

    await expect(
      createClubPrompt({
        ...input,
        authorId: invited.id,
      }),
    ).rejects.toMatchObject<Partial<ClubServiceError>>({
      code: 'CLUB_FORBIDDEN',
    });
  });

  it('bloqueia criacao em clube arquivado', async () => {
    const owner = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      status: ClubStatus.archived,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    await expect(
      createClubPrompt({
        clubId: club.id,
        authorId: owner.id,
        type: ClubPromptType.truth,
        content: 'Pergunta em clube arquivado.',
      }),
    ).rejects.toMatchObject<Partial<ClubServiceError>>({
      code: 'CLUB_FORBIDDEN',
    });
  });

  it('valida tipo, conteudo, prazo e anexos invalidos', async () => {
    const { author, club } = await createActiveClubWithMember(
      ClubMemberRole.member,
    );

    await expect(
      createClubPrompt({
        clubId: club.id,
        authorId: author.id,
        type: 'invalid',
        content: 'Conteudo valido',
      }),
    ).rejects.toMatchObject<Partial<ClubServiceError>>({
      code: 'CLUB_VALIDATION_ERROR',
    });

    await expect(
      createClubPrompt({
        clubId: club.id,
        authorId: author.id,
        type: ClubPromptType.truth,
        content: '  ',
      }),
    ).rejects.toMatchObject<Partial<ClubServiceError>>({
      code: 'CLUB_VALIDATION_ERROR',
    });

    await expect(
      createClubPrompt({
        clubId: club.id,
        authorId: author.id,
        type: ClubPromptType.dare,
        content: 'Desafio com prazo passado.',
        expiresAt: new Date(Date.now() - 1000),
      }),
    ).rejects.toMatchObject<Partial<ClubServiceError>>({
      code: 'CLUB_VALIDATION_ERROR',
    });

    await expect(
      createClubPrompt({
        clubId: club.id,
        authorId: author.id,
        type: ClubPromptType.dare,
        content: 'Desafio com anexo invalido.',
        attachments: [{ type: 'image' }],
      }),
    ).rejects.toMatchObject<Partial<ClubServiceError>>({
      code: 'CLUB_VALIDATION_ERROR',
    });
  });

  it('permite fixar prompt apenas por owner, admin ou moderator', async () => {
    const { author: member, club } = await createActiveClubWithMember(
      ClubMemberRole.member,
    );
    const moderator = await createTestUser();

    await addUserToClub(club.id, moderator.id, {
      role: ClubMemberRole.moderator,
      status: ClubMemberStatus.active,
    });

    await expect(
      createClubPrompt({
        clubId: club.id,
        authorId: member.id,
        type: ClubPromptType.truth,
        content: 'Membro comum tentando fixar.',
        isPinned: true,
      }),
    ).rejects.toMatchObject<Partial<ClubServiceError>>({
      code: 'CLUB_FORBIDDEN',
    });

    const prompt = await createClubPrompt({
      clubId: club.id,
      authorId: moderator.id,
      type: ClubPromptType.truth,
      content: 'Moderador pode fixar esta pergunta.',
      isPinned: true,
    });

    expect(prompt.isPinned).toBe(true);
  });
});
