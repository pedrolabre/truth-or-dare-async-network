import express from 'express';
import request from 'supertest';
import daresRoutes from '../src/routes/dares.routes';
import { applyTestDatabaseHooks } from './test-db';
import { createTestUser } from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { prisma } from '../src/lib/prisma';

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use('/dares', daresRoutes);

  return app;
}

describe('POST /dares', () => {
  const app = createTestApp();

  applyTestDatabaseHooks({
    resetBeforeEach: true,
    resetAfterAll: true,
    disconnectAfterAll: true,
  });

  it('deve retornar 401 quando o token não for informado', async () => {
    const response = await request(app).post('/dares').send({
      content: 'Envie um áudio cantando o refrão da última música que ouviu.',
      targetUserId: 'target-user-id',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token não informado',
    });
  });

  it('deve retornar 401 quando o token estiver mal formatado', async () => {
    const response = await request(app)
      .post('/dares')
      .set('Authorization', 'Token abc123')
      .send({
        content: 'Envie um áudio cantando o refrão da última música que ouviu.',
        targetUserId: 'target-user-id',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token mal formatado',
    });
  });

  it('deve retornar 401 quando o token for inválido', async () => {
    const response = await request(app)
      .post('/dares')
      .set('Authorization', 'Bearer token-invalido')
      .send({
        content: 'Envie um áudio cantando o refrão da última música que ouviu.',
        targetUserId: 'target-user-id',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token inválido ou expirado',
    });
  });

  it('deve criar um dare real no banco para usuário autenticado com targetUserId persistido', async () => {
    const author = await createTestUser({
      name: 'Dare Author',
      email: 'dare-author@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Dare Target',
      email: 'dare-target@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: author.id,
      email: author.email,
      name: author.name,
    });

    const payload = {
      content: 'Grave um vídeo fazendo uma dança engraçada por 15 segundos.',
      targetUserId: targetUser.id,
    };

    const response = await request(app)
      .post('/dares')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      content: payload.content,
      authorId: author.id,
      targetUserId: targetUser.id,
      maxAttempts: expect.any(Number),
      attemptsUsed: 0,
      completedAt: null,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      author: {
        id: author.id,
        name: author.name,
        email: author.email,
      },
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
      },
    });

    const persistedDare = await prisma.dare.findUnique({
      where: {
        id: response.body.id,
      },
      include: {
        author: true,
        targetUser: true,
      },
    });

    expect(persistedDare).not.toBeNull();
    expect(persistedDare).toMatchObject({
      content: payload.content,
      authorId: author.id,
      targetUserId: targetUser.id,
      attemptsUsed: 0,
      completedAt: null,
      author: {
        id: author.id,
        name: author.name,
        email: author.email,
      },
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
      },
    });
  });

  it('deve criar um dare com maxAttempts e expiresAt customizados', async () => {
    const author = await createTestUser({
      name: 'Dare Config Author',
      email: 'dare-config-author@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Dare Config Target',
      email: 'dare-config-target@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: author.id,
      email: author.email,
      name: author.name,
    });

    const customExpiresAt = '2026-04-10T15:30:00.000Z';

    const response = await request(app)
      .post('/dares')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Faça uma imitação engraçada por 20 segundos.',
        targetUserId: targetUser.id,
        maxAttempts: 9,
        expiresAt: customExpiresAt,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      content: 'Faça uma imitação engraçada por 20 segundos.',
      authorId: author.id,
      targetUserId: targetUser.id,
      maxAttempts: 9,
      attemptsUsed: 0,
      completedAt: null,
      expiresAt: customExpiresAt,
    });

    const persistedDare = await prisma.dare.findUnique({
      where: {
        id: response.body.id,
      },
    });

    expect(persistedDare).not.toBeNull();
    expect(persistedDare).toMatchObject({
      content: 'Faça uma imitação engraçada por 20 segundos.',
      authorId: author.id,
      targetUserId: targetUser.id,
      maxAttempts: 9,
      attemptsUsed: 0,
      completedAt: null,
    });
    expect(persistedDare?.expiresAt?.toISOString()).toBe(customExpiresAt);
  });

  it('deve retornar 400 quando o targetUserId não for informado', async () => {
    const author = await createTestUser({
      name: 'Dare Missing Target',
      email: 'dare-missing-target@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: author.id,
      email: author.email,
      name: author.name,
    });

    const response = await request(app)
      .post('/dares')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Faça uma imitação engraçada por 20 segundos.',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'targetUserId is required',
    });

    const daresCount = await prisma.dare.count();

    expect(daresCount).toBe(0);
  });

  it('deve retornar 400 quando o conteúdo não for informado', async () => {
    const author = await createTestUser({
      name: 'Dare Empty Content',
      email: 'dare-empty-content@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Dare Empty Content Target',
      email: 'dare-empty-content-target@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: author.id,
      email: author.email,
      name: author.name,
    });

    const response = await request(app)
      .post('/dares')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: '   ',
        targetUserId: targetUser.id,
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'content is required',
    });

    const daresCount = await prisma.dare.count();

    expect(daresCount).toBe(0);
  });

  it('deve retornar 400 quando maxAttempts for inválido', async () => {
    const author = await createTestUser({
      name: 'Dare Invalid Attempts Author',
      email: 'dare-invalid-attempts-author@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Dare Invalid Attempts Target',
      email: 'dare-invalid-attempts-target@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: author.id,
      email: author.email,
      name: author.name,
    });

    const response = await request(app)
      .post('/dares')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Faça um desafio rápido.',
        targetUserId: targetUser.id,
        maxAttempts: 0,
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'maxAttempts must be a positive integer',
    });

    const daresCount = await prisma.dare.count();

    expect(daresCount).toBe(0);
  });

  it('deve retornar 400 quando expiresAt for inválido', async () => {
    const author = await createTestUser({
      name: 'Dare Invalid Date Author',
      email: 'dare-invalid-date-author@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Dare Invalid Date Target',
      email: 'dare-invalid-date-target@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: author.id,
      email: author.email,
      name: author.name,
    });

    const response = await request(app)
      .post('/dares')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Faça um desafio com data inválida.',
        targetUserId: targetUser.id,
        expiresAt: 'data-invalida',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'expiresAt must be a valid date',
    });

    const daresCount = await prisma.dare.count();

    expect(daresCount).toBe(0);
  });
});

