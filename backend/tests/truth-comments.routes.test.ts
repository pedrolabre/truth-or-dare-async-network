import express from 'express';
import request from 'supertest';

import truthCommentsLikesRoutes from '../src/routes/truths/comments-likes.routes';
import truthsRoutes from '../src/routes/truths/truths.routes';
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

function createTokenForUser(user: { id: string; email: string; name: string }) {
  return generateToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });
}

async function createCommentViewer() {
  return createTestUser({
    name: 'Truth Comment Viewer',
    email: 'truth-comment-viewer@test.com',
    password: '123456',
  });
}

async function createCommentReporter() {
  return createTestUser({
    name: 'Truth Comment Reporter',
    email: 'truth-comment-reporter@test.com',
    password: '123456',
  });
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
        canEdit: true,
        canDelete: true,
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
            canEdit: true,
            canDelete: true,
            author: {
              id: scenario.commenter.id,
              name: scenario.commenter.name,
              email: scenario.commenter.email,
            },
          },
        ],
      });
    });

    it('deve retornar canEdit e canDelete falsos para comentários de outro usuário', async () => {
      const scenario = await createTruthScenario();
      const viewer = await createCommentViewer();
      const viewerToken = createTokenForUser(viewer);

      const rootComment = await prisma.truthComment.create({
        data: {
          text: 'Comentário de outro usuário.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
        },
      });

      const reply = await prisma.truthComment.create({
        data: {
          text: 'Reply de outro usuário.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
          parentId: rootComment.id,
        },
      });

      const response = await request(app)
        .get(`/truths/${scenario.truth.id}/comments`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);

      expect(response.body[0]).toMatchObject({
        id: rootComment.id,
        canEdit: false,
        canDelete: false,
        replies: [
          {
            id: reply.id,
            canEdit: false,
            canDelete: false,
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
        canEdit: true,
        canDelete: true,
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
        canEdit: true,
        canDelete: true,
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

  describe('PATCH /truths/comments/:id', () => {
    it('deve editar comentário raiz quando o usuário autenticado for o autor', async () => {
      const scenario = await createTruthScenario();

      const comment = await prisma.truthComment.create({
        data: {
          text: 'Texto original do comentário.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
        },
      });

      const response = await request(app)
        .patch(`/truths/comments/${comment.id}`)
        .set('Authorization', `Bearer ${scenario.token}`)
        .send({
          text: 'Texto editado do comentário.',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: comment.id,
        text: 'Texto editado do comentário.',
        canEdit: true,
        canDelete: true,
      });

      const persistedComment = await prisma.truthComment.findUnique({
        where: {
          id: comment.id,
        },
      });

      expect(persistedComment?.text).toBe('Texto editado do comentário.');
    });

    it('deve editar reply quando o usuário autenticado for o autor', async () => {
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
          text: 'Texto original da reply.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
          parentId: rootComment.id,
        },
      });

      const response = await request(app)
        .patch(`/truths/comments/${reply.id}`)
        .set('Authorization', `Bearer ${scenario.token}`)
        .send({
          text: 'Texto editado da reply.',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: reply.id,
        text: 'Texto editado da reply.',
        canEdit: true,
        canDelete: true,
      });

      const persistedReply = await prisma.truthComment.findUnique({
        where: {
          id: reply.id,
        },
      });

      expect(persistedReply?.text).toBe('Texto editado da reply.');
    });

    it('deve retornar 401 quando tentar editar sem token', async () => {
      const response = await request(app)
        .patch('/truths/comments/commentario-inexistente')
        .send({
          text: 'Texto editado sem token.',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Token não informado',
      });
    });

    it('deve retornar 403 quando usuário não for autor do comentário', async () => {
      const scenario = await createTruthScenario();
      const viewer = await createCommentViewer();
      const viewerToken = createTokenForUser(viewer);

      const comment = await prisma.truthComment.create({
        data: {
          text: 'Comentário de outro usuário.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
        },
      });

      const response = await request(app)
        .patch(`/truths/comments/${comment.id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          text: 'Tentativa de edição indevida.',
        });

      expect(response.status).toBe(403);

      const persistedComment = await prisma.truthComment.findUnique({
        where: {
          id: comment.id,
        },
      });

      expect(persistedComment?.text).toBe('Comentário de outro usuário.');
    });

    it('deve retornar 404 quando comentário não existir', async () => {
      const scenario = await createTruthScenario();

      const response = await request(app)
        .patch('/truths/comments/commentario-inexistente')
        .set('Authorization', `Bearer ${scenario.token}`)
        .send({
          text: 'Texto editado.',
        });

      expect(response.status).toBe(404);
    });

    it('deve retornar 400 quando o texto editado estiver vazio', async () => {
      const scenario = await createTruthScenario();

      const comment = await prisma.truthComment.create({
        data: {
          text: 'Comentário para validação.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
        },
      });

      const response = await request(app)
        .patch(`/truths/comments/${comment.id}`)
        .set('Authorization', `Bearer ${scenario.token}`)
        .send({
          text: '   ',
        });

      expect(response.status).toBe(400);

      const persistedComment = await prisma.truthComment.findUnique({
        where: {
          id: comment.id,
        },
      });

      expect(persistedComment?.text).toBe('Comentário para validação.');
    });

    it('deve retornar 400 quando o texto editado exceder o limite máximo', async () => {
      const scenario = await createTruthScenario();

      const comment = await prisma.truthComment.create({
        data: {
          text: 'Comentário para limite.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
        },
      });

      const response = await request(app)
        .patch(`/truths/comments/${comment.id}`)
        .set('Authorization', `Bearer ${scenario.token}`)
        .send({
          text: 'a'.repeat(501),
        });

      expect(response.status).toBe(400);

      const persistedComment = await prisma.truthComment.findUnique({
        where: {
          id: comment.id,
        },
      });

      expect(persistedComment?.text).toBe('Comentário para limite.');
    });
  });

  describe('DELETE /truths/comments/:id', () => {
    it('deve excluir comentário raiz e remover replies e likes associados', async () => {
      const scenario = await createTruthScenario();

      const rootComment = await prisma.truthComment.create({
        data: {
          text: 'Comentário raiz para exclusão.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
        },
      });

      const reply = await prisma.truthComment.create({
        data: {
          text: 'Reply que deve cair junto.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
          parentId: rootComment.id,
        },
      });

      await prisma.like.createMany({
        data: [
          {
            userId: scenario.commenter.id,
            targetId: rootComment.id,
            targetType: 'truth_comment',
          },
          {
            userId: scenario.commenter.id,
            targetId: reply.id,
            targetType: 'truth_comment',
          },
        ],
      });

      const response = await request(app)
        .delete(`/truths/comments/${rootComment.id}`)
        .set('Authorization', `Bearer ${scenario.token}`);

      expect(response.status).toBe(204);

      const commentsCount = await prisma.truthComment.count({
        where: {
          id: {
            in: [rootComment.id, reply.id],
          },
        },
      });

      const likesCount = await prisma.like.count({
        where: {
          targetId: {
            in: [rootComment.id, reply.id],
          },
          targetType: 'truth_comment',
        },
      });

      expect(commentsCount).toBe(0);
      expect(likesCount).toBe(0);
    });

    it('deve excluir apenas a reply quando o alvo for uma resposta', async () => {
      const scenario = await createTruthScenario();

      const rootComment = await prisma.truthComment.create({
        data: {
          text: 'Comentário raiz preservado.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
        },
      });

      const reply = await prisma.truthComment.create({
        data: {
          text: 'Reply para exclusão.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
          parentId: rootComment.id,
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
        .delete(`/truths/comments/${reply.id}`)
        .set('Authorization', `Bearer ${scenario.token}`);

      expect(response.status).toBe(204);

      const persistedRootComment = await prisma.truthComment.findUnique({
        where: {
          id: rootComment.id,
        },
      });

      const persistedReply = await prisma.truthComment.findUnique({
        where: {
          id: reply.id,
        },
      });

      const replyLikesCount = await prisma.like.count({
        where: {
          targetId: reply.id,
          targetType: 'truth_comment',
        },
      });

      expect(persistedRootComment).not.toBeNull();
      expect(persistedReply).toBeNull();
      expect(replyLikesCount).toBe(0);
    });

    it('deve retornar 401 quando tentar excluir sem token', async () => {
      const response = await request(app).delete(
        '/truths/comments/commentario-inexistente',
      );

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Token não informado',
      });
    });

    it('deve retornar 403 quando usuário não for autor do comentário', async () => {
      const scenario = await createTruthScenario();
      const viewer = await createCommentViewer();
      const viewerToken = createTokenForUser(viewer);

      const comment = await prisma.truthComment.create({
        data: {
          text: 'Comentário protegido.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
        },
      });

      const response = await request(app)
        .delete(`/truths/comments/${comment.id}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);

      const persistedComment = await prisma.truthComment.findUnique({
        where: {
          id: comment.id,
        },
      });

      expect(persistedComment).not.toBeNull();
    });

    it('deve retornar 404 quando comentário não existir', async () => {
      const scenario = await createTruthScenario();

      const response = await request(app)
        .delete('/truths/comments/commentario-inexistente')
        .set('Authorization', `Bearer ${scenario.token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /truths/:id/report', () => {
    it('deve denunciar uma truth existente quando usuário autenticado não for o autor', async () => {
      const scenario = await createTruthScenario();
      const reporter = await createCommentReporter();
      const reporterToken = createTokenForUser(reporter);

      const response = await request(app)
        .post(`/truths/${scenario.truth.id}/report`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          reason: 'spam',
          details: 'Esta truth parece spam.',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        truthId: scenario.truth.id,
        reason: 'spam',
        details: 'Esta truth parece spam.',
        createdAt: expect.any(String),
      });

      const persistedReport = await prisma.truthReport.findFirst({
        where: {
          userId: reporter.id,
          truthId: scenario.truth.id,
        },
      });

      expect(persistedReport).toMatchObject({
        userId: reporter.id,
        truthId: scenario.truth.id,
        reason: 'spam',
        details: 'Esta truth parece spam.',
      });
    });

    it('deve retornar 401 ao denunciar truth sem token', async () => {
      const response = await request(app)
        .post('/truths/truth-inexistente/report')
        .send({
          reason: 'spam',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Token não informado',
      });
    });

    it('deve retornar 404 ao denunciar truth inexistente', async () => {
      const scenario = await createTruthScenario();

      const response = await request(app)
        .post('/truths/truth-inexistente/report')
        .set('Authorization', `Bearer ${scenario.token}`)
        .send({
          reason: 'spam',
        });

      expect(response.status).toBe(404);
    });

    it('deve retornar 400 ao denunciar a própria truth', async () => {
      const scenario = await createTruthScenario();
      const authorToken = createTokenForUser(scenario.author);

      const response = await request(app)
        .post(`/truths/${scenario.truth.id}/report`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          reason: 'spam',
        });

      expect(response.status).toBe(400);

      const reportsCount = await prisma.truthReport.count({
        where: {
          truthId: scenario.truth.id,
        },
      });

      expect(reportsCount).toBe(0);
    });

    it('deve retornar 409 ao denunciar a mesma truth duas vezes pelo mesmo usuário', async () => {
      const scenario = await createTruthScenario();
      const reporter = await createCommentReporter();
      const reporterToken = createTokenForUser(reporter);

      await request(app)
        .post(`/truths/${scenario.truth.id}/report`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          reason: 'spam',
        });

      const response = await request(app)
        .post(`/truths/${scenario.truth.id}/report`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          reason: 'harassment',
        });

      expect(response.status).toBe(409);

      const reportsCount = await prisma.truthReport.count({
        where: {
          userId: reporter.id,
          truthId: scenario.truth.id,
        },
      });

      expect(reportsCount).toBe(1);
    });

    it('deve retornar 400 quando o motivo da denúncia da truth for inválido', async () => {
      const scenario = await createTruthScenario();
      const reporter = await createCommentReporter();
      const reporterToken = createTokenForUser(reporter);

      const response = await request(app)
        .post(`/truths/${scenario.truth.id}/report`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          reason: 'motivo-invalido',
        });

      expect(response.status).toBe(400);

      const reportsCount = await prisma.truthReport.count();

      expect(reportsCount).toBe(0);
    });

    it('deve retornar 400 quando os detalhes da denúncia da truth excederem o limite', async () => {
      const scenario = await createTruthScenario();
      const reporter = await createCommentReporter();
      const reporterToken = createTokenForUser(reporter);

      const response = await request(app)
        .post(`/truths/${scenario.truth.id}/report`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          reason: 'other',
          details: 'a'.repeat(1001),
        });

      expect(response.status).toBe(400);

      const reportsCount = await prisma.truthReport.count();

      expect(reportsCount).toBe(0);
    });
  });

  describe('POST /truths/comments/:id/report', () => {
    it('deve denunciar um comentário existente quando usuário autenticado não for o autor', async () => {
      const scenario = await createTruthScenario();
      const reporter = await createCommentReporter();
      const reporterToken = createTokenForUser(reporter);

      const comment = await prisma.truthComment.create({
        data: {
          text: 'Comentário denunciável.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
        },
      });

      const response = await request(app)
        .post(`/truths/comments/${comment.id}/report`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          reason: 'harassment',
          details: 'Comentário ofensivo.',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        commentId: comment.id,
        reason: 'harassment',
        details: 'Comentário ofensivo.',
        createdAt: expect.any(String),
      });

      const persistedReport = await prisma.truthCommentReport.findFirst({
        where: {
          userId: reporter.id,
          commentId: comment.id,
        },
      });

      expect(persistedReport).toMatchObject({
        userId: reporter.id,
        commentId: comment.id,
        reason: 'harassment',
        details: 'Comentário ofensivo.',
      });
    });

    it('deve denunciar uma reply usando o mesmo endpoint de denúncia de comentários', async () => {
      const scenario = await createTruthScenario();
      const reporter = await createCommentReporter();
      const reporterToken = createTokenForUser(reporter);

      const rootComment = await prisma.truthComment.create({
        data: {
          text: 'Comentário raiz com reply denunciável.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
        },
      });

      const reply = await prisma.truthComment.create({
        data: {
          text: 'Reply denunciável.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
          parentId: rootComment.id,
        },
      });

      const response = await request(app)
        .post(`/truths/comments/${reply.id}/report`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          reason: 'hate',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        commentId: reply.id,
        reason: 'hate',
        details: null,
        createdAt: expect.any(String),
      });

      const persistedReport = await prisma.truthCommentReport.findFirst({
        where: {
          userId: reporter.id,
          commentId: reply.id,
        },
      });

      expect(persistedReport).toMatchObject({
        userId: reporter.id,
        commentId: reply.id,
        reason: 'hate',
        details: null,
      });
    });

    it('deve retornar 401 ao denunciar comentário sem token', async () => {
      const response = await request(app)
        .post('/truths/comments/commentario-inexistente/report')
        .send({
          reason: 'spam',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Token não informado',
      });
    });

    it('deve retornar 404 ao denunciar comentário inexistente', async () => {
      const scenario = await createTruthScenario();

      const response = await request(app)
        .post('/truths/comments/commentario-inexistente/report')
        .set('Authorization', `Bearer ${scenario.token}`)
        .send({
          reason: 'spam',
        });

      expect(response.status).toBe(404);
    });

    it('deve retornar 400 ao denunciar o próprio comentário', async () => {
      const scenario = await createTruthScenario();

      const comment = await prisma.truthComment.create({
        data: {
          text: 'Comentário próprio.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
        },
      });

      const response = await request(app)
        .post(`/truths/comments/${comment.id}/report`)
        .set('Authorization', `Bearer ${scenario.token}`)
        .send({
          reason: 'spam',
        });

      expect(response.status).toBe(400);

      const reportsCount = await prisma.truthCommentReport.count({
        where: {
          commentId: comment.id,
        },
      });

      expect(reportsCount).toBe(0);
    });

    it('deve retornar 409 ao denunciar o mesmo comentário duas vezes pelo mesmo usuário', async () => {
      const scenario = await createTruthScenario();
      const reporter = await createCommentReporter();
      const reporterToken = createTokenForUser(reporter);

      const comment = await prisma.truthComment.create({
        data: {
          text: 'Comentário para denúncia duplicada.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
        },
      });

      await request(app)
        .post(`/truths/comments/${comment.id}/report`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          reason: 'spam',
        });

      const response = await request(app)
        .post(`/truths/comments/${comment.id}/report`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          reason: 'violence',
        });

      expect(response.status).toBe(409);

      const reportsCount = await prisma.truthCommentReport.count({
        where: {
          userId: reporter.id,
          commentId: comment.id,
        },
      });

      expect(reportsCount).toBe(1);
    });

    it('deve retornar 400 quando o motivo da denúncia do comentário for inválido', async () => {
      const scenario = await createTruthScenario();
      const reporter = await createCommentReporter();
      const reporterToken = createTokenForUser(reporter);

      const comment = await prisma.truthComment.create({
        data: {
          text: 'Comentário para motivo inválido.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
        },
      });

      const response = await request(app)
        .post(`/truths/comments/${comment.id}/report`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          reason: 'motivo-invalido',
        });

      expect(response.status).toBe(400);

      const reportsCount = await prisma.truthCommentReport.count();

      expect(reportsCount).toBe(0);
    });

    it('deve retornar 400 quando os detalhes da denúncia do comentário excederem o limite', async () => {
      const scenario = await createTruthScenario();
      const reporter = await createCommentReporter();
      const reporterToken = createTokenForUser(reporter);

      const comment = await prisma.truthComment.create({
        data: {
          text: 'Comentário para detalhes longos.',
          truthId: scenario.truth.id,
          userId: scenario.commenter.id,
        },
      });

      const response = await request(app)
        .post(`/truths/comments/${comment.id}/report`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          reason: 'other',
          details: 'a'.repeat(1001),
        });

      expect(response.status).toBe(400);

      const reportsCount = await prisma.truthCommentReport.count();

      expect(reportsCount).toBe(0);
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
