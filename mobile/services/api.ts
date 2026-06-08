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
  SearchApiClubsResponse,
  SearchApiContentResponse,
  SearchApiResponse,
  SearchApiUsersResponse,
  SearchClubItem,
  SearchContentItem,
  SearchFilters,
  SearchPagination,
  SearchRecommendedResponse,
  SearchResultGroup,
  SearchTrendingResponse,
  SearchUserItem,
} from '../types/search';
import type { PublicUserProfile } from '../types/user';
import type { DareProofDetailsResponse } from '../types/proof';
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
import type {
  AppInfo,
  ChangeEmailPayload,
  ChangePasswordPayload,
  DeleteAccountPayload,
  ReportAbusePayload,
  ReportAbuseResponse,
  RevokeUserSessionsResponse,
  UpdateAccountPayload,
  UpdateUserPreferencesPayload,
  UserAccountData,
  UserPreferencesResponse,
  UserSessionsResponse,
} from '../types/settings';
import {
  mapApiClubToItem,
  mapApiContentToItem,
  mapApiUserToItem,
} from './searchMappers';

type SignupInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
  deviceName?: string;
  platform?: string;
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

function buildSearchUrl(
  baseUrl: string,
  endpoint: string,
  params: {
    query?: string;
    cursor?: string | null;
    limit?: number;
    filters?: SearchFilters;
  } = {},
) {
  const searchParams = new URLSearchParams();

  if (params.query?.trim()) {
    searchParams.set('query', params.query.trim());
  }

  if (params.cursor?.trim()) {
    searchParams.set('cursor', params.cursor.trim());
  }

  if (typeof params.limit === 'number' && Number.isFinite(params.limit)) {
    searchParams.set('limit', String(params.limit));
  }

  if (
    typeof params.filters?.minLevel === 'number' &&
    Number.isFinite(params.filters.minLevel)
  ) {
    searchParams.set('minLevel', String(params.filters.minLevel));
  }

  if (
    typeof params.filters?.maxLevel === 'number' &&
    Number.isFinite(params.filters.maxLevel)
  ) {
    searchParams.set('maxLevel', String(params.filters.maxLevel));
  }

  if (params.filters?.onlineOnly) {
    searchParams.set('onlineOnly', 'true');
  }

  if (params.filters?.clubVisibility === 'public') {
    searchParams.set('clubVisibility', 'public');
  }

  if (params.filters?.clubTag?.trim()) {
    searchParams.set('clubTag', params.filters.clubTag.trim());
  }

  const queryString = searchParams.toString();

  return queryString
    ? `${baseUrl}${endpoint}?${queryString}`
    : `${baseUrl}${endpoint}`;
}

