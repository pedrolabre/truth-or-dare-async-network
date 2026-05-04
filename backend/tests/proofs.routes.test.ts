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

describe('POST /dares/:id/proof', () => {
  const app = createTestApp();

  applyTestDatabaseHooks({
    resetBeforeEach: true,
    resetAfterAll: true,
    disconnectAfterAll: true,
  });

  it('deve retornar 401 quando o token não for informado', async () => {
    const response = await request(app).post('/dares/qualquer-id/proof').send({
      mediaType: 'video',
      fileUrl: 'https://example.com/provas/video.mp4',
      durationSeconds: 30,
      text: 'Prova sem token',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Token não informado',
    });
  });

  it('deve criar uma proof real no banco quando o usuário alvo envia a prova', async () => {
    const author = await createTestUser({
      name: 'Proof Dare Author',
      email: 'proof-dare-author@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Proof Dare Target',
      email: 'proof-dare-target@test.com',
      password: '123456',
    });

    const dare = await prisma.dare.create({
      data: {
        content: 'Grave um vídeo fazendo uma dança engraçada.',
        authorId: author.id,
        targetUserId: targetUser.id,
        maxAttempts: 3,
        attemptsUsed: 0,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        completedAt: null,
      },
    });

    const token = generateToken({
      sub: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
    });

    const payload = {
      mediaType: 'video',
      fileUrl: 'https://example.com/provas/video-teste.mp4',
      durationSeconds: 30,
      text: 'Prova enviada pelo teste automatizado',
    };

    const response = await request(app)
      .post(`/dares/${dare.id}/proof`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      message: 'Prova enviada com sucesso',
      proof: {
        id: expect.any(String),
        dareId: dare.id,
        userId: targetUser.id,
        mediaType: payload.mediaType,
        fileUrl: payload.fileUrl,
        durationSeconds: payload.durationSeconds,
        text: payload.text,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
        },
        dare: {
          id: dare.id,
          content: dare.content,
          targetUserId: targetUser.id,
          authorId: author.id,
        },
      },
    });

    const persistedProof = await prisma.dareProof.findUnique({
      where: {
        id: response.body.proof.id,
      },
    });

    expect(persistedProof).not.toBeNull();
    expect(persistedProof).toMatchObject({
      dareId: dare.id,
      userId: targetUser.id,
      mediaType: payload.mediaType,
      fileUrl: payload.fileUrl,
      durationSeconds: payload.durationSeconds,
      text: payload.text,
    });

    const completedDare = await prisma.dare.findUnique({
      where: {
        id: dare.id,
      },
    });

    expect(completedDare).not.toBeNull();
    expect(completedDare?.completedAt).toBeInstanceOf(Date);
  });

  it('deve aceitar proof com audio e texto opcional vazio', async () => {
    const author = await createTestUser({
      name: 'Proof Audio Author',
      email: 'proof-audio-author@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Proof Audio Target',
      email: 'proof-audio-target@test.com',
      password: '123456',
    });

    const dare = await prisma.dare.create({
      data: {
        content: 'Envie um áudio cantando por 10 segundos.',
        authorId: author.id,
        targetUserId: targetUser.id,
        maxAttempts: 2,
        attemptsUsed: 0,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        completedAt: null,
      },
    });

    const token = generateToken({
      sub: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
    });

    const response = await request(app)
      .post(`/dares/${dare.id}/proof`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        mediaType: 'audio',
        fileUrl: 'https://example.com/provas/audio-teste.mp3',
        durationSeconds: 12,
        text: '   ',
      });

    expect(response.status).toBe(201);
    expect(response.body.proof).toMatchObject({
      dareId: dare.id,
      userId: targetUser.id,
      mediaType: 'audio',
      fileUrl: 'https://example.com/provas/audio-teste.mp3',
      durationSeconds: 12,
      text: null,
    });
  });

  it('deve retornar 403 quando outro usuário tenta enviar proof para dare que não é dele', async () => {
    const author = await createTestUser({
      name: 'Proof Forbidden Author',
      email: 'proof-forbidden-author@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Proof Forbidden Target',
      email: 'proof-forbidden-target@test.com',
      password: '123456',
    });

    const otherUser = await createTestUser({
      name: 'Proof Forbidden Other',
      email: 'proof-forbidden-other@test.com',
      password: '123456',
    });

    const dare = await prisma.dare.create({
      data: {
        content: 'Dare que não pertence ao usuário autenticado.',
        authorId: author.id,
        targetUserId: targetUser.id,
        maxAttempts: 1,
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
      .post(`/dares/${dare.id}/proof`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        mediaType: 'video',
        fileUrl: 'https://example.com/provas/video-proibido.mp4',
        durationSeconds: 20,
        text: 'Tentativa inválida',
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: 'Você não pode enviar prova para este dare',
    });

    const proofsCount = await prisma.dareProof.count();

    expect(proofsCount).toBe(0);
  });

  it('deve retornar 400 quando mediaType for inválido', async () => {
    const author = await createTestUser({
      name: 'Proof Invalid Media Author',
      email: 'proof-invalid-media-author@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Proof Invalid Media Target',
      email: 'proof-invalid-media-target@test.com',
      password: '123456',
    });

    const dare = await prisma.dare.create({
      data: {
        content: 'Dare com mediaType inválido.',
        authorId: author.id,
        targetUserId: targetUser.id,
        maxAttempts: 1,
        attemptsUsed: 0,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        completedAt: null,
      },
    });

    const token = generateToken({
      sub: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
    });

    const response = await request(app)
      .post(`/dares/${dare.id}/proof`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        mediaType: 'image',
        fileUrl: 'https://example.com/provas/imagem.png',
        durationSeconds: null,
        text: 'Tipo inválido',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'mediaType must be video, audio or file',
    });

    const proofsCount = await prisma.dareProof.count();

    expect(proofsCount).toBe(0);
  });

  it('deve retornar 400 quando fileUrl não for informado', async () => {
    const author = await createTestUser({
      name: 'Proof Missing File Author',
      email: 'proof-missing-file-author@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Proof Missing File Target',
      email: 'proof-missing-file-target@test.com',
      password: '123456',
    });

    const dare = await prisma.dare.create({
      data: {
        content: 'Dare sem fileUrl.',
        authorId: author.id,
        targetUserId: targetUser.id,
        maxAttempts: 1,
        attemptsUsed: 0,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        completedAt: null,
      },
    });

    const token = generateToken({
      sub: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
    });

    const response = await request(app)
      .post(`/dares/${dare.id}/proof`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        mediaType: 'file',
        fileUrl: '   ',
        durationSeconds: null,
        text: 'Arquivo sem URL',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'fileUrl is required',
    });

    const proofsCount = await prisma.dareProof.count();

    expect(proofsCount).toBe(0);
  });

  it('deve retornar 403 quando o dare já estiver concluído', async () => {
    const author = await createTestUser({
      name: 'Proof Completed Author',
      email: 'proof-completed-author@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Proof Completed Target',
      email: 'proof-completed-target@test.com',
      password: '123456',
    });

    const dare = await prisma.dare.create({
      data: {
        content: 'Dare já concluído.',
        authorId: author.id,
        targetUserId: targetUser.id,
        maxAttempts: 1,
        attemptsUsed: 0,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        completedAt: new Date(),
      },
    });

    const token = generateToken({
      sub: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
    });

    const response = await request(app)
      .post(`/dares/${dare.id}/proof`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        mediaType: 'video',
        fileUrl: 'https://example.com/provas/video-ja-concluido.mp4',
        durationSeconds: 15,
        text: 'Tentativa em dare concluído',
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: 'Dare já concluído',
    });

    const proofsCount = await prisma.dareProof.count();

    expect(proofsCount).toBe(0);
  });

  it('deve retornar 403 quando o dare estiver expirado', async () => {
    const author = await createTestUser({
      name: 'Proof Expired Author',
      email: 'proof-expired-author@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Proof Expired Target',
      email: 'proof-expired-target@test.com',
      password: '123456',
    });

    const dare = await prisma.dare.create({
      data: {
        content: 'Dare expirado.',
        authorId: author.id,
        targetUserId: targetUser.id,
        maxAttempts: 1,
        attemptsUsed: 0,
        expiresAt: new Date(Date.now() - 1000 * 60),
        completedAt: null,
      },
    });

    const token = generateToken({
      sub: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
    });

    const response = await request(app)
      .post(`/dares/${dare.id}/proof`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        mediaType: 'video',
        fileUrl: 'https://example.com/provas/video-expirado.mp4',
        durationSeconds: 15,
        text: 'Tentativa em dare expirado',
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: 'Dare expirado',
    });

    const proofsCount = await prisma.dareProof.count();

    expect(proofsCount).toBe(0);
  });

  it('deve retornar 403 quando o dare estiver sem tentativas disponíveis', async () => {
    const author = await createTestUser({
      name: 'Proof Attempts Author',
      email: 'proof-attempts-author@test.com',
      password: '123456',
    });

    const targetUser = await createTestUser({
      name: 'Proof Attempts Target',
      email: 'proof-attempts-target@test.com',
      password: '123456',
    });

    const dare = await prisma.dare.create({
      data: {
        content: 'Dare sem tentativas disponíveis.',
        authorId: author.id,
        targetUserId: targetUser.id,
        maxAttempts: 1,
        attemptsUsed: 1,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        completedAt: null,
      },
    });

    const token = generateToken({
      sub: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
    });

    const response = await request(app)
      .post(`/dares/${dare.id}/proof`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        mediaType: 'video',
        fileUrl: 'https://example.com/provas/video-sem-tentativas.mp4',
        durationSeconds: 15,
        text: 'Tentativa sem tentativas disponíveis',
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: 'Dare sem tentativas disponíveis',
    });

    const proofsCount = await prisma.dareProof.count();

    expect(proofsCount).toBe(0);
  });
});