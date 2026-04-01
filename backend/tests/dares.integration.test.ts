import express from 'express';
import request from 'supertest';
import feedRoutes from '../src/routes/feed.routes';
import daresRoutes from '../src/routes/dares.routes';
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

  applyTestDatabaseHooks();

  it('deve refletir no feed um dare criado via API', async () => {
    const user = await createTestUser({
      name: 'Integration Dare User',
      email: 'integration-dare-user@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    const content =
      'Envie uma mensagem de voz cantando o refrão da última música que ouviu.';

    const createResponse = await request(app)
      .post('/dares')
      .set('Authorization', `Bearer ${token}`)
      .send({ content });

    expect(createResponse.status).toBe(201);

    const feedResponse = await request(app)
      .get('/feed')
      .set('Authorization', `Bearer ${token}`);

    expect(feedResponse.status).toBe(200);

    const dareItems = feedResponse.body.filter(
      (item: any) => item.type === 'dare',
    );

    expect(dareItems.length).toBeGreaterThan(0);

    expect(dareItems.some((item: any) => item.title === content)).toBe(true);
  });

  it('deve manter o contrato do feed ao criar novos dares dinamicamente', async () => {
    const user = await createTestUser({
      name: 'Contract Dare User',
      email: 'contract-dare-user@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    await request(app)
      .post('/dares')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Grave um vídeo fazendo a careta mais estranha que conseguir.',
      });

    const feedResponse = await request(app)
      .get('/feed')
      .set('Authorization', `Bearer ${token}`);

    expect(feedResponse.status).toBe(200);

    const dareItem = feedResponse.body.find((item: any) => item.type === 'dare');

    expect(dareItem).toMatchObject({
      id: expect.any(String),
      type: 'dare',
      challenger: expect.any(String),
      title: expect.any(String),
      attemptsLabel: expect.any(String),
      expiresIn: expect.any(String),
      progress: expect.any(Number),
    });
  });
});