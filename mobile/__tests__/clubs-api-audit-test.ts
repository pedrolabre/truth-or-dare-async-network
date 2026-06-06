import AsyncStorage from '@react-native-async-storage/async-storage';

import { ClubsApiError, getClubAuditLogs } from '../services/clubsApi';

function makeJsonResponse(
  ok: boolean,
  status: number,
  body: Record<string, unknown>,
): Response {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn(),
  } as unknown as Response;
}

describe('clubs audit API client', () => {
  const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_URL = 'https://api.test';
    global.fetch = fetchMock;
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token-123');
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
  });

  it('busca auditoria do clube com token, cursor, limit e filtros', async () => {
    fetchMock.mockResolvedValue(
      makeJsonResponse(true, 200, {
        items: [
          {
            id: 'audit-1',
            action: 'club_member_role_updated',
            actorId: 'owner-1',
            targetUserId: 'member-1',
            entityType: 'club_member',
            entityId: 'membership-1',
            metadata: {
              previousRole: 'member',
              newRole: 'admin',
            },
            createdAt: '2026-06-06T12:00:00.000Z',
          },
        ],
        nextCursor: 'audit-1',
      }),
    );

    await expect(
      getClubAuditLogs('club-1', {
        limit: 10,
        cursor: 'cursor-1',
        action: 'club_member_role_updated',
        targetUserId: 'member-1',
        entityType: 'club_member',
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-06T23:59:59.000Z',
      }),
    ).resolves.toEqual({
      items: [
        expect.objectContaining({
          id: 'audit-1',
          action: 'club_member_role_updated',
        }),
      ],
      nextCursor: 'audit-1',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/clubs/club-1/audit-logs?limit=10&cursor=cursor-1&action=club_member_role_updated&targetUserId=member-1&entityType=club_member&from=2026-06-01T00%3A00%3A00.000Z&to=2026-06-06T23%3A59%3A59.000Z',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        },
      },
    );
  });

  it('omite filtros vazios e limit invalido', async () => {
    fetchMock.mockResolvedValue(
      makeJsonResponse(true, 200, {
        items: [],
        nextCursor: null,
      }),
    );

    await expect(
      getClubAuditLogs('club-1', {
        limit: Number.NaN,
        cursor: ' ',
        action: '',
        targetUserId: null,
        entityType: undefined,
      }),
    ).resolves.toEqual({
      items: [],
      nextCursor: null,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/clubs/club-1/audit-logs',
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });

  it('falha sem token salvo', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    await expect(getClubAuditLogs('club-1')).rejects.toThrow(
      'Token nao encontrado',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('preserva status do backend em ClubsApiError', async () => {
    fetchMock.mockResolvedValue(
      makeJsonResponse(false, 403, {
        error: 'Apenas owner ou admin podem consultar auditoria',
      }),
    );

    await expect(getClubAuditLogs('club-1')).rejects.toMatchObject({
      name: 'ClubsApiError',
      status: 403,
      message: 'Apenas owner ou admin podem consultar auditoria',
    } satisfies Partial<ClubsApiError>);
  });
});
