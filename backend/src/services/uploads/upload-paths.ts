import { randomUUID } from 'crypto';
import {
  CanonicalUploadUsage,
  NormalizedUploadInput,
} from './upload-validators';

type BuildUploadStoragePathInput = Pick<
  NormalizedUploadInput,
  'canonicalUsage' | 'entityId' | 'fileName'
> & {
  userId: string;
};

const usageFolders: Record<CanonicalUploadUsage, string> = {
  'dare-proof': 'dare-proofs',
  'profile-avatar': 'profile-avatars',
  'club-avatar': 'club-avatars',
  'club-cover': 'club-covers',
  'comment-attachment': 'comment-attachments',
  'club-prompt-attachment': 'club-prompt-attachments',
  'club-response-attachment': 'club-response-attachments',
};

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildUniqueFileName(fileName: string) {
  const safeFileName = sanitizeFileName(fileName) || `upload-${randomUUID()}`;

  return `${Date.now()}-${randomUUID()}-${safeFileName}`;
}

export function buildUploadStoragePath(input: BuildUploadStoragePathInput) {
  const uniqueFileName = buildUniqueFileName(input.fileName);
  const folder = usageFolders[input.canonicalUsage];

  if (input.canonicalUsage === 'profile-avatar') {
    return `${folder}/${input.userId}/${uniqueFileName}`;
  }

  if (input.canonicalUsage === 'club-avatar' && input.entityId) {
    return `${folder}/${input.entityId}/${uniqueFileName}`;
  }

  if (input.canonicalUsage === 'club-cover' && input.entityId) {
    return `${folder}/${input.entityId}/${uniqueFileName}`;
  }

  if (input.canonicalUsage === 'dare-proof' && input.entityId) {
    return `${folder}/${input.userId}/${input.entityId}/${uniqueFileName}`;
  }

  if (input.entityId) {
    return `${folder}/${input.userId}/${input.entityId}/${uniqueFileName}`;
  }

  return `${folder}/${input.userId}/${uniqueFileName}`;
}