async function getAuthenticatedHeaders() {
  const token = await getToken();

  if (!token) {
    throw new Error('Token nÃ£o encontrado');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function mapSearchUsersResponse(
  response: SearchApiUsersResponse,
): SearchPagination<SearchUserItem> {
  return {
    items: response.items.map(mapApiUserToItem),
    nextCursor: response.nextCursor ?? null,
  };
}

function mapSearchClubsResponse(
  response: SearchApiClubsResponse,
): SearchPagination<SearchClubItem> {
  return {
    items: response.items.map(mapApiClubToItem),
    nextCursor: response.nextCursor ?? null,
  };
}

function mapSearchContentResponse(
  response: SearchApiContentResponse,
): SearchPagination<SearchContentItem> {
  return {
    items: response.items.map(mapApiContentToItem),
    nextCursor: response.nextCursor ?? null,
  };
}

export async function searchAll(
  query: string,
  limit?: number,
  signal?: AbortSignal,
  filters?: SearchFilters,
): Promise<SearchResultGroup> {
  const baseUrl = getApiUrl();
  const headers = await getAuthenticatedHeaders();
  const url = buildSearchUrl(baseUrl, '/search', { query, limit, filters });

  const response = await fetch(url, {
    method: 'GET',
    headers,
    signal,
  });
  const data = (await parseResponse(response)) as SearchApiResponse;

  return {
    users: data.users.items.map(mapApiUserToItem),
    clubs: data.clubs.items.map(mapApiClubToItem),
    content: data.content.items.map(mapApiContentToItem),
  };
}

export async function searchUsers(
  query: string,
  cursor?: string | null,
  limit?: number,
  signal?: AbortSignal,
  filters?: SearchFilters,
): Promise<SearchPagination<SearchUserItem>> {
  const baseUrl = getApiUrl();
  const headers = await getAuthenticatedHeaders();
  const url = buildSearchUrl(baseUrl, '/search/users', {
    query,
    cursor,
    limit,
    filters,
  });

  const response = await fetch(url, {
    method: 'GET',
    headers,
    signal,
  });
  const data = (await parseResponse(response)) as SearchApiUsersResponse;

  return mapSearchUsersResponse(data);
}

export async function searchClubs(
  query: string,
  cursor?: string | null,
  limit?: number,
  signal?: AbortSignal,
  filters?: SearchFilters,
): Promise<SearchPagination<SearchClubItem>> {
  const baseUrl = getApiUrl();
  const headers = await getAuthenticatedHeaders();
  const url = buildSearchUrl(baseUrl, '/search/clubs', {
    query,
    cursor,
    limit,
    filters,
  });

  const response = await fetch(url, {
    method: 'GET',
    headers,
    signal,
  });
  const data = (await parseResponse(response)) as SearchApiClubsResponse;

  return mapSearchClubsResponse(data);
}

export async function searchContent(
  query: string,
  cursor?: string | null,
  limit?: number,
  signal?: AbortSignal,
): Promise<SearchPagination<SearchContentItem>> {
  const baseUrl = getApiUrl();
  const headers = await getAuthenticatedHeaders();
  const url = buildSearchUrl(baseUrl, '/search/content', {
    query,
    cursor,
    limit,
  });

  const response = await fetch(url, {
    method: 'GET',
    headers,
    signal,
  });
  const data = (await parseResponse(response)) as SearchApiContentResponse;

  return mapSearchContentResponse(data);
}

export async function getRecommendedUsers(): Promise<SearchUserItem[]> {
  const baseUrl = getApiUrl();
  const headers = await getAuthenticatedHeaders();

  const response = await fetch(`${baseUrl}/search/recommended/users`, {
    method: 'GET',
    headers,
  });
  const data = (await parseResponse(response)) as SearchRecommendedResponse;

  return data.map(mapApiUserToItem);
}

export async function getTrendingClubs(): Promise<SearchClubItem[]> {
  const baseUrl = getApiUrl();
  const headers = await getAuthenticatedHeaders();

  const response = await fetch(`${baseUrl}/search/trending/clubs`, {
    method: 'GET',
    headers,
  });
  const data = (await parseResponse(response)) as SearchTrendingResponse;

  return data.map(mapApiClubToItem);
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
  avatarUrl: string | null;
  isPrivate: boolean;
  createdAt: string;
  createdTruthsCount: number;
  createdDaresCount: number;
  stats: {
    createdTruthsCount: number;
    createdDaresCount: number;
    activePublicClubsCount: number;
    publishedClubPromptsCount: number;
  };
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

export async function getPublicUserProfile(
  userId: string,
): Promise<PublicUserProfile> {
  const baseUrl = getApiUrl();

  const response = await fetch(`${baseUrl}/users/${userId}/public`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return parseResponse(response);
}

type UpdateMyProfileInput = {
  name?: string;
  username?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
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

export async function getMe(): Promise<UserAccountData> {
  const baseUrl = getApiUrl();
  const headers = await getAuthenticatedHeaders();

  const response = await fetch(`${baseUrl}/users/me`, {
    method: 'GET',
    headers,
  });

  return parseResponse(response);
}

export async function getAppInfo(): Promise<AppInfo> {
  const baseUrl = getApiUrl();

  const response = await fetch(`${baseUrl}/app-info`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return parseResponse(response);
}

export async function updateMe(
  payload: UpdateAccountPayload,
): Promise<UserAccountData> {
  const baseUrl = getApiUrl();
  const headers = await getAuthenticatedHeaders();

  const response = await fetch(`${baseUrl}/users/me`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function getUserPreferences(): Promise<UserPreferencesResponse> {
  const baseUrl = getApiUrl();
  const headers = await getAuthenticatedHeaders();

  const response = await fetch(`${baseUrl}/users/me/preferences`, {
    method: 'GET',
    headers,
  });

  return parseResponse(response);
}

export async function updateUserPreferences(
  payload: UpdateUserPreferencesPayload,
): Promise<UserPreferencesResponse> {
  const baseUrl = getApiUrl();
  const headers = await getAuthenticatedHeaders();

  const response = await fetch(`${baseUrl}/users/me/preferences`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      preferences: payload,
    }),
  });

  return parseResponse(response);
}

export async function getUserSessions(): Promise<UserSessionsResponse> {
  const baseUrl = getApiUrl();
  const headers = await getAuthenticatedHeaders();

  const response = await fetch(`${baseUrl}/users/me/sessions`, {
    method: 'GET',
    headers,
  });

  return parseResponse(response);
}

export async function revokeUserSession(
  sessionId: string,
): Promise<RevokeUserSessionsResponse> {
  const baseUrl = getApiUrl();
  const headers = await getAuthenticatedHeaders();

  const response = await fetch(`${baseUrl}/users/me/sessions/${sessionId}`, {
    method: 'DELETE',
    headers,
  });

  return parseResponse(response);
}

export async function revokeOtherUserSessions(): Promise<RevokeUserSessionsResponse> {
  const baseUrl = getApiUrl();
  const headers = await getAuthenticatedHeaders();

  const response = await fetch(`${baseUrl}/users/me/sessions`, {
    method: 'DELETE',
    headers,
  });

  return parseResponse(response);
}

export async function changeEmail(payload: ChangeEmailPayload) {
  const baseUrl = getApiUrl();
  const headers = await getAuthenticatedHeaders();

  const response = await fetch(`${baseUrl}/auth/change-email`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function changePassword(payload: ChangePasswordPayload) {
  const baseUrl = getApiUrl();
  const headers = await getAuthenticatedHeaders();

  const response = await fetch(`${baseUrl}/auth/change-password`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function reportAbuse(
  payload: ReportAbusePayload,
): Promise<ReportAbuseResponse> {
  const baseUrl = getApiUrl();
  const headers = await getAuthenticatedHeaders();

  const response = await fetch(`${baseUrl}/support/report-abuse`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function deleteAccount(payload: DeleteAccountPayload) {
  const baseUrl = getApiUrl();
  const headers = await getAuthenticatedHeaders();

  const response = await fetch(`${baseUrl}/users/me`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify(payload),
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

export async function getDareProof(
  proofId: string,
): Promise<DareProofDetailsResponse> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token nÃ£o encontrado');
  }

  const response = await fetch(
    `${baseUrl}/dares/proofs/${encodeURIComponent(proofId)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    try {
      await parseResponse(response);
    } catch (error) {
      throw Object.assign(
        error instanceof Error
          ? error
          : new Error(`Erro na requisicao (${response.status})`),
        { status: response.status },
      );
    }

    throw Object.assign(
      new Error(`Erro na requisicao (${response.status})`),
      { status: response.status },
    );
  }

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
