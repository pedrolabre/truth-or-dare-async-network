import express from 'express';
import request from 'supertest';

import truthCommentsLikesRoutes from '../src/routes/truth-comments-likes.routes';
import truthsRoutes from '../src/routes/truths.routes';
import { prisma } from '../src/lib/prisma';
import { createTestUser } from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { applyTestDatabaseHooks } from './test-db';

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use('/truths', truthsRoutes);
  app.use(truthCommentsLikesRoutes);

  return app;
}

async function createTruthScenario() {
  const author = await createTestUser({
    name: 'Truth Comment Author',
    email: 'truth-comment-author@test.com',
    password: '123456',
  });

  const targetUser = await createTestUser({
    name: 'Truth Comment Target',
    email: 'truth-comment-target@test.com',
    password: '123456',
  });

  const commenter = await createTestUser({
    name: 'Truth Commenter',
    email: 'truth-commenter@test.com',
    password: '123456',
  });

  const truth = await prisma.truth.create({
    data: {
      content: 'Qual foi a verdade mais difícil que você já contou?',
      authorId: author.id,
      targetUserId: targetUser.id,
    },
  });

  const token = generateToken({
    sub: commenter.id,
    email: commenter.email,
    name: commenter.name,
  });

  return {
    author,
    targetUser,
    commenter,
    truth,
    token,
  };
}

