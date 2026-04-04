import express from 'express';
import request from 'supertest';
import feedRoutes from '../src/routes/feed.routes';
import truthsRoutes from '../src/routes/truths.routes';
import { applyTestDatabaseHooks } from './test-db';
import { createTestUser } from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use('/truths', truthsRoutes);
  app.use('/feed', feedRoutes);

  return app;
}

describe('Truth → Feed integration', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  it('deve refletir no feed uma truth criada via API com targetUserId', async () => {
    const author = await createTestUser({
      name: 'Integration User',
      email: 'integration-user@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Integration Target User',
      email: 'integration-target-user@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: author.id,
      email: author.email,
      name: author.name,
    });

    const content =
      'Qual foi a coisa mais estranha que você já fez sozinho em casa?';

    const createResponse = await request(app)
      .post('/truths')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content,
        targetUserId: targetUser.id,
      });

    expect(createResponse.status).toBe(201);

    const feedResponse = await request(app)
      .get('/feed')
      .set('Authorization', `Bearer ${token}`);

    expect(feedResponse.status).toBe(200);

    const truthItems = feedResponse.body.filter(
      (item: any) => item.type === 'truth',
    );

    expect(truthItems.length).toBeGreaterThan(0);

    expect(
      truthItems.some((item: any) => item.title === content),
    ).toBe(true);
  });

  it('deve manter o contrato do feed ao criar novas truths dinamicamente com targetUserId', async () => {
    const author = await createTestUser({
      name: 'Contract User',
      email: 'contract-user@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Contract Target User',
      email: 'contract-target-user@test.com',
      password: '123456',
    });

    const token = generateToken({
      sub: author.id,
      email: author.email,
      name: author.name,
    });

    await request(app)
      .post('/truths')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Qual foi o seu maior medo na infância?',
        targetUserId: targetUser.id,
      });

    const feedResponse = await request(app)
      .get('/feed')
      .set('Authorization', `Bearer ${token}`);

    const truthItem = feedResponse.body.find(
      (item: any) => item.type === 'truth',
    );

    expect(truthItem).toMatchObject({
      id: expect.any(String),
      type: 'truth',
      title: expect.any(String),
      time: expect.any(String),
      likes: expect.any(Number),
      comments: expect.any(Number),
      participants: expect.any(Array),
      extraCount: expect.any(Number),
    });
  });
});