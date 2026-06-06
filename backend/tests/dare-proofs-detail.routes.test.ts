import express from 'express';
import request from 'supertest';
import proofsRoutes from '../src/routes/dares/proofs.routes';
import { ProofMediaType } from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import {
  createTestDare,
  createTestUser,
  resetFeedData,
} from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { applyTestDatabaseHooks } from './test-db';

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use('/dares', proofsRoutes);

  return app;
}

function authTokenFor(user: { id: string; email: string; name: string }) {
  return generateToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });
}

async function createProofScenario() {
  const author = await createTestUser({
    name: 'Autor Dare Proof Detail',
    email: 'autor-dare-proof-detail@test.com',
  });
  const target = await createTestUser({
    name: 'Alvo Dare Proof Detail',
    email: 'alvo-dare-proof-detail@test.com',
    username: 'alvo_proof_detail',
    avatarUrl: 'https://cdn.example.com/users/alvo-proof.png',
  });
  const dare = await createTestDare({
    authorId: author.id,
    targetUserId: target.id,
    content: 'Grave uma prova para o detalhe.',
  });
  const proof = await prisma.dareProof.create({
    data: {
      dareId: dare.id,
      userId: target.id,
      mediaType: ProofMediaType.video,
      fileUrl: 'https://cdn.example.com/proofs/video-detail.mp4',
      durationSeconds: 42,
      text: 'Prova pelo endpoint de detalhe.',
    },
  });

  await prisma.dare.update({
    where: {
      id: dare.id,
    },
    data: {
      completedAt: proof.createdAt,
    },
  });

  return {
    author,
    target,
    dare,
    proof,
  };
}

describe('GET /dares/proofs/:proofId', () => {
  const app = createTestApp();

  applyTestDatabaseHooks({
    resetBeforeEach: true,
    resetAfterAll: true,
    disconnectAfterAll: true,
  });

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('retorna 401 quando o token nao for informado', async () => {
    const response = await request(app).get('/dares/proofs/proof-id');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token não informado',
    });
  });

  it('retorna detalhe enxuto da prova para o autor do dare', async () => {
    const scenario = await createProofScenario();

    const response = await request(app)
      .get(`/dares/proofs/${scenario.proof.id}`)
      .set('Authorization', `Bearer ${authTokenFor(scenario.author)}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: scenario.proof.id,
      dareId: scenario.dare.id,
      userId: scenario.target.id,
      mediaType: 'video',
      fileUrl: 'https://cdn.example.com/proofs/video-detail.mp4',
      durationSeconds: 42,
      text: 'Prova pelo endpoint de detalhe.',
      createdAt: expect.any(String),
      author: {
        id: scenario.target.id,
        name: scenario.target.name,
        username: 'alvo_proof_detail',
        avatarUrl: 'https://cdn.example.com/users/alvo-proof.png',
      },
      dare: {
        id: scenario.dare.id,
        content: 'Grave uma prova para o detalhe.',
        authorId: scenario.author.id,
        targetUserId: scenario.target.id,
        completedAt: expect.any(String),
      },
    });
    expect(response.body).not.toHaveProperty('email');
    expect(response.body.author).not.toHaveProperty('email');
  });

  it('retorna detalhe da prova para o alvo do dare', async () => {
    const scenario = await createProofScenario();

    const response = await request(app)
      .get(`/dares/proofs/${scenario.proof.id}`)
      .set('Authorization', `Bearer ${authTokenFor(scenario.target)}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(scenario.proof.id);
  });

  it('retorna 403 quando usuario sem relacao tenta ver a prova', async () => {
    const scenario = await createProofScenario();
    const outsider = await createTestUser({
      name: 'Outsider Proof Detail',
      email: 'outsider-proof-detail@test.com',
    });

    const response = await request(app)
      .get(`/dares/proofs/${scenario.proof.id}`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`);

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      code: 'PROOF_FORBIDDEN',
    });
  });

  it('retorna 404 quando a prova nao existe', async () => {
    const user = await createTestUser({
      name: 'Viewer Proof Missing',
      email: 'viewer-proof-missing@test.com',
    });

    const response = await request(app)
      .get('/dares/proofs/prova-inexistente')
      .set('Authorization', `Bearer ${authTokenFor(user)}`);

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      code: 'PROOF_NOT_FOUND',
    });
  });
});