describe('Truth comments routes', () => {
  const app = createTestApp();

  applyTestDatabaseHooks({
    resetBeforeEach: true,
    resetAfterAll: true,
    disconnectAfterAll: true,
  });

  describe('GET /truths/:id/comments', () => {
    it('deve retornar 401 quando o token não for informado', async () => {
      const response = await request(app).get('/truths/qualquer-id/comments');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Token não informado',
      });
    });

    it('deve retornar lista vazia quando a truth ainda não tiver comentários', async () => {
      const scenario = await createTruthScenario();

      const response = await request(app)
        .get(`/truths/${scenario.truth.id}/comments`)
        .set('Authorization', `Bearer ${scenario.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('deve retornar comentários reais com autor, replies, likesCount e likedByMe', async () => {
      const scenario = await createTruthScenario();

      const rootComment = await prisma.truthComment.create({
        data: {
          text: 'Comentário principal persistido.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
        },
      });

      const reply = await prisma.truthComment.create({
        data: {
          text: 'Resposta persistida.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
          parentId: rootComment.id,
        },
      });

      await prisma.like.create({
        data: {
          userId: scenario.commenter.id,
          targetId: rootComment.id,
          targetType: 'truth_comment',
        },
      });

      await prisma.like.create({
        data: {
          userId: scenario.commenter.id,
          targetId: reply.id,
          targetType: 'truth_comment',
        },
      });

      const response = await request(app)
        .get(`/truths/${scenario.truth.id}/comments`)
        .set('Authorization', `Bearer ${scenario.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);

      expect(response.body[0]).toMatchObject({
        id: rootComment.id,
        text: 'Comentário principal persistido.',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        likesCount: 1,
        likedByMe: true,
        author: {
          id: scenario.commenter.id,
          name: scenario.commenter.name,
          email: scenario.commenter.email,
        },
        replies: [
          {
            id: reply.id,
            text: 'Resposta persistida.',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            likesCount: 1,
            likedByMe: true,
            author: {
              id: scenario.commenter.id,
              name: scenario.commenter.name,
              email: scenario.commenter.email,
            },
          },
        ],
      });
    });

    it('deve retornar 404 quando a truth não existir', async () => {
      const scenario = await createTruthScenario();

      const response = await request(app)
        .get('/truths/truth-inexistente/comments')
        .set('Authorization', `Bearer ${scenario.token}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Truth não encontrada',
      });
    });
  });

  describe('POST /truths/:id/comments', () => {
    it('deve criar comentário raiz real para usuário autenticado', async () => {
      const scenario = await createTruthScenario();

      const response = await request(app)
        .post(`/truths/${scenario.truth.id}/comments`)
        .set('Authorization', `Bearer ${scenario.token}`)
        .send({
          text: 'Esse é um comentário real de teste.',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        text: 'Esse é um comentário real de teste.',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        likesCount: 0,
        likedByMe: false,
        author: {
          id: scenario.commenter.id,
          name: scenario.commenter.name,
          email: scenario.commenter.email,
        },
        replies: [],
      });

      const persistedComment = await prisma.truthComment.findUnique({
        where: {
          id: response.body.id,
        },
      });

      expect(persistedComment).toMatchObject({
        text: 'Esse é um comentário real de teste.',
        truthId: scenario.truth.id,
        userId: scenario.commenter.id,
        parentId: null,
      });
    });

    it('deve criar reply real associado a um comentário raiz', async () => {
      const scenario = await createTruthScenario();

      const rootComment = await prisma.truthComment.create({
        data: {
          text: 'Comentário principal.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
        },
      });

      const response = await request(app)
        .post(`/truths/${scenario.truth.id}/comments`)
        .set('Authorization', `Bearer ${scenario.token}`)
        .send({
          text: 'Resposta real ao comentário.',
          parentId: rootComment.id,
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        text: 'Resposta real ao comentário.',
        likesCount: 0,
        likedByMe: false,
        author: {
          id: scenario.commenter.id,
          name: scenario.commenter.name,
          email: scenario.commenter.email,
        },
        replies: [],
      });

      const persistedReply = await prisma.truthComment.findUnique({
        where: {
          id: response.body.id,
        },
      });

      expect(persistedReply).toMatchObject({
        text: 'Resposta real ao comentário.',
        truthId: scenario.truth.id,
        userId: scenario.commenter.id,
        parentId: rootComment.id,
      });
    });

    it('deve retornar 400 quando o texto estiver vazio', async () => {
      const scenario = await createTruthScenario();

      const response = await request(app)
        .post(`/truths/${scenario.truth.id}/comments`)
        .set('Authorization', `Bearer ${scenario.token}`)
        .send({
          text: '   ',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Comentário é obrigatório',
      });

      const commentsCount = await prisma.truthComment.count();

      expect(commentsCount).toBe(0);
    });

    it('deve retornar 400 quando tentar responder uma resposta', async () => {
      const scenario = await createTruthScenario();

      const rootComment = await prisma.truthComment.create({
        data: {
          text: 'Comentário raiz.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
        },
      });

      const reply = await prisma.truthComment.create({
        data: {
          text: 'Primeira resposta.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
          parentId: rootComment.id,
        },
      });

      const response = await request(app)
        .post(`/truths/${scenario.truth.id}/comments`)
        .set('Authorization', `Bearer ${scenario.token}`)
        .send({
          text: 'Tentativa de resposta em segundo nível.',
          parentId: reply.id,
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Não é possível responder uma resposta',
      });
    });

    it('deve retornar 404 quando o comentário pai não pertencer à mesma truth', async () => {
      const scenario = await createTruthScenario();

      const anotherTruth = await prisma.truth.create({
        data: {
          content: 'Outra truth para teste de comentário pai.',
          authorId: scenario.author.id,
          targetUserId: scenario.targetUser.id,
        },
      });

      const commentFromAnotherTruth = await prisma.truthComment.create({
        data: {
          text: 'Comentário de outra truth.',
          truthId: anotherTruth.id,
          userId: scenario.commenter.id,
        },
      });

      const response = await request(app)
        .post(`/truths/${scenario.truth.id}/comments`)
        .set('Authorization', `Bearer ${scenario.token}`)
        .send({
          text: 'Tentativa de reply cruzado.',
          parentId: commentFromAnotherTruth.id,
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Comentário pai não encontrado',
      });
    });

    it('deve retornar 404 quando a truth não existir', async () => {
      const scenario = await createTruthScenario();

      const response = await request(app)
        .post('/truths/truth-inexistente/comments')
        .set('Authorization', `Bearer ${scenario.token}`)
        .send({
          text: 'Comentário para truth inexistente.',
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Truth não encontrada',
      });
    });
  });

  describe('POST /truths/comments/:id/like', () => {
    it('deve curtir comentário e retornar liked true com likesCount atualizado', async () => {
      const scenario = await createTruthScenario();

      const comment = await prisma.truthComment.create({
        data: {
          text: 'Comentário para receber like.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
        },
      });

      const response = await request(app)
        .post(`/truths/comments/${comment.id}/like`)
        .set('Authorization', `Bearer ${scenario.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        liked: true,
        likesCount: 1,
      });

      const persistedLike = await prisma.like.findUnique({
        where: {
          userId_targetId_targetType: {
            userId: scenario.commenter.id,
            targetId: comment.id,
            targetType: 'truth_comment',
          },
        },
      });

      expect(persistedLike).not.toBeNull();
    });

    it('deve remover curtida ao chamar novamente e retornar likesCount atualizado', async () => {
      const scenario = await createTruthScenario();

      const comment = await prisma.truthComment.create({
        data: {
          text: 'Comentário para alternar like.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
        },
      });

      await request(app)
        .post(`/truths/comments/${comment.id}/like`)
        .set('Authorization', `Bearer ${scenario.token}`);

      const response = await request(app)
        .post(`/truths/comments/${comment.id}/like`)
        .set('Authorization', `Bearer ${scenario.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        liked: false,
        likesCount: 0,
      });

      const likesCount = await prisma.like.count({
        where: {
          targetId: comment.id,
          targetType: 'truth_comment',
        },
      });

      expect(likesCount).toBe(0);
    });

    it('deve curtir reply usando o mesmo endpoint de comentários', async () => {
      const scenario = await createTruthScenario();

      const rootComment = await prisma.truthComment.create({
        data: {
          text: 'Comentário raiz com reply.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
        },
      });

      const reply = await prisma.truthComment.create({
        data: {
          text: 'Reply para receber like.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
          parentId: rootComment.id,
        },
      });

      const response = await request(app)
        .post(`/truths/comments/${reply.id}/like`)
        .set('Authorization', `Bearer ${scenario.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        liked: true,
        likesCount: 1,
      });
    });
  });
});