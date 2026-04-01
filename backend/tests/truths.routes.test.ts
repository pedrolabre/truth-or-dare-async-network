import express from 'express';
import request from 'supertest';
import truthsRoutes from '../src/routes/truths.routes';
import { applyTestDatabaseHooks } from './test-db';
import { createTestUser } from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { prisma } from '../src/lib/prisma';

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use('/truths', truthsRoutes);

  return app;
}

describe('POST /truths', () => {
  const app = createTestApp();

  applyTestDatabaseHooks({
    resetBeforeEach: true,
    resetAfterAll: true,
    disconnectAfterAll: true,
  });

  it('deve retornar 401 quando o token não for informado', async () => {
    const response = await request(app).post('/truths').send({
      content: 'Qual foi a maior loucura que você já fez por amor?',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token não informado',
    });
  });

  it('deve retornar 401 quando o token estiver mal formatado', async () => {
    const response = await request(app)
      .post('/truths')
      .set('Authorization', 'Token abc123')
      .send({
        content: 'Qual foi a maior loucura que você já fez por amor?',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token mal formatado',
    });
  });

  it('deve retornar 401 quando o token for inválido', async () => {
    const response = await request(app)
      .post('/truths')
      .set('Authorization', 'Bearer token-invalido')
      .send({
        content: 'Qual foi a maior loucura que você já fez por amor?',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token inválido ou expirado',
    });
  });

  it('deve criar uma truth real no banco para usuário autenticado', async () => {
    const user = await createTestUser({
      name: 'Truth Author',
      email: 'truth-author@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    const payload = {
      content: 'Qual foi a coisa mais vergonhosa que você já fez escondido?',
    };

    const response = await request(app)
      .post('/truths')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      content: payload.content,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      author: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    const persistedTruth = await prisma.truth.findUnique({
      where: {
        id: response.body.id,
      },
      include: {
        author: true,
      },
    });

    expect(persistedTruth).not.toBeNull();
    expect(persistedTruth).toMatchObject({
      content: payload.content,
      authorId: user.id,
      author: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  });

  it('deve retornar 400 quando o conteúdo não for informado', async () => {
    const user = await createTestUser({
      name: 'Truth Empty Content',
      email: 'truth-empty-content@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    const response = await request(app)
      .post('/truths')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: '   ',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Conteúdo é obrigatório',
    });

    const truthsCount = await prisma.truth.count();

    expect(truthsCount).toBe(0);
  });
});