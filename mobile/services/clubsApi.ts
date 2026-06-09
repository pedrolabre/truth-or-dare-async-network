import { getApiUrl, getToken, parseResponse } from './api';
import { LOCAL_CACHE_KEYS, removeCache } from './cache';
import type {
  ClubAuditLogsApi,
  ClubAuditLogsQueryApi,
  ClubDetailsApi,
  ClubFeedApi,
  ClubFeedOrderApi,
  ClubFeedQueryApi,
  ClubFeedSeenApi,
  ClubInviteApi,
  ClubJoinRequestApi,
  ClubMemberApi,
  ClubMembersApi,
  ClubMembersQueryApi,
  ClubPromptApi,
  ClubPromptResponseApi,
  ClubReportApi,
  ClubSummaryApi,
  CreateClubReportPayloadApi,
  CreateClubPromptPayloadApi,
  CreateClubPromptResponsePayloadApi,
  CreateClubPayloadApi,
  CreateClubResponseApi,
  DiscoverClubsApi,
  SuspendClubMemberPostingPayloadApi,
  UpdateClubPayloadApi,
} from '../types/clubsApi';

export class ClubsApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ClubsApiError';
    this.status = status;
  }
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error && error.message
    ? error.message
    : fallbackMessage;
}

async function safelyRunCacheOperation(operation: () => Promise<unknown>) {
  try {
    await operation();
  } catch {
    // Cache local e apenas uma otimizacao; falhas nele nao devem quebrar a API.
  }
}

async function invalidateClubOverviewCache(clubId?: string | null) {
  await safelyRunCacheOperation(async () => {
    await Promise.all([
      removeCache(LOCAL_CACHE_KEYS.clubsMy),
      removeCache(LOCAL_CACHE_KEYS.clubsDiscover),
      clubId ? removeCache(LOCAL_CACHE_KEYS.clubDetails(clubId)) : Promise.resolve(),
    ]);
  });
}

async function invalidateClubFeedCache(clubId: string) {
  await safelyRunCacheOperation(() =>
    removeCache(LOCAL_CACHE_KEYS.clubFeed(clubId)),
  );
}

function appendOptionalSearchParam(
  searchParams: URLSearchParams,
  key: string,
  value: string | null | undefined,
) {
  const normalizedValue = value?.trim();

  if (normalizedValue) {
    searchParams.set(key, normalizedValue);
  }
}

function buildClubAuditLogsUrl(
  baseUrl: string,
  clubId: string,
  query: ClubAuditLogsQueryApi,
) {
  const searchParams = new URLSearchParams();

  if (typeof query.limit === 'number' && Number.isFinite(query.limit)) {
    searchParams.set('limit', String(query.limit));
  }

  appendOptionalSearchParam(searchParams, 'cursor', query.cursor);
  appendOptionalSearchParam(searchParams, 'action', query.action);
  appendOptionalSearchParam(searchParams, 'targetUserId', query.targetUserId);
  appendOptionalSearchParam(searchParams, 'entityType', query.entityType);
  appendOptionalSearchParam(searchParams, 'from', query.from);
  appendOptionalSearchParam(searchParams, 'to', query.to);

  const queryString = searchParams.toString();

  return queryString
    ? `${baseUrl}/clubs/${clubId}/audit-logs?${queryString}`
    : `${baseUrl}/clubs/${clubId}/audit-logs`;
}

export async function createClub(
  payload: CreateClubPayloadApi,
): Promise<CreateClubResponseApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token nao encontrado');
  }

  const response = await fetch(`${baseUrl}/clubs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const createdClub = await parseResponse(response);

  await invalidateClubOverviewCache(createdClub.id);

  return createdClub;
}

export async function getMyClubs(): Promise<ClubSummaryApi[]> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/clubs/my`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
}

export async function discoverClubs(): Promise<DiscoverClubsApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/clubs/discover`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
}

export async function searchClubs(query: string): Promise<ClubSummaryApi[]> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const searchParams = new URLSearchParams();
  searchParams.set('query', query.trim());

  const response = await fetch(
    `${baseUrl}/clubs/search?${searchParams.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return parseResponse(response);
}

export async function getClubDetails(
  clubId: string,
): Promise<ClubDetailsApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/clubs/${clubId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    try {
      await parseResponse(response);
    } catch (error) {
      throw new ClubsApiError(
        response.status,
        getErrorMessage(error, `Erro na requisicao (${response.status})`),
      );
    }

    throw new ClubsApiError(
      response.status,
      `Erro na requisicao (${response.status})`,
    );
  }

  return parseResponse(response);
}

export async function getClubMembers(
  clubId: string,
  query: ClubMembersQueryApi = {},
): Promise<ClubMembersApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token nao encontrado');
  }

  const searchParams = new URLSearchParams();

  if (query.page) {
    searchParams.set('page', String(query.page));
  }

  if (query.limit) {
    searchParams.set('limit', String(query.limit));
  }

  if (query.role) {
    searchParams.set('role', query.role);
  }

  if (query.status) {
    searchParams.set('status', query.status);
  }

  if (query.search?.trim()) {
    searchParams.set('search', query.search.trim());
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `${baseUrl}/clubs/${clubId}/members?${queryString}`
    : `${baseUrl}/clubs/${clubId}/members`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    try {
      await parseResponse(response);
    } catch (error) {
      throw new ClubsApiError(
        response.status,
        getErrorMessage(error, `Erro na requisicao (${response.status})`),
      );
    }

    throw new ClubsApiError(
      response.status,
      `Erro na requisicao (${response.status})`,
    );
  }

  return parseResponse(response);
}

