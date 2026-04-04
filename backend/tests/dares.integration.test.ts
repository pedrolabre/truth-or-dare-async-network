import express from 'express';
import request from 'supertest';
import daresRoutes from '../src/routes/dares.routes';
import feedRoutes from '../src/routes/feed.routes';
import { applyTestDatabaseHooks } from './test-db';
import { createTestUser } from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use('/dares', daresRoutes);
  app.use('/feed', feedRoutes);

  return app;
}

describe('Dare → Feed integration', () => {
  const app = createTestApp();

  applyTestDatabaseHooks({
    resetBeforeEach: true,
    resetAfterAll: true,
    disconnectAfterAll: true,
  });

  it('deve refletir no feed um dare criado via API com targetUserId', async () => {
    const author = await createTestUser({
      name: 'Integration Dare Author',
      email: 'integration-dare-author@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Integration Dare Target',
      email: 'integration-dare-target@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: author.id,
      email: author.email,
      name: author.name,
    });

    const createResponse = await request(app)
      .post('/dares')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Grave um vídeo imitando um personagem famoso.',
        targetUserId: targetUser.id,
      });

    expect(createResponse.status).toBe(201);

    const feedResponse = await request(app)
      .get('/feed')
      .set('Authorization', `Bearer ${token}`);

    expect(feedResponse.status).toBe(200);
    expect(Array.isArray(feedResponse.body)).toBe(true);

    const dareItem = feedResponse.body.find(
      (item: any) => item.type === 'dare',
    );

    expect(dareItem).toBeDefined();
    expect(dareItem).toMatchObject({
      type: 'dare',
      content: 'Grave um vídeo imitando um personagem famoso.',
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

  it('deve manter o contrato do feed ao criar novos dares dinamicamente com targetUserId', async () => {
    const author = await createTestUser({
      name: 'Integration Dare Contract Author',
      email: 'integration-dare-contract-author@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Integration Dare Contract Target',
      email: 'integration-dare-contract-target@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: author.id,
      email: author.email,
      name: author.name,
    });

    await request(app)
      .post('/dares')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Faça uma dublagem engraçada.',
        targetUserId: targetUser.id,
      });

    const feedResponse = await request(app)
      .get('/feed')
      .set('Authorization', `Bearer ${token}`);

    expect(feedResponse.status).toBe(200);

    const dareItem = feedResponse.body.find(
      (item: any) => item.type === 'dare',
    );

    expect(dareItem).toBeDefined();

    expect(dareItem).toMatchObject({
      id: expect.any(String),
      type: 'dare',
      content: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      author: {
        id: expect.any(String),
        name: expect.any(String),
        email: expect.any(String),
      },
      targetUser: {
        id: expect.any(String),
        name: expect.any(String),
        email: expect.any(String),
      },
    });
  });

  it('deve refletir no feed um dare com maxAttempts e expiresAt customizados', async () => {
    const author = await createTestUser({
      name: 'Integration Dare Config Author',
      email: 'integration-dare-config-author@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Integration Dare Config Target',
      email: 'integration-dare-config-target@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: author.id,
      email: author.email,
      name: author.name,
    });

    const customExpiresAt = '2026-04-15T18:00:00.000Z';

    const createResponse = await request(app)
      .post('/dares')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Faça uma encenação dramática por 30 segundos.',
        targetUserId: targetUser.id,
        maxAttempts: 7,
        expiresAt: customExpiresAt,
      });

    expect(createResponse.status).toBe(201);

    const feedResponse = await request(app)
      .get('/feed')
      .set('Authorization', `Bearer ${token}`);

    expect(feedResponse.status).toBe(200);

    const dareItem = feedResponse.body.find(
      (item: any) => item.type === 'dare',
    );

    expect(dareItem).toBeDefined();
    expect(dareItem).toMatchObject({
      type: 'dare',
      content: 'Faça uma encenação dramática por 30 segundos.',
      author: {
        id: author.id,
      },
      targetUser: {
        id: targetUser.id,
      },
    });
  });
});