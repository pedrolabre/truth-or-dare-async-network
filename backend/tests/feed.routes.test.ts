import express from 'express';
import request from 'supertest';
import feedRoutes from '../src/routes/feed/feed.routes';
import { ProofMediaType } from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import {
  buildFeedScenario,
  resetFeedData,
} from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { applyTestDatabaseHooks } from './test-db';

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use('/feed', feedRoutes);

  return app;
}

describe('GET /feed', () => {
  const app = createTestApp();

  applyTestDatabaseHooks({
    resetBeforeEach: true,
    resetAfterAll: true,
    disconnectAfterAll: true,
  });

  it('deve retornar 401 quando o token não for informado', async () => {
    const response = await request(app).get('/feed');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token não informado',
    });
  });

  it('deve retornar 401 quando o token estiver mal formatado', async () => {
    const response = await request(app)
      .get('/feed')
      .set('Authorization', 'Token abc123');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token mal formatado',
    });
  });

  it('deve retornar 401 quando o token for inválido', async () => {
    const response = await request(app)
      .get('/feed')
      .set('Authorization', 'Bearer token-invalido');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token inválido ou expirado',
    });
  });

  it('deve retornar o feed real persistido no banco para usuário autenticado', async () => {
    const scenario = await buildFeedScenario();

    const token = generateToken({
      sub: scenario.users.owner.id,
      email: scenario.users.owner.email,
      name: scenario.users.owner.name,
    });

    const response = await request(app)
      .get('/feed')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(7);

    const truthItems = response.body.filter((item: any) => item.type === 'truth');
    const dareItems = response.body.filter((item: any) => item.type === 'dare');
    const clubItems = response.body.filter((item: any) => item.type === 'club');

    expect(truthItems).toHaveLength(2);
    expect(dareItems).toHaveLength(2);
    expect(clubItems).toHaveLength(3);

    expect(
      truthItems.some(
        (item: any) =>
          item.title ===
          'Qual foi a mentira mais deslavada que você já contou para os seus pais?',
      ),
    ).toBe(true);

    expect(
      dareItems.some(
        (item: any) =>
          item.challenger === 'Pedro Roberto' &&
          item.title ===
            'Ligue para um amigo e fale com sotaque por pelo menos 30 segundos.',
      ),
    ).toBe(true);

    expect(
      clubItems.some(
        (item: any) =>
          item.clubName === 'Clube dos Corajosos' &&
          item.badge === 'Desafio' &&
          item.quote ===
            'Poste uma selfie fazendo a careta mais estranha que conseguir.',
      ),
    ).toBe(true);
  });

  it('deve manter o contrato compatível com o mobile', async () => {
    const scenario = await buildFeedScenario();

    const token = generateToken({
      sub: scenario.users.owner.id,
      email: scenario.users.owner.email,
      name: scenario.users.owner.name,
    });

    const response = await request(app)
      .get('/feed')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    const truthItem = response.body.find((item: any) => item.type === 'truth');
    const dareItem = response.body.find((item: any) => item.type === 'dare');
    const clubItem = response.body.find((item: any) => item.type === 'club');

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

    expect(dareItem).toMatchObject({
      id: expect.any(String),
      type: 'dare',
      challenger: expect.any(String),
      title: expect.any(String),
      attemptsLabel: expect.any(String),
      expiresIn: expect.any(String),
      progress: expect.any(Number),
      canRespond: expect.any(Boolean),
      interactionDisabled: expect.any(Boolean),
    });

    expect(dareItem.progress).toBeGreaterThanOrEqual(0);
    expect(dareItem.progress).toBeLessThanOrEqual(1);

    expect(clubItem).toMatchObject({
      id: expect.any(String),
      type: 'club',
      clubName: expect.any(String),
      badge: expect.stringMatching(/^(Verdade|Desafio)$/),
      quote: expect.any(String),
      answersCount: expect.any(Number),
    });
  });

  it('deve incluir resumo de prova quando dare estiver concluido', async () => {
    const scenario = await buildFeedScenario();
    const proof = await prisma.dareProof.create({
      data: {
        dareId: scenario.dares[0].id,
        userId: scenario.dares[0].targetUserId,
        mediaType: ProofMediaType.video,
        fileUrl: 'https://cdn.example.com/proofs/feed-video.mp4',
        durationSeconds: 30,
        text: 'Prova para resumo do feed.',
      },
    });

    await prisma.dare.update({
      where: {
        id: scenario.dares[0].id,
      },
      data: {
        completedAt: proof.createdAt,
      },
    });

    const token = generateToken({
      sub: scenario.users.owner.id,
      email: scenario.users.owner.email,
      name: scenario.users.owner.name,
    });

    const response = await request(app)
      .get('/feed')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    const dareItem = response.body.find(
      (item: any) => item.id === scenario.dares[0].id,
    );

    expect(dareItem).toMatchObject({
      id: scenario.dares[0].id,
      type: 'dare',
      status: 'concluded',
      proofId: proof.id,
      proofMediaType: 'video',
      proofFileUrl: 'https://cdn.example.com/proofs/feed-video.mp4',
      proofThumbnailUrl: null,
    });
  });

  it('desativa aceitar desafio quando o usuario autenticado e o autor, nao o alvo', async () => {
    const scenario = await buildFeedScenario();

    const token = generateToken({
      sub: scenario.users.owner.id,
      email: scenario.users.owner.email,
      name: scenario.users.owner.name,
    });

    const response = await request(app)
      .get('/feed')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    const receivedDare = response.body.find(
      (item: any) => item.id === scenario.dares[0].id,
    );
    const authoredDare = response.body.find(
      (item: any) => item.id === scenario.dares[1].id,
    );

    expect(receivedDare).toMatchObject({
      type: 'dare',
      canRespond: true,
      interactionDisabled: false,
    });
    expect(authoredDare).toMatchObject({
      type: 'dare',
      canRespond: false,
      interactionDisabled: true,
    });
  });

  it('deve retornar feed vazio quando não houver dados persistidos', async () => {
    const scenario = await buildFeedScenario();
    await resetFeedData();

    const token = generateToken({
      sub: scenario.users.owner.id,
      email: scenario.users.owner.email,
      name: scenario.users.owner.name,
    });

    const response = await request(app)
      .get('/feed')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
