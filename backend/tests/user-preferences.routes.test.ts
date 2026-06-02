import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import { createTestUser } from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { applyTestDatabaseHooks } from './test-db';

function getAuthorization(user: { id: string; email: string; name: string }) {
  const token = generateToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });

  return `Bearer ${token}`;
}

describe('user-preferences.routes', () => {
  applyTestDatabaseHooks();

  it('GET /users/me/preferences retorna defaults quando nao ha preferencias persistidas', async () => {
    const user = await createTestUser({
      email: 'preferences-defaults@test.com',
    });

    const response = await request(app)
      .get('/users/me/preferences')
      .set('Authorization', getAuthorization(user));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      preferences: {
        themeMode: 'system',
        language: 'pt-BR',
        reduceMotion: false,
        largeText: false,
        highContrast: false,
      },
      items: [
        { key: 'themeMode', value: 'system', updatedAt: null },
        { key: 'language', value: 'pt-BR', updatedAt: null },
        { key: 'reduceMotion', value: false, updatedAt: null },
        { key: 'largeText', value: false, updatedAt: null },
        { key: 'highContrast', value: false, updatedAt: null },
      ],
    });
  });

  it('PUT /users/me/preferences atualiza preferencias em lote e retorna valores persistidos', async () => {
    const user = await createTestUser({
      email: 'preferences-update@test.com',
    });

    const response = await request(app)
      .put('/users/me/preferences')
      .set('Authorization', getAuthorization(user))
      .send({
        preferences: {
          themeMode: 'dark',
          reduceMotion: true,
          largeText: true,
          highContrast: false,
          language: 'pt-BR',
        },
      });
    const persistedPreferences = await prisma.userPreference.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        key: 'asc',
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.preferences).toEqual({
      themeMode: 'dark',
      language: 'pt-BR',
      reduceMotion: true,
      largeText: true,
      highContrast: false,
    });
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        {
          key: 'themeMode',
          value: 'dark',
          updatedAt: expect.any(String),
        },
        {
          key: 'reduceMotion',
          value: true,
          updatedAt: expect.any(String),
        },
      ]),
    );
    expect(persistedPreferences).toHaveLength(5);
    expect(
      persistedPreferences.map(({ key, value }) => ({ key, value })),
    ).toEqual([
      { key: 'highContrast', value: 'false' },
      { key: 'language', value: 'pt-BR' },
      { key: 'largeText', value: 'true' },
      { key: 'reduceMotion', value: 'true' },
      { key: 'themeMode', value: 'dark' },
    ]);
  });

  it('PUT /users/me/preferences preserva defaults para campos nao enviados', async () => {
    const user = await createTestUser({
      email: 'preferences-partial@test.com',
    });

    const response = await request(app)
      .put('/users/me/preferences')
      .set('Authorization', getAuthorization(user))
      .send({
        preferences: {
          themeMode: 'light',
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.preferences).toEqual({
      themeMode: 'light',
      language: 'pt-BR',
      reduceMotion: false,
      largeText: false,
      highContrast: false,
    });
  });

  it('GET /users/me/preferences isola preferencias por usuario autenticado', async () => {
    const firstUser = await createTestUser({
      email: 'preferences-first@test.com',
    });
    const secondUser = await createTestUser({
      email: 'preferences-second@test.com',
    });

    await request(app)
      .put('/users/me/preferences')
      .set('Authorization', getAuthorization(firstUser))
      .send({
        preferences: {
          themeMode: 'dark',
        },
      });

    const response = await request(app)
      .get('/users/me/preferences')
      .set('Authorization', getAuthorization(secondUser));

    expect(response.status).toBe(200);
    expect(response.body.preferences.themeMode).toBe('system');
  });

  it.each([
    [{ preferences: { invalidKey: 'dark' } }, 'INVALID_PREFERENCE_KEY'],
    [{ preferences: { themeMode: 'sepia' } }, 'INVALID_PREFERENCE_VALUE'],
    [{ preferences: { language: 'en-US' } }, 'INVALID_PREFERENCE_VALUE'],
    [{ preferences: { reduceMotion: 'true' } }, 'INVALID_PREFERENCE_VALUE'],
    [{ preferences: {} }, 'NO_FIELDS_TO_UPDATE'],
    [{}, 'NO_FIELDS_TO_UPDATE'],
  ])(
    'PUT /users/me/preferences rejeita payload invalido com codigo especifico',
    async (payload, code) => {
      const user = await createTestUser({
        email: `preferences-invalid-${code.toLowerCase()}@test.com`,
      });

      const response = await request(app)
        .put('/users/me/preferences')
        .set('Authorization', getAuthorization(user))
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        code,
      });
    },
  );

  it('GET /users/me/preferences exige token valido', async () => {
    const response = await request(app).get('/users/me/preferences');

    expect(response.status).toBe(401);
  });

  it('PUT /users/me/preferences exige token valido', async () => {
    const response = await request(app).put('/users/me/preferences').send({
      preferences: {
        themeMode: 'dark',
      },
    });

    expect(response.status).toBe(401);
  });

  it('GET /users/me/preferences rejeita usuario deletado', async () => {
    const user = await createTestUser({
      email: 'preferences-deleted@test.com',
    });

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    const response = await request(app)
      .get('/users/me/preferences')
      .set('Authorization', getAuthorization(user));

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      code: 'USER_NOT_FOUND',
    });
  });
});
