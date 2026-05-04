import { prisma } from '../lib/prisma';

type ProofMediaTypeValue = 'video' | 'audio' | 'file';

type SubmitDareProofInput = {
  dareId: string;
  userId: string;
  mediaType: unknown;
  fileUrl: unknown;
  durationSeconds?: unknown;
  text?: unknown;
};

const ALLOWED_MEDIA_TYPES: ProofMediaTypeValue[] = ['video', 'audio', 'file'];

function normalizeMediaType(mediaType: unknown): ProofMediaTypeValue {
  if (typeof mediaType !== 'string') {
    throw new Error('mediaType is required');
  }

  if (!ALLOWED_MEDIA_TYPES.includes(mediaType as ProofMediaTypeValue)) {
    throw new Error('mediaType must be video, audio or file');
  }

  return mediaType as ProofMediaTypeValue;
}

function normalizeFileUrl(fileUrl: unknown): string {
  if (typeof fileUrl !== 'string' || !fileUrl.trim()) {
    throw new Error('fileUrl is required');
  }

  return fileUrl.trim();
}

function normalizeDurationSeconds(durationSeconds: unknown): number | null {
  if (durationSeconds === undefined || durationSeconds === null) {
    return null;
  }

  if (
    typeof durationSeconds !== 'number' ||
    !Number.isInteger(durationSeconds) ||
    durationSeconds < 0
  ) {
    throw new Error('durationSeconds must be a non-negative integer');
  }

  return durationSeconds;
}

function normalizeText(text: unknown): string | null {
  if (text === undefined || text === null) {
    return null;
  }

  if (typeof text !== 'string') {
    throw new Error('text must be a string');
  }

  const normalizedText = text.trim();

  return normalizedText.length > 0 ? normalizedText : null;
}

export async function submitDareProofService({
  dareId,
  userId,
  mediaType,
  fileUrl,
  durationSeconds,
  text,
}: SubmitDareProofInput) {
  if (!userId) {
    throw new Error('Não autorizado');
  }

  if (!dareId) {
    throw new Error('Dare não encontrado');
  }

  const normalizedMediaType = normalizeMediaType(mediaType);
  const normalizedFileUrl = normalizeFileUrl(fileUrl);
  const normalizedDurationSeconds = normalizeDurationSeconds(durationSeconds);
  const normalizedText = normalizeText(text);

  const dare = await prisma.dare.findUnique({
    where: {
      id: dareId,
    },
    select: {
      id: true,
      targetUserId: true,
      completedAt: true,
      expiresAt: true,
      attemptsUsed: true,
      maxAttempts: true,
    },
  });

  if (!dare) {
    throw new Error('Dare não encontrado');
  }

  if (dare.targetUserId !== userId) {
    throw new Error('Você não pode enviar prova para este dare');
  }

  if (dare.completedAt) {
    throw new Error('Dare já concluído');
  }

  if (dare.maxAttempts !== null && dare.attemptsUsed >= dare.maxAttempts) {
    throw new Error('Dare sem tentativas disponíveis');
  }

  if (dare.expiresAt && new Date() > dare.expiresAt) {
    throw new Error('Dare expirado');
  }

  const now = new Date();

  const proof = await prisma.$transaction(async (tx) => {
    const createdProof = await tx.dareProof.create({
      data: {
        dareId,
        userId,
        mediaType: normalizedMediaType,
        fileUrl: normalizedFileUrl,
        durationSeconds: normalizedDurationSeconds,
        text: normalizedText,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        dare: {
          select: {
            id: true,
            content: true,
            completedAt: true,
            targetUserId: true,
            authorId: true,
          },
        },
      },
    });

    await tx.dare.update({
      where: {
        id: dareId,
      },
      data: {
        completedAt: now,
      },
    });

    return createdProof;
  });

  return proof;
}