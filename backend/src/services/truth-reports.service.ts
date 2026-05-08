import { prisma } from '../lib/prisma';

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

type CreateTruthReportInput = {
  truthId: string;
  userId: string;
  reason: unknown;
  details?: unknown;
};

type CreateTruthCommentReportInput = {
  commentId: string;
  userId: string;
  reason: unknown;
  details?: unknown;
};

type ReportResponse = {
  id: string;
  reason: string;
  details: string | null;
  createdAt: Date;
};

function validateReportReason(reason: unknown): ReportReason {
  if (typeof reason !== 'string') {
    throw new Error('Motivo da denúncia é obrigatório');
  }

  const normalizedReason = reason.trim();

  if (!REPORT_REASONS.includes(normalizedReason as ReportReason)) {
    throw new Error('Motivo da denúncia é inválido');
  }

  return normalizedReason as ReportReason;
}

function validateReportDetails(details: unknown): string | null {
  if (details === undefined || details === null) {
    return null;
  }

  if (typeof details !== 'string') {
    throw new Error('Detalhes da denúncia devem ser um texto');
  }

  const normalizedDetails = details.trim();

  if (!normalizedDetails) {
    return null;
  }

  if (normalizedDetails.length > REPORT_DETAILS_MAX_LENGTH) {
    throw new Error(
      `Detalhes da denúncia devem ter no máximo ${REPORT_DETAILS_MAX_LENGTH} caracteres`,
    );
  }

  return normalizedDetails;
}

export async function createTruthReportService({
  truthId,
  userId,
  reason,
  details,
}: CreateTruthReportInput): Promise<ReportResponse & { truthId: string }> {
  if (!userId) {
    throw new Error('Não autorizado');
  }

  if (!truthId) {
    throw new Error('Truth não encontrada');
  }

  const normalizedReason = validateReportReason(reason);
  const normalizedDetails = validateReportDetails(details);

  const truth = await prisma.truth.findUnique({
    where: {
      id: truthId,
    },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!truth) {
    throw new Error('Truth não encontrada');
  }

  if (truth.authorId === userId) {
    throw new Error('Não é possível denunciar sua própria truth');
  }

  const existingReport = await prisma.truthReport.findUnique({
    where: {
      truthId_userId: {
        truthId,
        userId,
      },
    },
  });

  if (existingReport) {
    throw new Error('Denúncia já registrada');
  }

  const report = await prisma.truthReport.create({
    data: {
      truthId,
      userId,
      reason: normalizedReason,
      details: normalizedDetails,
    },
  });

  return {
    id: report.id,
    truthId: report.truthId,
    reason: report.reason,
    details: report.details,
    createdAt: report.createdAt,
  };
}

export async function createTruthCommentReportService({
  commentId,
  userId,
  reason,
  details,
}: CreateTruthCommentReportInput): Promise<
  ReportResponse & { commentId: string }
> {
  if (!userId) {
    throw new Error('Não autorizado');
  }

  if (!commentId) {
    throw new Error('Comentário não encontrado');
  }

  const normalizedReason = validateReportReason(reason);
  const normalizedDetails = validateReportDetails(details);

  const comment = await prisma.truthComment.findUnique({
    where: {
      id: commentId,
    },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!comment) {
    throw new Error('Comentário não encontrado');
  }

  if (comment.userId === userId) {
    throw new Error('Não é possível denunciar seu próprio comentário');
  }

  const existingReport = await prisma.truthCommentReport.findUnique({
    where: {
      commentId_userId: {
        commentId,
        userId,
      },
    },
  });

  if (existingReport) {
    throw new Error('Denúncia já registrada');
  }

  const report = await prisma.truthCommentReport.create({
    data: {
      commentId,
      userId,
      reason: normalizedReason,
      details: normalizedDetails,
    },
  });

  return {
    id: report.id,
    commentId: report.commentId,
    reason: report.reason,
    details: report.details,
    createdAt: report.createdAt,
  };
}