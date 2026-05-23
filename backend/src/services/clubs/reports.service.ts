import {
  ClubPromptStatus,
  ClubReportTargetType,
  ClubStatus,
} from '../../generated/prisma/client';
import { ClubReportDto } from '../../dtos/clubs.dto';
import { prisma } from '../../lib/prisma';
import {
  duplicateReportError,
  forbiddenError,
  notFoundError,
  requireAuthenticatedUser,
  validationError,
} from './core/errors';
import { ensureCanViewClub } from './core/permissions';
import { getClubWithMembers } from './core/repository';
import {
  assertMemberCanUseClub,
} from './moderation.service';
import {
  canViewPromptClub,
  getActivePromptMembership,
} from './prompts/permissions';

const REPORT_REASONS = [
  'spam',
  'harassment',
  'hate',
  'sexual',
  'violence',
  'other',
] as const;

const REPORT_DETAILS_MAX_LENGTH = 1000;

type ReportReason = (typeof REPORT_REASONS)[number];

type CreateClubReportInput = {
  clubId: string;
  reporterId: string;
  reason: unknown;
  details?: unknown;
};

type CreateClubPromptReportInput = CreateClubReportInput & {
  promptId: string;
};

type CreateClubPromptResponseReportInput = CreateClubPromptReportInput & {
  responseId: string;
};

type CreateClubPromptCommentReportInput = CreateClubPromptReportInput & {
  commentId: string;
};

type ClubReportTarget = {
  targetType: ClubReportTargetType;
  targetId: string;
  authorId?: string;
  metadata?: Record<string, string | boolean | null>;
};

function validateReportReason(reason: unknown): ReportReason {
  if (typeof reason !== 'string') {
    validationError('Motivo da denuncia e obrigatorio');
  }

  const normalizedReason = reason.trim();

  if (!REPORT_REASONS.includes(normalizedReason as ReportReason)) {
    validationError('Motivo da denuncia e invalido');
  }

  return normalizedReason as ReportReason;
}

function validateReportDetails(details: unknown): string | null {
  if (details === undefined || details === null) {
    return null;
  }

  if (typeof details !== 'string') {
    validationError('Detalhes da denuncia devem ser um texto');
  }

  const normalizedDetails = details.trim();

  if (!normalizedDetails) {
    return null;
  }

  if (normalizedDetails.length > REPORT_DETAILS_MAX_LENGTH) {
    validationError(
      `Detalhes da denuncia devem ter no maximo ${REPORT_DETAILS_MAX_LENGTH} caracteres`,
    );
  }

  return normalizedDetails;
}

function isUnavailablePrompt(prompt: {
  status: ClubPromptStatus;
  archivedAt: Date | null;
  removedAt: Date | null;
}) {
  return (
    prompt.status !== ClubPromptStatus.published ||
    Boolean(prompt.archivedAt) ||
    Boolean(prompt.removedAt)
  );
}

function mapReport(report: {
  id: string;
  clubId: string;
  targetType: ClubReportTargetType;
  targetId: string;
  reason: string;
  details: string | null;
  createdAt: Date;
}): ClubReportDto {
  return {
    id: report.id,
    clubId: report.clubId,
    targetType: report.targetType,
    targetId: report.targetId,
    reason: report.reason,
    details: report.details,
    createdAt: report.createdAt.toISOString(),
  };
}

function auditActionForTarget(targetType: ClubReportTargetType) {
  switch (targetType) {
    case ClubReportTargetType.club:
      return 'club_report_created';
    case ClubReportTargetType.club_prompt:
      return 'club_prompt_report_created';
    case ClubReportTargetType.club_prompt_response:
      return 'club_prompt_response_report_created';
    case ClubReportTargetType.club_prompt_comment:
      return 'club_prompt_comment_report_created';
    default:
      return 'club_report_created';
  }
}

async function createReport({
  clubId,
  reporterId,
  reason,
  details,
  target,
}: CreateClubReportInput & { target: ClubReportTarget }) {
  const normalizedReason = validateReportReason(reason);
  const normalizedDetails = validateReportDetails(details);

  if (target.authorId && target.authorId === reporterId) {
    validationError('Nao e possivel denunciar seu proprio conteudo');
  }

  const existingReport = await prisma.clubReport.findUnique({
    where: {
      reporterId_targetType_targetId: {
        reporterId,
        targetType: target.targetType,
        targetId: target.targetId,
      },
    },
  });

  if (existingReport) {
    duplicateReportError();
  }

  const report = await prisma.$transaction(async (tx) => {
    const createdReport = await tx.clubReport.create({
      data: {
        clubId,
        reporterId,
        targetType: target.targetType,
        targetId: target.targetId,
        reason: normalizedReason,
        details: normalizedDetails,
      },
    });

    await tx.clubAuditLog.create({
      data: {
        clubId,
        actorId: reporterId,
        action: auditActionForTarget(target.targetType),
        entityType: 'club_report',
        entityId: createdReport.id,
        metadata: {
          targetType: target.targetType,
          targetId: target.targetId,
          reason: normalizedReason,
          hasDetails: Boolean(normalizedDetails),
          ...target.metadata,
        },
      },
    });

    return createdReport;
  });

  return mapReport(report);
}

