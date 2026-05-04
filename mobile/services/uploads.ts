import { getToken } from './api';

export type UploadUsage =
  | 'dare-proof'
  | 'profile-avatar'
  | 'group-avatar'
  | 'comment-attachment';

export type UploadAppFileInput = {
  localUri: string;
  fileName: string;
  mimeType: string;
  usage: UploadUsage;
  entityId?: string | null;
};

export type UploadAppFileResult = {
  bucket: string;
  path: string;
  fileUrl: string;
};

type SignedUploadResponse = {
  bucket: string;
  path: string;
  signedUrl: string;
  token: string;
  publicUrl: string | null;
};

function getApiUrl() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error('EXPO_PUBLIC_API_URL não foi definida');
  }

  return apiUrl;
}

async function parseUploadResponse(response: Response) {
  let data: any = null;
  let text = '';

  try {
    data = await response.json();
  } catch {
    try {
      text = await response.text();
    } catch {
      text = '';
    }
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      text ||
      `Erro na requisição (${response.status})`;

    throw new Error(message);
  }

  return data;
}

async function requestSignedUploadUrl(input: UploadAppFileInput) {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/uploads/sign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      usage: input.usage,
      entityId: input.entityId ?? null,
      fileName: input.fileName,
      contentType: input.mimeType,
    }),
  });

  return parseUploadResponse(response) as Promise<SignedUploadResponse>;
}

async function getFileBlob(localUri: string) {
  const response = await fetch(localUri);

  if (!response.ok) {
    throw new Error('Não foi possível ler o arquivo local selecionado.');
  }

  return response.blob();
}

async function uploadToSignedUrl(input: {
  signedUrl: string;
  token: string;
  blob: Blob;
}) {
  const response = await fetch(input.signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': input.blob.type || 'application/octet-stream',
      'x-upsert': 'false',
    },
    body: input.blob,
  });

  if (!response.ok) {
    let errorText = '';

    try {
      errorText = await response.text();
    } catch {
      errorText = '';
    }

    throw new Error(
      errorText || `Não foi possível enviar o arquivo (${response.status}).`,
    );
  }
}

export async function uploadAppFile(
  input: UploadAppFileInput,
): Promise<UploadAppFileResult> {
  const signedUpload = await requestSignedUploadUrl(input);
  const blob = await getFileBlob(input.localUri);

  await uploadToSignedUrl({
    signedUrl: signedUpload.signedUrl,
    token: signedUpload.token,
    blob,
  });

  const fileUrl = signedUpload.publicUrl ?? signedUpload.path;

  return {
    bucket: signedUpload.bucket,
    path: signedUpload.path,
    fileUrl,
  };
}