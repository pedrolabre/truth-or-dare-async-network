import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptStatus,
  ClubPromptType,
  ClubStatus,
  Prisma,
} from '../generated/prisma/client';
import {
  ClubPromptAttachmentDto,
  ClubPromptSummaryDto,
} from '../dtos/clubs.dto';
import { prisma } from '../lib/prisma';
import {
  forbiddenError,
  notFoundError,
  requireAuthenticatedUser,
  validationError,
} from './clubs.errors';

const CLUB_PROMPT_CONTENT_MIN_LENGTH = 3;
const CLUB_PROMPT_CONTENT_MAX_LENGTH = 500;
const CLUB_PROMPT_MAX_ATTACHMENTS = 5;
const CLUB_PROMPT_DIFFICULTY_MAX_LENGTH = 32;

type CreateClubPromptInput = {
  clubId: string;
  authorId: string;
  type: unknown;
  content: unknown;
  maxAttempts?: unknown;
  expiresAt?: unknown;
  difficulty?: unknown;
  attachments?: unknown;
  isPinned?: unknown;
  isMembersOnly?: unknown;
};

function normalizePromptType(value: unknown) {
  if (value !== ClubPromptType.truth && value !== ClubPromptType.dare) {
    validationError('Tipo de prompt invalido');
  }

  return value;
}

function normalizeContent(value: unknown) {
  if (typeof value !== 'string') {
    validationError('Conteudo do prompt e obrigatorio');
  }

  const content = value.trim();

  if (
    content.length < CLUB_PROMPT_CONTENT_MIN_LENGTH ||
    content.length > CLUB_PROMPT_CONTENT_MAX_LENGTH
  ) {
    validationError(
      `Conteudo do prompt deve ter entre ${CLUB_PROMPT_CONTENT_MIN_LENGTH} e ${CLUB_PROMPT_CONTENT_MAX_LENGTH} caracteres`,
    );
  }

  return content;
}

function normalizeMaxAttempts(value: unknown, type: ClubPromptType) {
  if (type === ClubPromptType.truth) {
    return null;
  }

  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0 || value > 50) {
    validationError('Maximo de tentativas deve ser um inteiro entre 1 e 50');
  }

  return value;
}

function normalizeOptionalDate(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string' && !(value instanceof Date)) {
    validationError('Prazo do prompt invalido');
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    validationError('Prazo do prompt invalido');
  }

  if (date.getTime() <= Date.now()) {
    validationError('Prazo do prompt deve ser futuro');
  }

  return date;
}

function normalizeDifficulty(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    validationError('Dificuldade do prompt deve ser texto');
  }

  const difficulty = value.trim();

  if (!difficulty) {
    return null;
  }

  if (difficulty.length > CLUB_PROMPT_DIFFICULTY_MAX_LENGTH) {
    validationError(
      `Dificuldade do prompt deve ter no maximo ${CLUB_PROMPT_DIFFICULTY_MAX_LENGTH} caracteres`,
    );
  }

  return difficulty;
}

function normalizeAttachments(value: unknown): Prisma.InputJsonValue | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Array.isArray(value)) {
    validationError('Anexos do prompt devem ser uma lista');
  }

  if (value.length > CLUB_PROMPT_MAX_ATTACHMENTS) {
    validationError(
      `Prompt deve ter no maximo ${CLUB_PROMPT_MAX_ATTACHMENTS} anexos`,
    );
  }

  value.forEach((attachment) => {
    if (!attachment || typeof attachment !== 'object' || Array.isArray(attachment)) {
      validationError('Anexo do prompt invalido');
    }

    const candidate = attachment as Record<string, unknown>;

    if (typeof candidate.type !== 'string' || typeof candidate.url !== 'string') {
      validationError('Anexo do prompt deve ter tipo e url');
    }

    if (!candidate.type.trim() || !candidate.url.trim()) {
      validationError('Anexo do prompt deve ter tipo e url');
    }
  });

  return value as Prisma.InputJsonValue;
}

