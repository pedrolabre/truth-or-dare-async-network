import { getApiUrl, getToken, parseResponse } from './api';
import type {
  ListNotificationsQuery,
  ListNotificationsResponse,
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
  UnreadNotificationsCount,
} from '../types/notifications';

async function getAuthHeaders() {
  const token = await getToken();

  if (!token) {
    throw new Error('Token nao encontrado');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function listNotifications(
  query: ListNotificationsQuery = {},
): Promise<ListNotificationsResponse> {
  const baseUrl = getApiUrl();
  const searchParams = new URLSearchParams();

  if (query.limit) {
    searchParams.set('limit', String(query.limit));
  }

  if (query.cursor) {
    searchParams.set('cursor', query.cursor);
  }

  if (typeof query.read === 'boolean') {
    searchParams.set('read', String(query.read));
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `${baseUrl}/notifications?${queryString}`
    : `${baseUrl}/notifications`;

  const response = await fetch(url, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  return parseResponse(response);
}

export async function getUnreadNotificationsCount(): Promise<UnreadNotificationsCount> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/notifications/unread-count`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  return parseResponse(response);
}

export async function markNotificationRead(
  notificationId: string,
): Promise<MarkNotificationReadResponse> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
  });

  return parseResponse(response);
}

export async function markAllNotificationsRead(): Promise<MarkAllNotificationsReadResponse> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/notifications/read-all`, {
    method: 'POST',
    headers: await getAuthHeaders(),
  });

  return parseResponse(response);
}
