import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  CreateTruthCommentPayload,
  CreateTruthCommentReportPayload,
  CreateTruthReportPayload,
  DeleteTruthCommentResponse,
  ToggleTruthCommentLikeResponse,
  TruthCommentApiItem,
  TruthCommentApiReply,
  TruthCommentReportApiResponse,
  TruthReportApiResponse,
  UpdateTruthCommentPayload,
} from '../types/comments';
import type { FeedItem } from '../types/feed';
import type {
  SubmitDareProofPayload,
  SubmitDareProofResponse,
} from '../types/action';
import type {
  AuthRecoveryBackendErrorResponse,
  AuthRecoveryNormalizedErrorCode,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  VerifyResetCodeResponse,
} from '../types/authRecovery';
import type { ToggleClubLikeApi } from '../types/clubsApi';

type SignupInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
};

type CreateChallengeInput = {
  content: string;
  targetUserId: string;
  maxAttempts?: number;
  expiresAt?: string | null;
};

export type ChallengeUser = {
  id: string;
  name: string;
  email: string;
};

const TOKEN_KEY = 'auth_token';
const AUTH_RECOVERY_KNOWN_ERROR_CODES = [
  'RATE_LIMIT_EXCEEDED',
  'INVALID_OR_EXPIRED_CODE',
  'CODE_MAX_ATTEMPTS_REACHED',
  'RESET_TOKEN_INVALID',
  'PASSWORD_TOO_WEAK',
  'SAME_PASSWORD',
  'VALIDATION_ERROR',
] as const;

const AUTH_RECOVERY_GENERIC_ERROR_MESSAGE =
  'Nao foi possivel concluir a recuperacao de senha.';

type AuthRecoveryKnownErrorCode =
  (typeof AUTH_RECOVERY_KNOWN_ERROR_CODES)[number];

type AuthRecoveryErrorInput = {
  code: AuthRecoveryNormalizedErrorCode;
  message: string;
  status?: number;
};

export class AuthRecoveryRequestError extends Error {
  code: AuthRecoveryNormalizedErrorCode;
  status?: number;

  constructor({ code, message, status }: AuthRecoveryErrorInput) {
    super(message);
    this.name = 'AuthRecoveryRequestError';
    this.code = code;
    this.status = status;
  }
}

function isAuthRecoveryKnownErrorCode(
  code: unknown,
): code is AuthRecoveryKnownErrorCode {
  return (
    typeof code === 'string' &&
    AUTH_RECOVERY_KNOWN_ERROR_CODES.includes(
      code as AuthRecoveryKnownErrorCode,
    )
  );
}

async function parseAuthRecoveryResponse<T>(response: Response): Promise<T> {
  let data: T | AuthRecoveryBackendErrorResponse | null = null;
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
    const errorData = data as AuthRecoveryBackendErrorResponse | null;
    const code = isAuthRecoveryKnownErrorCode(errorData?.code)
      ? errorData.code
      : 'UNKNOWN_ERROR';
    const backendMessage = errorData?.error || errorData?.message || text;
    const message =
      code === 'UNKNOWN_ERROR'
        ? AUTH_RECOVERY_GENERIC_ERROR_MESSAGE
        : backendMessage || AUTH_RECOVERY_GENERIC_ERROR_MESSAGE;

    throw new AuthRecoveryRequestError({
      code,
      message,
      status: response.status,
    });
  }

  return data as T;
}

export function getApiUrl() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error('EXPO_PUBLIC_API_URL não foi definida');
  }

  return apiUrl;
}