function normalizeBoolean(value: unknown, defaultValue: boolean) {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value !== 'boolean') {
    validationError('Campo booleano invalido');
  }

  return value;
}

function mapPromptSummary(
  prompt: NonNullable<
    Awaited<ReturnType<typeof prisma.clubPrompt.findUnique>>
  > & {
    author: { name: string };
  },
): ClubPromptSummaryDto {
  const attachments = Array.isArray(prompt.attachments)
    ? (prompt.attachments as ClubPromptAttachmentDto[])
    : [];

  return {
    id: prompt.id,
    clubId: prompt.clubId,
    authorId: prompt.authorId,
    authorName: prompt.author.name,
    type: prompt.type,
    status: prompt.status,
    content: prompt.content,
    difficulty: prompt.difficulty,
    attachments,
    maxAttempts: prompt.maxAttempts,
    expiresAt: prompt.expiresAt?.toISOString() ?? null,
    publishedAt: prompt.publishedAt?.toISOString() ?? null,
    answersCount: prompt.answersCount,
    commentsCount: prompt.commentsCount,
    likesCount: prompt.likesCount,
    isPinned: prompt.isPinned,
    isMembersOnly: prompt.isMembersOnly,
    createdAt: prompt.createdAt.toISOString(),
    updatedAt: prompt.updatedAt.toISOString(),
  };
}

export async function createClubPrompt(
  input: CreateClubPromptInput,
): Promise<ClubPromptSummaryDto> {
  requireAuthenticatedUser(input.authorId);

  if (!input.clubId) {
    notFoundError();
  }

  const club = await prisma.club.findUnique({
    where: {
      id: input.clubId,
    },
    include: {
      members: {
        where: {
          userId: input.authorId,
        },
      },
    },
  });

  if (!club || club.status === ClubStatus.deleted || club.deletedAt) {
    notFoundError();
  }

  const membership = club.members[0];
  const isActiveMember = membership?.status === ClubMemberStatus.active;

  if (club.status !== ClubStatus.active || !isActiveMember) {
    forbiddenError();
  }

  const type = normalizePromptType(input.type);
  const content = normalizeContent(input.content);
  const maxAttempts = normalizeMaxAttempts(input.maxAttempts, type);
  const expiresAt = normalizeOptionalDate(input.expiresAt);
  const difficulty = normalizeDifficulty(input.difficulty);
  const attachments = normalizeAttachments(input.attachments);
  const isPinned = normalizeBoolean(input.isPinned, false);
  const isMembersOnly = normalizeBoolean(input.isMembersOnly, true);
  const canPin =
    membership.role === ClubMemberRole.owner ||
    membership.role === ClubMemberRole.admin ||
    membership.role === ClubMemberRole.moderator;

  if (isPinned && !canPin) {
    forbiddenError();
  }

  const now = new Date();

  const promptId = await prisma.$transaction(async (tx) => {
    const createdPrompt = await tx.clubPrompt.create({
      data: {
        clubId: input.clubId,
        authorId: input.authorId,
        type,
        status: ClubPromptStatus.published,
        content,
        maxAttempts,
        expiresAt,
        difficulty,
        attachments: attachments ?? Prisma.JsonNull,
        isPinned,
        isMembersOnly,
        publishedAt: now,
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    await tx.club.update({
      where: {
        id: input.clubId,
      },
      data: {
        promptCount: {
          increment: 1,
        },
        lastActivityAt: now,
      },
    });

    await tx.clubAuditLog.create({
      data: {
        clubId: input.clubId,
        actorId: input.authorId,
        action: 'club_prompt_created',
        entityType: 'club_prompt',
        entityId: createdPrompt.id,
        metadata: {
          type,
          isPinned,
        },
      },
    });

    return createdPrompt.id;
  });

  const prompt = await prisma.clubPrompt.findUniqueOrThrow({
    where: {
      id: promptId,
    },
    include: {
      author: {
        select: {
          name: true,
        },
      },
    },
  });

  return mapPromptSummary(prompt);
}
