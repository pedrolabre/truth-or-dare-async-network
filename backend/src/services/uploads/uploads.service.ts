import { getSupabaseAdminClient } from '../../lib/supabase';
import { assertUploadPermission } from './upload-permissions';
import { buildUploadStoragePath } from './upload-paths';
import {
  SignUploadInput,
  UploadServiceError,
  UploadUsage,
  validateSignUploadInput,
} from './upload-validators';

export type { UploadUsage };

export type SignedUploadResult = {
  bucket: string;
  path: string;
  signedUrl: string;
  token: string;
  publicUrl: string | null;
};

function getStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
}

function isPublicStorageEnabled() {
  return process.env.SUPABASE_STORAGE_PUBLIC === 'true';
}

function getSupabaseClientForUploads() {
  try {
    return getSupabaseAdminClient();
  } catch {
    throw new UploadServiceError(
      'Storage do Supabase nao configurado no backend',
      500,
    );
  }
}

export async function signUploadUrlService(
  userId: string,
  input: SignUploadInput,
): Promise<SignedUploadResult> {
  const normalizedInput = validateSignUploadInput(input);

  await assertUploadPermission(userId, normalizedInput);

  const supabase = getSupabaseClientForUploads();
  const bucket = getStorageBucket();
  const path = buildUploadStoragePath({
    userId,
    canonicalUsage: normalizedInput.canonicalUsage,
    entityId: normalizedInput.entityId,
    fileName: normalizedInput.fileName,
  });

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path, {
      upsert: false,
    });

  if (error || !data) {
    throw new UploadServiceError(
      'Nao foi possivel assinar o upload no Storage. Verifique bucket, permissao e configuracao do Supabase.',
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
