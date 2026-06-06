export type UploadUsage =
  | 'dare-proof'
  | 'profile-avatar'
  | 'group-avatar'
  | 'club-avatar'
  | 'club-cover'
  | 'comment-attachment'
  | 'club-prompt-attachment'
  | 'club-response-attachment';

export type CanonicalUploadUsage = Exclude<UploadUsage, 'group-avatar'>;

export type UploadMediaKind = 'image' | 'video' | 'audio' | 'file';

export type SignUploadInput = {
  usage: unknown;
  entityId?: unknown;
  fileName: unknown;
  contentType: unknown;
  sizeBytes?: unknown;
};

export type NormalizedUploadInput = {
  usage: UploadUsage;
  canonicalUsage: CanonicalUploadUsage;
  entityId: string | null;
  fileName: string;
  contentType: string;
  sizeBytes: number | null;
  mediaKind: UploadMediaKind;
};

export class UploadServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const MB = 1024 * 1024;
const MAX_FILE_NAME_LENGTH = 180;

const ALLOWED_USAGES: UploadUsage[] = [
  'dare-proof',
  'profile-avatar',
  'group-avatar',
  'club-avatar',
  'club-cover',
  'comment-attachment',
  'club-prompt-attachment',
  'club-response-attachment',
];

const ENTITY_REQUIRED_USAGES: UploadUsage[] = [
  'dare-proof',
  'group-avatar',
  'club-avatar',
  'club-cover',
  'comment-attachment',
  'club-prompt-attachment',
  'club-response-attachment',
];

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const AUDIO_MIME_TYPES = [
  'audio/aac',
  'audio/m4a',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'audio/x-m4a',
];
const FILE_MIME_TYPES = [
  'application/msword',
  'application/octet-stream',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'text/plain',
];

const ALL_ATTACHMENT_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
  ...VIDEO_MIME_TYPES,
  ...AUDIO_MIME_TYPES,
  ...FILE_MIME_TYPES,
];

const AVATAR_MAX_SIZE_BYTES = 5 * MB;
const CLUB_COVER_MAX_SIZE_BYTES = 10 * MB;
const ATTACHMENT_MAX_SIZE_BYTES = 25 * MB;
const PROOF_VIDEO_MAX_SIZE_BYTES = 100 * MB;
const PROOF_DEFAULT_MAX_SIZE_BYTES = 25 * MB;

function normalizeUploadUsage(usage: unknown): UploadUsage {
  if (typeof usage !== 'string') {
    throw new UploadServiceError('usage e obrigatorio');
  }

  if (!ALLOWED_USAGES.includes(usage as UploadUsage)) {
    throw new UploadServiceError(
      'usage invalido. Use dare-proof, profile-avatar, group-avatar, club-avatar, club-cover, comment-attachment, club-prompt-attachment ou club-response-attachment',
    );
  }

  return usage as UploadUsage;
}

function getCanonicalUsage(usage: UploadUsage): CanonicalUploadUsage {
  return usage === 'group-avatar' ? 'club-avatar' : usage;
}

function normalizeEntityId(usage: UploadUsage, entityId: unknown) {
  if (entityId === undefined || entityId === null) {
    if (ENTITY_REQUIRED_USAGES.includes(usage)) {
      throw new UploadServiceError(`entityId e obrigatorio para ${usage}`);
    }

    return null;
  }

  if (typeof entityId !== 'string') {
    throw new UploadServiceError('entityId invalido');
  }

  const normalizedEntityId = entityId.trim();

  if (!normalizedEntityId && ENTITY_REQUIRED_USAGES.includes(usage)) {
    throw new UploadServiceError(`entityId e obrigatorio para ${usage}`);
  }

  return normalizedEntityId || null;
}

function normalizeContentType(contentType: unknown) {
  if (typeof contentType !== 'string') {
    throw new UploadServiceError('contentType e obrigatorio');
  }

  const normalizedContentType = contentType.split(';')[0]?.trim().toLowerCase();

  if (!normalizedContentType || !normalizedContentType.includes('/')) {
    throw new UploadServiceError('contentType invalido');
  }

  return normalizedContentType;
}

