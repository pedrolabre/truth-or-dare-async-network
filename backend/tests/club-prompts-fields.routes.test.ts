import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptType,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import clubPromptsRoutes from '../src/routes/clubs/prompts.routes';
import {
  addUserToClub,
  createTestClub,
  createTestUser,
  resetFeedData,
} from '../src/test-utils/factories';
import { generateToken } from '../src/utils/jwt';
import { applyTestDatabaseHooks } from './test-db';

function createTestApp() {
  const app = express();

  app.use(express.json());
  app.use('/clubs', clubPromptsRoutes);

  return app;
}

function authTokenFor(user: { id: string; email: string; name: string }) {
  return generateToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });
}

function futureDate(minutes = 60) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

async function createFieldsScenario() {
  const owner = await createTestUser();
  const moderator = await createTestUser();
  const member = await createTestUser();
  const club = await createTestClub({
    createdById: owner.id,
    memberCount: 3,
  });

  await addUserToClub(club.id, owner.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, moderator.id, {
    role: ClubMemberRole.moderator,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, member.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
  });

  return {
    owner,
    moderator,
    member,
    club,
  };
}

describe('club prompt fields contract', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('cria desafio com campos completos e retorna os mesmos campos no detalhe', async () => {
    const { moderator, club } = await createFieldsScenario();
    const expiresAt = futureDate(120);

    const createResponse = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(moderator)}`)
      .send({
        type: ClubPromptType.dare,
        content: 'Entregue uma prova criativa para o contrato de campos.',
        maxAttempts: 5,
        expiresAt: expiresAt.toISOString(),
        difficulty: 'hard',
        attachments: [
          {
            type: 'image',
            url: 'https://example.com/fields.png',
            name: 'fields.png',
            mimeType: 'image/png',
            sizeBytes: 2048,
          },
        ],
        isPinned: true,
        isMembersOnly: false,
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      type: ClubPromptType.dare,
      content: 'Entregue uma prova criativa para o contrato de campos.',
      maxAttempts: 5,
      expiresAt: expiresAt.toISOString(),
      difficulty: 'hard',
      isPinned: true,
      isMembersOnly: false,
    });

    const detailResponse = await request(app)
      .get(`/clubs/${club.id}/prompts/${createResponse.body.id}`)
      .set('Authorization', `Bearer ${authTokenFor(moderator)}`);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body).toMatchObject({
      id: createResponse.body.id,
      type: ClubPromptType.dare,
      content: 'Entregue uma prova criativa para o contrato de campos.',
      maxAttempts: 5,
      expiresAt: expiresAt.toISOString(),
      difficulty: 'hard',
      isPinned: true,
      isMembersOnly: false,
    });
    expect(detailResponse.body.attachments).toEqual([
      expect.objectContaining({
        type: 'image',
        url: 'https://example.com/fields.png',
        name: 'fields.png',
        mimeType: 'image/png',
        sizeBytes: 2048,
      }),
    ]);
  });

  it('edita campos completos e preserva contrato no detalhe', async () => {
    const { owner, member, club } = await createFieldsScenario();
    const createResponse = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        type: ClubPromptType.truth,
        content: 'Pergunta inicial para edicao de campos.',
        maxAttempts: 10,
      });
    const expiresAt = futureDate(180);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      type: ClubPromptType.truth,
      maxAttempts: null,
    });

    const editResponse = await request(app)
      .patch(`/clubs/${club.id}/prompts/${createResponse.body.id}`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        type: ClubPromptType.dare,
        content: 'Desafio atualizado com todos os campos.',
        maxAttempts: 2,
        expiresAt: expiresAt.toISOString(),
        difficulty: 'medium',
        attachments: [
          {
            type: 'link',
            url: 'https://example.com/regras',
            name: 'Regras do desafio',
          },
        ],
        isPinned: true,
        isMembersOnly: true,
      });

    expect(editResponse.status).toBe(200);
    expect(editResponse.body).toMatchObject({
      type: ClubPromptType.dare,
      content: 'Desafio atualizado com todos os campos.',
      maxAttempts: 2,
      expiresAt: expiresAt.toISOString(),
      difficulty: 'medium',
      isPinned: true,
      isMembersOnly: true,
    });

    const detailResponse = await request(app)
      .get(`/clubs/${club.id}/prompts/${createResponse.body.id}`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body).toMatchObject({
      type: ClubPromptType.dare,
      content: 'Desafio atualizado com todos os campos.',
      maxAttempts: 2,
      expiresAt: expiresAt.toISOString(),
      difficulty: 'medium',
      isPinned: true,
      isMembersOnly: true,
    });
    expect(detailResponse.body.attachments).toEqual([
      expect.objectContaining({
        type: 'link',
        url: 'https://example.com/regras',
        name: 'Regras do desafio',
      }),
    ]);
  });

  it('preserva campos do prompt no retorno apos arquivamento ou moderacao', async () => {
    const { owner, member, club } = await createFieldsScenario();
    const authorPrompt = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        type: ClubPromptType.dare,
        content: 'Desafio que sera arquivado pelo autor.',
        maxAttempts: 3,
        difficulty: 'easy',
        attachments: [
          {
            type: 'file',
            url: 'https://example.com/prova.pdf',
          },
        ],
      });
    const moderatedPrompt = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        type: ClubPromptType.truth,
        content: 'Pergunta que sera removida por moderacao.',
      });

    const archiveResponse = await request(app)
      .delete(`/clubs/${club.id}/prompts/${authorPrompt.body.id}`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);
    const moderationResponse = await request(app)
      .delete(`/clubs/${club.id}/prompts/${moderatedPrompt.body.id}`)
      .set('Authorization', `Bearer ${authTokenFor(owner)}`)
      .send({
        removalReason: 'Contrato preservado apos moderacao.',
      });

    expect(archiveResponse.status).toBe(200);
    expect(archiveResponse.body).toMatchObject({
      type: ClubPromptType.dare,
      content: 'Desafio que sera arquivado pelo autor.',
      maxAttempts: 3,
      difficulty: 'easy',
      status: 'archived',
    });
    expect(archiveResponse.body.attachments).toEqual([
      expect.objectContaining({
        type: 'file',
        url: 'https://example.com/prova.pdf',
      }),
    ]);

    expect(moderationResponse.status).toBe(200);
    expect(moderationResponse.body).toMatchObject({
      type: ClubPromptType.truth,
      content: 'Pergunta que sera removida por moderacao.',
      maxAttempts: null,
      difficulty: null,
      attachments: [],
      status: 'removed',
      removalReason: 'Contrato preservado apos moderacao.',
    });
  });

  it('valida prazo anexos e destaque por papel', async () => {
    const { member, club } = await createFieldsScenario();

    const pastDateResponse = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        type: ClubPromptType.dare,
        content: 'Desafio com prazo passado.',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      });
    const invalidAttachmentResponse = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        type: ClubPromptType.dare,
        content: 'Desafio com anexo invalido.',
        attachments: [
          {
            type: 'image',
          },
        ],
      });
    const pinnedByMemberResponse = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        type: ClubPromptType.truth,
        content: 'Membro comum tentando destacar.',
        isPinned: true,
      });

    expect(pastDateResponse.status).toBe(400);
    expect(pastDateResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
    expect(invalidAttachmentResponse.status).toBe(400);
    expect(invalidAttachmentResponse.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
    expect(pinnedByMemberResponse.status).toBe(403);
    expect(pinnedByMemberResponse.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
  });
});
