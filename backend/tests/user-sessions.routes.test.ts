import { randomUUID } from 'crypto';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import { createTestUser } from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { applyTestDatabaseHooks } from './test-db';

function getAuthorization(
  user: { id: string; email: string; name: string },
  sessionId?: string,
) {
  const token = generateToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    ...(sessionId ? { sessionId } : {}),
  });

  return `Bearer ${token}`;
}

async function createSession(
  userId: string,
  overrides: Record<string, unknown> = {},
) {
  const id = String(overrides.id ?? randomUUID());
  const deviceName = String(overrides.deviceName ?? 'Celular de Teste');
  const platform = String(overrides.platform ?? 'android');
  const ipAddress = String(overrides.ipAddress ?? '127.0.0.1');
  const lastActiveAt =
    overrides.lastActiveAt instanceof Date
      ? overrides.lastActiveAt
      : new Date('2026-06-02T12:00:00.000Z');
  const revokedAt =
    overrides.revokedAt instanceof Date ? overrides.revokedAt : null;
  const [session] = await prisma.$queryRaw<
    Array<{
      id: string;
      userId: string;
      deviceName: string | null;
      platform: string | null;
      ipAddress: string | null;
      lastActiveAt: Date;
      createdAt: Date;
      revokedAt: Date | null;
    }>
  >`
    INSERT INTO "UserSession" (
      "id",
      "userId",
      "deviceName",
      "platform",
      "ipAddress",
      "lastActiveAt",
      "revokedAt"
    )
    VALUES (
      ${id},
      ${userId},
      ${deviceName},
      ${platform},
      ${ipAddress},
      ${lastActiveAt},
      ${revokedAt}
    )
    RETURNING
      "id",
      "userId",
      "deviceName",
      "platform",
      "ipAddress",
      "lastActiveAt",
      "createdAt",
      "revokedAt"
  `;

  return session;
}

describe('user sessions routes', () => {
  applyTestDatabaseHooks();

  it('GET /users/me/sessions exige token valido', async () => {
    const response = await request(app).get('/users/me/sessions');

    expect(response.status).toBe(401);
  });

  it('GET /users/me/sessions lista apenas sessoes ativas do usuario autenticado', async () => {
    const user = await createTestUser({
      email: 'sessions-list-user@test.com',
    });
    const otherUser = await createTestUser({
      email: 'sessions-list-other@test.com',
    });
    const currentSession = await createSession(user.id, {
      deviceName: 'Notebook atual',
      platform: 'web',
      lastActiveAt: new Date('2026-06-02T15:00:00.000Z'),
    });
    const olderSession = await createSession(user.id, {
      deviceName: 'Android antigo',
      platform: 'android',
      lastActiveAt: new Date('2026-06-02T10:00:00.000Z'),
    });
    await createSession(user.id, {
      deviceName: 'Sessao revogada',
      revokedAt: new Date('2026-06-02T11:00:00.000Z'),
    });
    await createSession(otherUser.id, {
      deviceName: 'Sessao de outro usuario',
    });

    const response = await request(app)
      .get('/users/me/sessions')
      .set('Authorization', getAuthorization(user, currentSession.id));

    expect(response.status).toBe(200);
    expect(response.body.sessions).toEqual([
      expect.objectContaining({
        id: currentSession.id,
        userId: user.id,
        deviceName: 'Notebook atual',
        platform: 'web',
        isCurrent: true,
        revokedAt: null,
      }),
      expect.objectContaining({
        id: olderSession.id,
        userId: user.id,
        deviceName: 'Android antigo',
        platform: 'android',
        isCurrent: false,
        revokedAt: null,
      }),
    ]);
  });

  it('DELETE /users/me/sessions/:id revoga somente sessao do usuario autenticado', async () => {
    const user = await createTestUser({
      email: 'sessions-revoke-user@test.com',
    });
    const otherUser = await createTestUser({
      email: 'sessions-revoke-other@test.com',
    });
    const session = await createSession(user.id);
    const otherSession = await createSession(otherUser.id);

    const response = await request(app)
      .delete(`/users/me/sessions/${session.id}`)
      .set('Authorization', getAuthorization(user));
    const [revokedSession] = await prisma.$queryRaw<
      Array<{ revokedAt: Date | null }>
    >`
      SELECT "revokedAt"
      FROM "UserSession"
      WHERE "id" = ${session.id}
    `;
    const [untouchedSession] = await prisma.$queryRaw<
      Array<{ revokedAt: Date | null }>
    >`
      SELECT "revokedAt"
      FROM "UserSession"
      WHERE "id" = ${otherSession.id}
    `;

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
    });
    expect(revokedSession.revokedAt).toEqual(expect.any(Date));
    expect(untouchedSession.revokedAt).toBeNull();
  });

  it('DELETE /users/me/sessions/:id nao revoga sessao de outro usuario', async () => {
    const user = await createTestUser({
      email: 'sessions-foreign-user@test.com',
    });
    const otherUser = await createTestUser({
      email: 'sessions-foreign-other@test.com',
    });
    const otherSession = await createSession(otherUser.id);

    const response = await request(app)
      .delete(`/users/me/sessions/${otherSession.id}`)
      .set('Authorization', getAuthorization(user));
    const [untouchedSession] = await prisma.$queryRaw<
      Array<{ revokedAt: Date | null }>
    >`
      SELECT "revokedAt"
      FROM "UserSession"
      WHERE "id" = ${otherSession.id}
    `;

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      code: 'SESSION_NOT_FOUND',
    });
    expect(untouchedSession.revokedAt).toBeNull();
  });

  it('DELETE /users/me/sessions revoga todas as sessoes exceto a atual', async () => {
    const user = await createTestUser({
      email: 'sessions-revoke-all-user@test.com',
    });
    const otherUser = await createTestUser({
      email: 'sessions-revoke-all-other@test.com',
    });
    const currentSession = await createSession(user.id, {
      deviceName: 'Sessao atual',
    });
    const staleSession = await createSession(user.id, {
      deviceName: 'Sessao antiga',
    });
    const otherSession = await createSession(otherUser.id, {
      deviceName: 'Sessao externa',
    });

    const response = await request(app)
      .delete('/users/me/sessions')
      .set('Authorization', getAuthorization(user, currentSession.id));
    const sessions = await prisma.$queryRaw<
      Array<{ id: string; revokedAt: Date | null }>
    >`
      SELECT "id", "revokedAt"
      FROM "UserSession"
      WHERE "id" IN (${currentSession.id}, ${staleSession.id}, ${otherSession.id})
    `;

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      revokedCount: 1,
    });
    expect(
      sessions.find((session: any) => session.id === currentSession.id)
        ?.revokedAt,
    ).toBeNull();
    expect(
      sessions.find((session: any) => session.id === staleSession.id)
        ?.revokedAt,
    ).toEqual(expect.any(Date));
    expect(
      sessions.find((session: any) => session.id === otherSession.id)
        ?.revokedAt,
    ).toBeNull();
  });

  it('DELETE /users/me/sessions exige token valido', async () => {
    const response = await request(app).delete('/users/me/sessions');

    expect(response.status).toBe(401);
  });
});