async function getReportablePromptContext({
  clubId,
  promptId,
  reporterId,
}: {
  clubId: string;
  promptId: string;
  reporterId: string;
}) {
  if (!clubId || !promptId) {
    notFoundError();
  }

  const club = await prisma.club.findUnique({
    where: {
      id: clubId,
    },
    include: {
      members: {
        where: {
          userId: reporterId,
        },
      },
    },
  });

  if (!club || club.status === ClubStatus.deleted || club.deletedAt) {
    notFoundError();
  }

  const membership = getActivePromptMembership(club.members, reporterId);
  assertMemberCanUseClub(club.members[0]);

  if (!canViewPromptClub(club, membership)) {
    forbiddenError();
  }

  const prompt = await prisma.clubPrompt.findFirst({
    where: {
      id: promptId,
      clubId,
    },
  });

  if (!prompt) {
    notFoundError();
  }

  if (isUnavailablePrompt(prompt)) {
    forbiddenError();
  }

  return {
    club,
    prompt,
  };
}

export async function createClubReport({
  clubId,
  reporterId,
  reason,
  details,
}: CreateClubReportInput): Promise<ClubReportDto> {
  requireAuthenticatedUser(reporterId);

  if (!clubId) {
    notFoundError();
  }

  const club = await getClubWithMembers(clubId);
  ensureCanViewClub(club, reporterId);

  return createReport({
    clubId,
    reporterId,
    reason,
    details,
    target: {
      targetType: ClubReportTargetType.club,
      targetId: club.id,
      authorId: club.createdById,
    },
  });
}

export async function createClubPromptReport({
  clubId,
  promptId,
  reporterId,
  reason,
  details,
}: CreateClubPromptReportInput): Promise<ClubReportDto> {
  requireAuthenticatedUser(reporterId);

  const { prompt } = await getReportablePromptContext({
    clubId,
    promptId,
    reporterId,
  });

  return createReport({
    clubId,
    reporterId,
    reason,
    details,
    target: {
      targetType: ClubReportTargetType.club_prompt,
      targetId: prompt.id,
      authorId: prompt.authorId,
    },
  });
}

export async function createClubPromptResponseReport({
  clubId,
  promptId,
  responseId,
  reporterId,
  reason,
  details,
}: CreateClubPromptResponseReportInput): Promise<ClubReportDto> {
  requireAuthenticatedUser(reporterId);

  const { prompt } = await getReportablePromptContext({
    clubId,
    promptId,
    reporterId,
  });

  if (!responseId) {
    notFoundError();
  }

  const response = await prisma.clubPromptResponse.findFirst({
    where: {
      id: responseId,
      clubId,
      promptId,
    },
  });

  if (!response) {
    notFoundError();
  }

  if (response.archivedAt || response.removedAt) {
    forbiddenError();
  }

  return createReport({
    clubId,
    reporterId,
    reason,
    details,
    target: {
      targetType: ClubReportTargetType.club_prompt_response,
      targetId: response.id,
      authorId: response.userId,
      metadata: {
        promptId: prompt.id,
      },
    },
  });
}

export async function createClubPromptCommentReport({
  clubId,
  promptId,
  commentId,
  reporterId,
  reason,
  details,
}: CreateClubPromptCommentReportInput): Promise<ClubReportDto> {
  requireAuthenticatedUser(reporterId);

  const { prompt } = await getReportablePromptContext({
    clubId,
    promptId,
    reporterId,
  });

  if (!commentId) {
    notFoundError();
  }

  const comment = await prisma.clubPromptComment.findFirst({
    where: {
      id: commentId,
      clubId,
      promptId,
    },
  });

  if (!comment) {
    notFoundError();
  }

  if (comment.removedAt) {
    forbiddenError();
  }

  return createReport({
    clubId,
    reporterId,
    reason,
    details,
    target: {
      targetType: ClubReportTargetType.club_prompt_comment,
      targetId: comment.id,
      authorId: comment.userId,
      metadata: {
        promptId: prompt.id,
        responseId: comment.responseId,
      },
    },
  });
}