export async function getClubAuditLogs(
  clubId: string,
  query: ClubAuditLogsQueryApi = {},
): Promise<ClubAuditLogsApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token nao encontrado');
  }

  const response = await fetch(buildClubAuditLogsUrl(baseUrl, clubId, query), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    try {
      await parseResponse(response);
    } catch (error) {
      throw new ClubsApiError(
        response.status,
        getErrorMessage(error, `Erro na requisicao (${response.status})`),
      );
    }

    throw new ClubsApiError(
      response.status,
      `Erro na requisicao (${response.status})`,
    );
  }

  return parseResponse(response);
}

export async function joinClub(clubId: string): Promise<ClubMemberApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/clubs/${clubId}/join`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
}

export async function requestClubJoin(
  clubId: string,
  message?: string | null,
): Promise<ClubJoinRequestApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token nao encontrado');
  }

  const response = await fetch(`${baseUrl}/clubs/${clubId}/join-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      message: message?.trim() ? message.trim() : null,
    }),
  });

  return parseResponse(response);
}

export async function leaveClub(clubId: string): Promise<ClubMemberApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/clubs/${clubId}/leave`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
}

export async function muteClub(clubId: string): Promise<ClubMemberApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token nao encontrado');
  }

  const response = await fetch(`${baseUrl}/clubs/${clubId}/mute`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
}

export async function unmuteClub(clubId: string): Promise<ClubMemberApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token nao encontrado');
  }

  const response = await fetch(`${baseUrl}/clubs/${clubId}/unmute`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
}

export async function inviteClubUser(
  clubId: string,
  userId: string,
  message?: string | null,
): Promise<ClubInviteApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token nao encontrado');
  }

  const response = await fetch(`${baseUrl}/clubs/${clubId}/invites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      userId,
      message: message?.trim() ? message.trim() : null,
    }),
  });

  return parseResponse(response);
}

export async function updateClub(
  clubId: string,
  payload: UpdateClubPayloadApi,
): Promise<ClubDetailsApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token nao encontrado');
  }

  const response = await fetch(`${baseUrl}/clubs/${clubId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const updatedClub = await parseResponse(response);

  await invalidateClubOverviewCache(clubId);

  return updatedClub;
}

export async function createClubPrompt(
  clubId: string,
  payload: CreateClubPromptPayloadApi,
): Promise<ClubPromptApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token nao encontrado');
  }

  const response = await fetch(`${baseUrl}/clubs/${clubId}/prompts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const prompt = await parseResponse(response);

  await invalidateClubFeedCache(clubId);

  return prompt;
}

export async function getClubFeed(
  clubId: string,
  order?: ClubFeedOrderApi,
  query: ClubFeedQueryApi = {},
): Promise<ClubFeedApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const searchParams = new URLSearchParams();

  if (order) {
    searchParams.set('order', order);
  }

  if (typeof query.limit === 'number' && Number.isFinite(query.limit)) {
    searchParams.set('limit', String(query.limit));
  }

  appendOptionalSearchParam(searchParams, 'cursor', query.cursor);

  const queryString = searchParams.toString();
  const url = queryString
    ? `${baseUrl}/clubs/${clubId}/feed?${queryString}`
    : `${baseUrl}/clubs/${clubId}/feed`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
}

export async function markClubFeedSeen(
  clubId: string,
): Promise<ClubFeedSeenApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token nao encontrado');
  }

  const response = await fetch(`${baseUrl}/clubs/${clubId}/feed/seen`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
}

export async function createClubPromptResponse(
  clubId: string,
  promptId: string,
  payload: CreateClubPromptResponsePayloadApi,
): Promise<ClubPromptResponseApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token nao encontrado');
  }

  const response = await fetch(
    `${baseUrl}/clubs/${clubId}/prompts/${promptId}/responses`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  const promptResponse = await parseResponse(response);

  await invalidateClubFeedCache(clubId);

  return promptResponse;
}

export async function reportClub(
  clubId: string,
  payload: CreateClubReportPayloadApi,
): Promise<ClubReportApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token nao encontrado');
  }

  const response = await fetch(`${baseUrl}/clubs/${clubId}/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function reportClubPrompt(
  clubId: string,
  promptId: string,
  payload: CreateClubReportPayloadApi,
): Promise<ClubReportApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token nao encontrado');
  }

  const response = await fetch(
    `${baseUrl}/clubs/${clubId}/prompts/${promptId}/report`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  return parseResponse(response);
}

export async function reportClubPromptResponse(
  clubId: string,
  promptId: string,
  responseId: string,
  payload: CreateClubReportPayloadApi,
): Promise<ClubReportApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token nao encontrado');
  }

  const response = await fetch(
    `${baseUrl}/clubs/${clubId}/prompts/${promptId}/responses/${responseId}/report`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  return parseResponse(response);
}

export async function reportClubPromptComment(
  clubId: string,
  promptId: string,
  commentId: string,
  payload: CreateClubReportPayloadApi,
): Promise<ClubReportApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token nao encontrado');
  }

  const response = await fetch(
    `${baseUrl}/clubs/${clubId}/prompts/${promptId}/comments/${commentId}/report`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  return parseResponse(response);
}

export async function blockClubMember(
  clubId: string,
  userId: string,
): Promise<ClubMemberApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token nao encontrado');
  }

  const response = await fetch(
    `${baseUrl}/clubs/${clubId}/members/${userId}/block`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return parseResponse(response);
}

export async function suspendClubMemberPosting(
  clubId: string,
  userId: string,
  payload: SuspendClubMemberPostingPayloadApi,
): Promise<ClubMemberApi> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token nao encontrado');
  }

  const response = await fetch(
    `${baseUrl}/clubs/${clubId}/members/${userId}/suspend-posting`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  return parseResponse(response);
}
