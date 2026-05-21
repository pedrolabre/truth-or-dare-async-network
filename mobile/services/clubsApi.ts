import { getApiUrl, getToken, parseResponse } from './api';
import type {
  ClubDetailsApi,
  ClubFeedApi,
  ClubFeedOrderApi,
  ClubMemberApi,
  ClubSummaryApi,
  CreateClubPayloadApi,
  CreateClubResponseApi,
  DiscoverClubsApi,
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

  return parseResponse(response);
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

export async function getClubFeed(
  clubId: string,
  order?: ClubFeedOrderApi,
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