function assertMimeForUsage(
  canonicalUsage: CanonicalUploadUsage,
  contentType: string,
) {
  const allowedMimeTypes =
    canonicalUsage === 'profile-avatar' ||
    canonicalUsage === 'club-avatar' ||
    canonicalUsage === 'club-cover'
      ? IMAGE_MIME_TYPES
      : ALL_ATTACHMENT_MIME_TYPES;

  if (!allowedMimeTypes.includes(contentType)) {
    throw new UploadServiceError(
      `contentType nao permitido para ${canonicalUsage}`,
    );
  }
}

function normalizeFileName(fileName: unknown) {
  if (typeof fileName !== 'string') {
    throw new UploadServiceError('fileName e obrigatorio');
  }

  const normalizedFileName = fileName.trim();

  if (!normalizedFileName) {
    throw new UploadServiceError('fileName e obrigatorio');
  }

  if (normalizedFileName.length > MAX_FILE_NAME_LENGTH) {
    throw new UploadServiceError(
      `fileName deve ter no maximo ${MAX_FILE_NAME_LENGTH} caracteres`,
    );
  }

  if (
    normalizedFileName === '.' ||
    normalizedFileName === '..' ||
    normalizedFileName.includes('/') ||
    normalizedFileName.includes('\\') ||
    normalizedFileName.includes('\0')
  ) {
    throw new UploadServiceError('fileName invalido');
  }

  return normalizedFileName;
}

function normalizeSizeBytes(sizeBytes: unknown) {
  if (sizeBytes === undefined || sizeBytes === null) {
    return null;
  }

  if (
    typeof sizeBytes !== 'number' ||
    !Number.isInteger(sizeBytes) ||
    sizeBytes <= 0
  ) {
    throw new UploadServiceError('sizeBytes invalido');
  }

  return sizeBytes;
}

function getMediaKind(contentType: string): UploadMediaKind {
  if (IMAGE_MIME_TYPES.includes(contentType)) {
    return 'image';
  }

  if (VIDEO_MIME_TYPES.includes(contentType)) {
    return 'video';
  }

  if (AUDIO_MIME_TYPES.includes(contentType)) {
    return 'audio';
  }

  return 'file';
}

function getMaxSizeBytes(
  canonicalUsage: CanonicalUploadUsage,
  mediaKind: UploadMediaKind,
) {
  if (canonicalUsage === 'profile-avatar' || canonicalUsage === 'club-avatar') {
    return AVATAR_MAX_SIZE_BYTES;
  }

  if (canonicalUsage === 'club-cover') {
    return CLUB_COVER_MAX_SIZE_BYTES;
  }

  if (canonicalUsage === 'dare-proof') {
    return mediaKind === 'video'
      ? PROOF_VIDEO_MAX_SIZE_BYTES
      : PROOF_DEFAULT_MAX_SIZE_BYTES;
  }

  return ATTACHMENT_MAX_SIZE_BYTES;
}

function assertSizeForUsage(
  canonicalUsage: CanonicalUploadUsage,
  mediaKind: UploadMediaKind,
  sizeBytes: number | null,
) {
  if (sizeBytes === null) {
    return;
  }

  const maxSizeBytes = getMaxSizeBytes(canonicalUsage, mediaKind);

  if (sizeBytes > maxSizeBytes) {
    throw new UploadServiceError(
      `Arquivo excede o limite de ${Math.floor(maxSizeBytes / MB)} MB para ${canonicalUsage}`,
    );
  }
}

export function validateSignUploadInput(
  input: SignUploadInput,
): NormalizedUploadInput {
  const usage = normalizeUploadUsage(input.usage);
  const canonicalUsage = getCanonicalUsage(usage);
  const entityId = normalizeEntityId(usage, input.entityId);
  const fileName = normalizeFileName(input.fileName);
  const contentType = normalizeContentType(input.contentType);

  assertMimeForUsage(canonicalUsage, contentType);

  const sizeBytes = normalizeSizeBytes(input.sizeBytes);
  const mediaKind = getMediaKind(contentType);

  assertSizeForUsage(canonicalUsage, mediaKind, sizeBytes);

  return {
    usage,
    canonicalUsage,
    entityId,
    fileName,
    contentType,
    sizeBytes,
    mediaKind,
  };
}
