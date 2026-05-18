import { getApiUrl, getToken, parseResponse } from './api';
import type {
  ClubDetailsApi,
  ClubFeedApi,
  ClubFeedOrderApi,
  ClubMemberApi,
  ClubSummaryApi,
  DiscoverClubsApi,
} from '../types/clubsApi';

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