describe('DELETE /dares/:id', () => {
  const app = createTestApp();

  applyTestDatabaseHooks({
    resetBeforeEach: true,
    resetAfterAll: true,
    disconnectAfterAll: true,
  });

  it('deve retornar 401 quando o token não for informado', async () => {
    const response = await request(app).delete('/dares/qualquer-id');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token não informado',
    });
  });

  it('deve retornar 401 quando o token estiver mal formatado', async () => {
    const response = await request(app)
      .delete('/dares/qualquer-id')
      .set('Authorization', 'Token abc123');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token mal formatado',
    });
  });

  it('deve retornar 401 quando o token for inválido', async () => {
    const response = await request(app)
      .delete('/dares/qualquer-id')
      .set('Authorization', 'Bearer token-invalido');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token inválido ou expirado',
    });
  });

  it('deve deletar um dare do próprio autor', async () => {
    const author = await createTestUser({
      name: 'Dare Delete Author',
      email: 'dare-delete-author@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Dare Delete Target',
      email: 'dare-delete-target@test.com',
      password: '123456',
    });

    const dare = await prisma.dare.create({
      data: {
        content: 'Dare que será deletado',
        authorId: author.id,
        targetUserId: targetUser.id,
        maxAttempts: 5,
        attemptsUsed: 0,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        completedAt: null,
      },
    });

    const token = generateToken({
      sub: author.id,
      email: author.email,
      name: author.name,
    });

    const response = await request(app)
      .delete(`/dares/${dare.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);

    const deletedDare = await prisma.dare.findUnique({
      where: {
        id: dare.id,
      },
    });

    expect(deletedDare).toBeNull();
  });

  it('deve retornar 400 quando o dare não existir', async () => {
    const author = await createTestUser({
      name: 'Dare Delete Missing',
      email: 'dare-delete-missing@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: author.id,
      email: author.email,
      name: author.name,
    });

    const response = await request(app)
      .delete('/dares/id-inexistente')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Dare não encontrado',
    });
  });

  it('deve retornar 400 quando o usuário tentar deletar dare de outro autor', async () => {
    const author = await createTestUser({
      name: 'Dare Original Author',
      email: 'dare-original-author@test.com',
      password: '123456',
    });

    const otherUser = await createTestUser({
      name: 'Dare Other User',
      email: 'dare-other-user@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Dare Protected Target',
      email: 'dare-protected-target@test.com',
      password: '123456',
    });

    const dare = await prisma.dare.create({
      data: {
        content: 'Dare protegido',
        authorId: author.id,
        targetUserId: targetUser.id,
        maxAttempts: 5,
        attemptsUsed: 0,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        completedAt: null,
      },
    });

    const token = generateToken({
      sub: otherUser.id,
      email: otherUser.email,
      name: otherUser.name,
    });

    const response = await request(app)
      .delete(`/dares/${dare.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Não autorizado',
    });

    const persistedDare = await prisma.dare.findUnique({
      where: {
        id: dare.id,
      },
    });

    expect(persistedDare).not.toBeNull();
  });
});