export async function parseResponse(response: Response) {
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

export async function saveToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function removeToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function signup(data: SignupInput) {
  const baseUrl = getApiUrl();

  const response = await fetch(`${baseUrl}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return parseResponse(response);
}

export async function login(data: LoginInput): Promise<LoginResponse> {
  const baseUrl = getApiUrl();

  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return parseResponse(response);
}

export async function requestPasswordReset(
  email: string,
): Promise<ForgotPasswordResponse> {
  const baseUrl = getApiUrl();

  const response = await fetch(`${baseUrl}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  return parseAuthRecoveryResponse<ForgotPasswordResponse>(response);
}

export async function verifyResetCode(
  email: string,
  code: string,
): Promise<VerifyResetCodeResponse> {
  const baseUrl = getApiUrl();

  const response = await fetch(`${baseUrl}/auth/verify-reset-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, code }),
  });

  return parseAuthRecoveryResponse<VerifyResetCodeResponse>(response);
}

export async function resetPassword(
  resetToken: string,
  newPassword: string,
): Promise<ResetPasswordResponse> {
  const baseUrl = getApiUrl();

  const response = await fetch(`${baseUrl}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resetToken, newPassword }),
  });

  return parseAuthRecoveryResponse<ResetPasswordResponse>(response);
}

export async function getFeed(): Promise<FeedItem[]> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/feed`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
}

export async function getUsers(query?: string): Promise<ChallengeUser[]> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const searchParams = new URLSearchParams();

  if (query?.trim()) {
    searchParams.set('query', query.trim());
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `${baseUrl}/users?${queryString}`
    : `${baseUrl}/users`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
}

export async function createTruth(data: CreateChallengeInput) {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/truths`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return parseResponse(response);
}

export async function createDare(data: CreateChallengeInput) {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/dares`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return parseResponse(response);
}

export async function deleteTruth(id: string) {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/truths/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
}

export async function deleteDare(id: string) {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/dares/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
}

export async function toggleLike(
  targetId: string,
  type: 'club',
): Promise<ToggleClubLikeApi>;
export async function toggleLike(
  targetId: string,
  type: 'truth' | 'dare',
): Promise<{ liked: boolean }>;
export async function toggleLike(
  targetId: string,
  type: 'truth' | 'dare' | 'club',
): Promise<{ liked: boolean } | ToggleClubLikeApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  let endpoint = '';

  if (type === 'truth') {
    endpoint = `/truths/${targetId}/like`;
  } else if (type === 'dare') {
    endpoint = `/dares/${targetId}/like`;
  } else {
    endpoint = `/clubs/${targetId}/like`;
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
}

export type MyProfileResponse = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  bio: string | null;
  createdTruthsCount: number;
  createdDaresCount: number;
};

export async function getMyProfile(): Promise<MyProfileResponse> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/users/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
}

type UpdateMyProfileInput = {
  name?: string;
  username?: string | null;
  bio?: string | null;
};

export async function updateMyProfile(
  data: UpdateMyProfileInput,
): Promise<MyProfileResponse> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/users/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return parseResponse(response);
}

export async function submitDareProof(
  dareId: string,
  payload: SubmitDareProofPayload,
): Promise<SubmitDareProofResponse> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/dares/${dareId}/proof`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function getTruthComments(
  truthId: string,
): Promise<TruthCommentApiItem[]> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/truths/${truthId}/comments`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
}

export async function createTruthComment(
  truthId: string,
  payload: CreateTruthCommentPayload,
): Promise<TruthCommentApiItem> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/truths/${truthId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function toggleTruthCommentLike(
  commentId: string,
): Promise<ToggleTruthCommentLikeResponse> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/truths/comments/${commentId}/like`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
}

export async function updateTruthComment(
  commentId: string,
  payload: UpdateTruthCommentPayload,
): Promise<TruthCommentApiItem | TruthCommentApiReply> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/truths/comments/${commentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function deleteTruthComment(
  commentId: string,
): Promise<DeleteTruthCommentResponse> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/truths/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
}

export async function reportTruthComment(
  commentId: string,
  payload: CreateTruthCommentReportPayload,
): Promise<TruthCommentReportApiResponse> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/truths/comments/${commentId}/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function reportTruth(
  truthId: string,
  payload: CreateTruthReportPayload,
): Promise<TruthReportApiResponse> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/truths/${truthId}/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}
