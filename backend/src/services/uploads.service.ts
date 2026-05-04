import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { getSupabaseAdminClient } from '../lib/supabase';

export type UploadUsage =
  | 'dare-proof'
  | 'profile-avatar'
  | 'group-avatar'
  | 'comment-attachment';

export type SignUploadInput = {
  usage: UploadUsage;
  entityId?: string | null;
  fileName: string;
  contentType: string;
};

export type SignedUploadResult = {
  bucket: string;
  path: string;
  signedUrl: string;
  token: string;
  publicUrl: string | null;
};

class UploadServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const ALLOWED_USAGES: UploadUsage[] = [
  'dare-proof',
  'profile-avatar',
  'group-avatar',
  'comment-attachment',
];

const MAX_FILE_NAME_LENGTH = 180;

const usageFolders: Record<UploadUsage, string> = {
  'dare-proof': 'dare-proofs',
  'profile-avatar': 'profile-avatars',
  'group-avatar': 'group-avatars',
  'comment-attachment': 'comment-attachments',
};

function getStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
}

function isPublicStorageEnabled() {
  return process.env.SUPABASE_STORAGE_PUBLIC === 'true';
}

function assertValidUsage(usage: string): asserts usage is UploadUsage {
  if (!ALLOWED_USAGES.includes(usage as UploadUsage)) {
    throw new UploadServiceError(
      'usage inválido. Use dare-proof, profile-avatar, group-avatar ou comment-attachment',
    );
  }
}

function assertValidContentType(contentType: string) {
  if (!contentType || typeof contentType !== 'string') {
    throw new UploadServiceError('contentType é obrigatório');
  }

  if (!contentType.includes('/')) {
    throw new UploadServiceError('contentType inválido');
  }
}

function sanitizeFileName(fileName: string) {
  if (!fileName || typeof fileName !== 'string') {
    throw new UploadServiceError('fileName é obrigatório');
  }

  const trimmedFileName = fileName.trim();

  if (!trimmedFileName) {
    throw new UploadServiceError('fileName é obrigatório');
  }

  const limitedFileName = trimmedFileName.slice(0, MAX_FILE_NAME_LENGTH);

  const sanitizedFileName = limitedFileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!sanitizedFileName) {
    return `upload-${randomUUID()}`;
  }

  return sanitizedFileName;
}

function buildStoragePath(input: {
  userId: string;
  usage: UploadUsage;
  entityId?: string | null;
  fileName: string;
}) {
  const folder = usageFolders[input.usage];
  const safeFileName = sanitizeFileName(input.fileName);
  const uniquePrefix = `${Date.now()}-${randomUUID()}`;

  if (input.entityId) {
    return `${folder}/${input.userId}/${input.entityId}/${uniquePrefix}-${safeFileName}`;
  }

  return `${folder}/${input.userId}/${uniquePrefix}-${safeFileName}`;
}

function assertEntityIdForUsage(usage: UploadUsage, entityId?: string | null) {
  if (
    (usage === 'dare-proof' ||
      usage === 'group-avatar' ||
      usage === 'comment-attachment') &&
    !entityId
  ) {
    throw new UploadServiceError(`entityId é obrigatório para ${usage}`);
  }
}

async function validateDareProofUpload(userId: string, entityId?: string | null) {
  if (!entityId) {
    throw new UploadServiceError('entityId é obrigatório para dare-proof');
  }

  const dare = await prisma.dare.findUnique({
    where: {
      id: entityId,
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
    throw new UploadServiceError('Dare não encontrado', 404);
  }

  if (dare.targetUserId !== userId) {
    throw new UploadServiceError(
      'Apenas o usuário desafiado pode enviar proof para este dare',
      403,
    );
  }

  if (dare.completedAt) {
    throw new UploadServiceError('Este dare já foi concluído', 409);
  }

  if (dare.expiresAt && dare.expiresAt.getTime() < Date.now()) {
    throw new UploadServiceError('Este dare está expirado', 409);
  }

  if (dare.attemptsUsed >= dare.maxAttempts) {
    throw new UploadServiceError(
      'Este dare não possui tentativas disponíveis',
      409,
    );
  }
}

export async function signUploadUrlService(
  userId: string,
  input: SignUploadInput,
): Promise<SignedUploadResult> {
  assertValidUsage(input.usage);
  assertValidContentType(input.contentType);
  assertEntityIdForUsage(input.usage, input.entityId);

  if (input.usage === 'dare-proof') {
    await validateDareProofUpload(userId, input.entityId);
  }

  const supabase = getSupabaseAdminClient();
  const bucket = getStorageBucket();

  const path = buildStoragePath({
    userId,
    usage: input.usage,
    entityId: input.entityId,
    fileName: input.fileName,
  });

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path, {
      upsert: false,
    });

  if (error || !data) {
    throw new UploadServiceError(
      error?.message || 'Não foi possível assinar o upload',
      500,
    );
  }

  const publicUrl = isPublicStorageEnabled()
    ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
    : null;

  return {
    bucket,
    path: data.path ?? path,
    signedUrl: data.signedUrl,
    token: data.token,
    publicUrl,
  };
}