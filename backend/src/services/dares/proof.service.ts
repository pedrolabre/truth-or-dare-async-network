import { prisma } from '../../lib/prisma';
import { createNotification } from '../notifications.service';

type ProofMediaTypeValue = 'video' | 'audio' | 'file';

type DareProofDetailUser = {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
};

export type DareProofDetails = {
  id: string;
  dareId: string;
  userId: string;
  mediaType: ProofMediaTypeValue;
  fileUrl: string;
  durationSeconds: number | null;
  text: string | null;
  createdAt: string;
  author: DareProofDetailUser;
  dare: {
    id: string;
    content: string;
    authorId: string;
    targetUserId: string;
    completedAt: string | null;
  };
};

export class DareProofServiceError extends Error {
  constructor(
    public code: 'PROOF_NOT_FOUND' | 'PROOF_FORBIDDEN' | 'PROOF_UNAUTHENTICATED',
    message: string,
    public statusCode: number,
  ) {
    super(message);
  }
}

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

  const deepLink =
    `/proof-detail?proofId=${encodeURIComponent(proof.id)}` +
    `&dareId=${encodeURIComponent(proof.dare.id)}` +
    `&mediaType=${encodeURIComponent(proof.mediaType)}&source=backend`;

  await createNotification({
    userId: proof.dare.authorId,
    actorId: proof.userId,
    type: 'feed_dare_proof_submitted',
    title: 'Prova de desafio enviada',
    body: 'Um desafio que voce criou recebeu uma prova.',
    deepLink,
    referenceType: 'dare_proof',
    referenceId: proof.id,
    dedupeKey: `feed_dare_proof_submitted:${proof.dare.authorId}:${proof.id}`,
  });

  return proof;
}

export async function getDareProofDetailsService({
  proofId,
  userId,
}: {
  proofId: string;
  userId: string;
}): Promise<DareProofDetails> {
  if (!userId) {
    throw new DareProofServiceError(
      'PROOF_UNAUTHENTICATED',
      'Nao autorizado',
      401,
    );
  }

  if (!proofId) {
    throw new DareProofServiceError(
      'PROOF_NOT_FOUND',
      'Prova nao encontrada',
      404,
    );
  }

  const proof = await prisma.dareProof.findUnique({
    where: {
      id: proofId,
    },
    select: {
      id: true,
      dareId: true,
      userId: true,
      mediaType: true,
      fileUrl: true,
      durationSeconds: true,
      text: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
      dare: {
        select: {
          id: true,
          content: true,
          authorId: true,
          targetUserId: true,
          completedAt: true,
        },
      },
    },
  });

  if (!proof) {
    throw new DareProofServiceError(
      'PROOF_NOT_FOUND',
      'Prova nao encontrada',
      404,
    );
  }

  const canViewProof =
    proof.userId === userId ||
    proof.dare.authorId === userId ||
    proof.dare.targetUserId === userId;

  if (!canViewProof) {
    throw new DareProofServiceError(
      'PROOF_FORBIDDEN',
      'Sem permissao para ver esta prova',
      403,
    );
  }

  return {
    id: proof.id,
    dareId: proof.dareId,
    userId: proof.userId,
    mediaType: proof.mediaType,
    fileUrl: proof.fileUrl,
    durationSeconds: proof.durationSeconds,
    text: proof.text,
    createdAt: proof.createdAt.toISOString(),
    author: {
      id: proof.user.id,
      name: proof.user.name,
      username: proof.user.username,
      avatarUrl: proof.user.avatarUrl,
    },
    dare: {
      id: proof.dare.id,
      content: proof.dare.content,
      authorId: proof.dare.authorId,
      targetUserId: proof.dare.targetUserId,
      completedAt: proof.dare.completedAt?.toISOString() ?? null,
    },
  };
}
