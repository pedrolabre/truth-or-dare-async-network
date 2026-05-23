import {
  ClubMemberStatus,
  ClubMemberRole,
} from '../../generated/prisma/client';
import {
  blockedMemberError,
  postingSuspendedError,
  validationError,
} from './core/errors';

type ModerationMembership = {
  status: ClubMemberStatus;
  role: ClubMemberRole;
  postingSuspendedUntil: Date | null;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function assertMemberCanUseClub(membership?: {
  status: ClubMemberStatus;
} | null) {
  if (membership?.status === ClubMemberStatus.blocked) {
    blockedMemberError();
  }
}

export function assertMemberCanPost(membership: ModerationMembership | null) {
  if (!membership) {
    return;
  }

  assertMemberCanUseClub(membership);

  if (
    membership.postingSuspendedUntil &&
    membership.postingSuspendedUntil.getTime() > Date.now()
  ) {
    postingSuspendedError(membership.postingSuspendedUntil);
  }
}

export function assertContentAllowedByClub(
  content: string | null,
  blockedWords: string[],
) {
  if (!content || blockedWords.length === 0) {
    return;
  }

  const normalizedContent = content.toLowerCase();
  const blockedWord = blockedWords.find((word) => {
    const escapedWord = escapeRegex(word.toLowerCase());
    const pattern = new RegExp(`(^|\\W)${escapedWord}(?=\\W|$)`, 'iu');

    return pattern.test(normalizedContent);
  });

  if (blockedWord) {
    validationError(
      `Conteudo contem palavra bloqueada pelas regras do clube: ${blockedWord}`,
    );
  }
}
