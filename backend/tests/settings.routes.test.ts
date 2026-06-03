import bcrypt from 'bcrypt';
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

describe('settings.routes', () => {
  applyTestDatabaseHooks();

  it('GET /users/me retorna contrato expandido sem remover campos existentes', async () => {
    const user = await createTestUser({
      name: 'Conta Completa',
      email: 'settings-get-me@test.com',
      username: 'settings_get_me',
    });

    const response = await request(app)
      .get('/users/me')
      .set('Authorization', getAuthorization(user));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: user.id,
      name: 'Conta Completa',
      email: 'settings-get-me@test.com',
      username: 'settings_get_me',
      bio: null,
      avatarUrl: null,
      isPrivate: false,
      createdAt: expect.any(String),
      createdTruthsCount: 0,
      createdDaresCount: 0,
      stats: {
        createdTruthsCount: 0,
        createdDaresCount: 0,
        activePublicClubsCount: 0,
        publishedClubPromptsCount: 0,
      },
    });
  });

  it('PUT /users/me continua disponivel para consumidores existentes', async () => {
    const user = await createTestUser({
      email: 'settings-put-me@test.com',
    });

    const response = await request(app)
      .put('/users/me')
      .set('Authorization', getAuthorization(user))
      .send({
        name: 'Perfil Atualizado pelo PUT',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: user.id,
      name: 'Perfil Atualizado pelo PUT',
      isPrivate: false,
    });
  });

  it('GET /users/me exige token valido', async () => {
    const response = await request(app).get('/users/me');

    expect(response.status).toBe(401);
  });

  it('PATCH /users/me atualiza somente campos enviados e e idempotente', async () => {
    const user = await createTestUser({
      name: 'Conta Original',
      email: 'settings-patch-me@test.com',
      username: 'settings_patch_original',
    });
    const authorization = getAuthorization(user);
    const payload = {
      name: '  Conta Atualizada  ',
      bio: '  Bio atualizada  ',
      isPrivate: true,
    };

    const firstResponse = await request(app)
      .patch('/users/me')
      .set('Authorization', authorization)
      .send(payload);
    const secondResponse = await request(app)
      .patch('/users/me')
      .set('Authorization', authorization)
      .send(payload);

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body).toEqual(firstResponse.body);
    expect(secondResponse.body).toMatchObject({
      id: user.id,
      name: 'Conta Atualizada',
      email: 'settings-patch-me@test.com',
      username: 'settings_patch_original',
      bio: 'Bio atualizada',
      isPrivate: true,
    });
  });

  it.each([
    [{ name: '' }, 'INVALID_NAME'],
    [{ username: 123 }, 'INVALID_USERNAME'],
    [{ bio: false }, 'INVALID_BIO'],
    [{ isPrivate: 'true' }, 'INVALID_IS_PRIVATE'],
    [{}, 'NO_FIELDS_TO_UPDATE'],
  ])(
    'PATCH /users/me rejeita campo invalido com codigo especifico',
    async (payload, code) => {
      const user = await createTestUser({
        email: `settings-patch-${code.toLowerCase()}@test.com`,
      });

      const response = await request(app)
        .patch('/users/me')
        .set('Authorization', getAuthorization(user))
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        code,
      });
    },
  );

  it('PATCH /users/me exige token valido', async () => {
    const response = await request(app)
      .patch('/users/me')
      .send({
        isPrivate: true,
      });

    expect(response.status).toBe(401);
  });

  it('DELETE /users/me marca deletedAt sem apagar fisicamente o usuario', async () => {
    const user = await createTestUser({
      email: 'settings-delete-account@test.com',
      password: 'senha-atual',
    });

    const response = await request(app)
      .delete('/users/me')
      .set('Authorization', getAuthorization(user))
      .send({
        currentPassword: 'senha-atual',
      });
    const deletedUser = await prisma.user.findUniqueOrThrow({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
    });
    expect(deletedUser).toEqual({
      id: user.id,
      deletedAt: expect.any(Date),
    });
  });

  it('DELETE /users/me rejeita payload sem senha atual', async () => {
    const user = await createTestUser({
      email: 'settings-delete-account-no-password@test.com',
      password: 'senha-atual',
    });

    const response = await request(app)
      .delete('/users/me')
      .set('Authorization', getAuthorization(user))
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'VALIDATION_ERROR',
      error: 'Senha atual e obrigatoria',
    });
  });

  it('DELETE /users/me rejeita senha atual incorreta', async () => {
    const user = await createTestUser({
      email: 'settings-delete-account-wrong-password@test.com',
      password: 'senha-atual',
    });

    const response = await request(app)
      .delete('/users/me')
      .set('Authorization', getAuthorization(user))
      .send({
        currentPassword: 'senha-incorreta',
      });
    const persistedUser = await prisma.user.findUniqueOrThrow({
      where: {
        id: user.id,
      },
      select: {
        deletedAt: true,
      },
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      code: 'INVALID_CURRENT_PASSWORD',
    });
    expect(persistedUser.deletedAt).toBeNull();
  });

  it('DELETE /users/me retorna USER_NOT_FOUND quando usuario ja foi deletado', async () => {
    const user = await createTestUser({
      email: 'settings-delete-account-already-deleted@test.com',
      password: 'senha-atual',
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
      .delete('/users/me')
      .set('Authorization', getAuthorization(user))
      .send({
        currentPassword: 'senha-atual',
      });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      code: 'USER_NOT_FOUND',
    });
  });

  it('DELETE /users/me exige token valido', async () => {
    const response = await request(app)
      .delete('/users/me')
      .send({
        currentPassword: 'senha-atual',
      });

    expect(response.status).toBe(401);
  });

  it('POST /auth/change-email altera e normaliza o e-mail', async () => {
    const user = await createTestUser({
      email: 'settings-change-email@test.com',
      password: 'senha-atual',
    });

    const response = await request(app)
      .post('/auth/change-email')
      .set('Authorization', getAuthorization(user))
      .send({
        newEmail: '  SETTINGS-CHANGED-EMAIL@TEST.COM  ',
        currentPassword: 'senha-atual',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: {
        id: user.id,
        email: 'settings-changed-email@test.com',
      },
    });
    await expect(
      prisma.user.findUnique({
        where: {
          id: user.id,
        },
        select: {
          email: true,
        },
      }),
    ).resolves.toEqual({
      email: 'settings-changed-email@test.com',
    });
  });

  it('POST /auth/change-email rejeita e-mail invalido', async () => {
    const user = await createTestUser({
      email: 'settings-invalid-email@test.com',
      password: 'senha-atual',
    });

    const response = await request(app)
      .post('/auth/change-email')
      .set('Authorization', getAuthorization(user))
      .send({
        newEmail: 'email-invalido',
        currentPassword: 'senha-atual',
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  it('POST /auth/change-email rejeita e-mail em uso', async () => {
    const user = await createTestUser({
      email: 'settings-duplicate-email-user@test.com',
      password: 'senha-atual',
    });
    await createTestUser({
      email: 'settings-duplicate-email-target@test.com',
    });

    const response = await request(app)
      .post('/auth/change-email')
      .set('Authorization', getAuthorization(user))
      .send({
        newEmail: 'settings-duplicate-email-target@test.com',
        currentPassword: 'senha-atual',
      });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      code: 'EMAIL_ALREADY_IN_USE',
    });
  });

  it('POST /auth/change-email rejeita senha atual incorreta', async () => {
    const user = await createTestUser({
      email: 'settings-email-password@test.com',
      password: 'senha-atual',
    });

    const response = await request(app)
      .post('/auth/change-email')
      .set('Authorization', getAuthorization(user))
      .send({
        newEmail: 'settings-email-password-new@test.com',
        currentPassword: 'senha-incorreta',
      });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      code: 'INVALID_CURRENT_PASSWORD',
    });
  });

  it('POST /auth/change-email exige token valido', async () => {
    const response = await request(app)
      .post('/auth/change-email')
      .send({
        newEmail: 'settings-email-no-token@test.com',
        currentPassword: 'senha-atual',
      });

    expect(response.status).toBe(401);
  });

  it('POST /auth/change-password altera a senha', async () => {
    const user = await createTestUser({
      email: 'settings-change-password@test.com',
      password: 'senha-atual',
    });

    const response = await request(app)
      .post('/auth/change-password')
      .set('Authorization', getAuthorization(user))
      .send({
        currentPassword: 'senha-atual',
        newPassword: 'senha-nova-segura',
      });
    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: {
        id: user.id,
      },
      select: {
        passwordHash: true,
      },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
    });
    await expect(
      bcrypt.compare('senha-nova-segura', updatedUser.passwordHash),
    ).resolves.toBe(true);
  });

  it('POST /auth/change-password rejeita senha atual incorreta', async () => {
    const user = await createTestUser({
      email: 'settings-password-current@test.com',
      password: 'senha-atual',
    });

    const response = await request(app)
      .post('/auth/change-password')
      .set('Authorization', getAuthorization(user))
      .send({
        currentPassword: 'senha-incorreta',
        newPassword: 'senha-nova-segura',
      });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      code: 'INVALID_CURRENT_PASSWORD',
    });
  });

  it('POST /auth/change-password rejeita senha nova fraca', async () => {
    const user = await createTestUser({
      email: 'settings-password-weak@test.com',
      password: 'senha-atual',
    });

    const response = await request(app)
      .post('/auth/change-password')
      .set('Authorization', getAuthorization(user))
      .send({
        currentPassword: 'senha-atual',
        newPassword: 'curta',
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'PASSWORD_TOO_WEAK',
    });
  });

  it('POST /auth/change-password rejeita senha nova igual a atual', async () => {
    const user = await createTestUser({
      email: 'settings-password-same@test.com',
      password: 'senha-atual',
    });

    const response = await request(app)
      .post('/auth/change-password')
      .set('Authorization', getAuthorization(user))
      .send({
        currentPassword: 'senha-atual',
        newPassword: 'senha-atual',
      });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      code: 'SAME_PASSWORD',
    });
  });

  it('POST /auth/change-password exige token valido', async () => {
    const response = await request(app)
      .post('/auth/change-password')
      .send({
        currentPassword: 'senha-atual',
        newPassword: 'senha-nova-segura',
      });

    expect(response.status).toBe(401);
  });

  it('retorna USER_NOT_FOUND quando o token aponta para usuario inexistente', async () => {
    const response = await request(app)
      .post('/auth/change-password')
      .set(
        'Authorization',
        getAuthorization({
          id: 'usuario-inexistente',
          name: 'Usuario Inexistente',
          email: 'settings-missing-user@test.com',
        }),
      )
      .send({
        currentPassword: 'senha-atual',
        newPassword: 'senha-nova-segura',
      });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      code: 'USER_NOT_FOUND',
    });
  });
});
