import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptType,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import clubPromptsRoutes from '../src/routes/club-prompts.routes';
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

async function createActiveClubWithMember(role: ClubMemberRole) {
  const owner = await createTestUser();
  const member = await createTestUser();
  const club = await createTestClub({
    createdById: owner.id,
    memberCount: 2,
  });

  await addUserToClub(club.id, owner.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, member.id, {
    role,
    status: ClubMemberStatus.active,
  });

  return {
    owner,
    member,
    club,
  };
}

describe('club-prompts.routes', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('retorna 401 sem token', async () => {
    const response = await request(app)
      .post('/clubs/club-id/prompts')
      .send({
        type: ClubPromptType.truth,
        content: 'Pergunta sem autenticacao.',
      });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      error: expect.any(String),
    });
  });

  it('POST /clubs/:id/prompts cria prompt de verdade autenticado', async () => {
    const { member, club } = await createActiveClubWithMember(
      ClubMemberRole.member,
    );

    const response = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        type: ClubPromptType.truth,
        content: 'Qual segredo voce contaria apenas para o clube?',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      clubId: club.id,
      authorId: member.id,
      authorName: member.name,
      type: ClubPromptType.truth,
      status: 'published',
      content: 'Qual segredo voce contaria apenas para o clube?',
      maxAttempts: null,
      isPinned: false,
      isMembersOnly: true,
    });

    const updatedClub = await prisma.club.findUniqueOrThrow({
      where: {
        id: club.id,
      },
    });

    expect(updatedClub.promptCount).toBe(1);
    expect(updatedClub.lastActivityAt).not.toBeNull();
  });

  it('POST /clubs/:id/prompts cria desafio com campos opcionais', async () => {
    const { member, club } = await createActiveClubWithMember(
      ClubMemberRole.moderator,
    );
    const expiresAt = futureDate(120);

    const response = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        type: ClubPromptType.dare,
        content: 'Entregue uma prova criativa para o desafio.',
        maxAttempts: 4,
        expiresAt: expiresAt.toISOString(),
        difficulty: 'hard',
        isPinned: true,
        attachments: [
          {
            type: 'image',
            url: 'https://example.com/prompt.png',
            name: 'prompt.png',
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      type: ClubPromptType.dare,
      maxAttempts: 4,
      difficulty: 'hard',
      isPinned: true,
    });
    expect(response.body.expiresAt).toBe(expiresAt.toISOString());
    expect(response.body.attachments).toEqual([
      expect.objectContaining({
        type: 'image',
        url: 'https://example.com/prompt.png',
      }),
    ]);

  });

  it('bloqueia outsider com erro padronizado', async () => {
    const owner = await createTestUser();
    const outsider = await createTestUser();
    const club = await createTestClub({
      createdById: owner.id,
      memberCount: 1,
    });

    await addUserToClub(club.id, owner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    const response = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`)
      .send({
        type: ClubPromptType.truth,
        content: 'Tentativa de postar sem participar.',
      });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
  });

  it('retorna 400 para dados invalidos', async () => {
    const { member, club } = await createActiveClubWithMember(
      ClubMemberRole.member,
    );

    const response = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        type: 'invalid',
        content: '  ',
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'CLUB_VALIDATION_ERROR',
    });
  });

  it('retorna 404 para clube inexistente', async () => {
    const user = await createTestUser();

    const response = await request(app)
      .post('/clubs/club-inexistente/prompts')
      .set('Authorization', `Bearer ${authTokenFor(user)}`)
      .send({
        type: ClubPromptType.truth,
        content: 'Pergunta para clube inexistente.',
      });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      code: 'CLUB_NOT_FOUND',
    });
  });

  it('registra audit log na publicacao via rota', async () => {
    const { member, club } = await createActiveClubWithMember(
      ClubMemberRole.member,
    );

    const response = await request(app)
      .post(`/clubs/${club.id}/prompts`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`)
      .send({
        type: ClubPromptType.truth,
        content: 'Pergunta auditada via rota.',
      });

    expect(response.status).toBe(201);

    await expect(
      prisma.clubAuditLog.findFirst({
        where: {
          clubId: club.id,
          actorId: member.id,
          action: 'club_prompt_created',
          entityId: response.body.id,
        },
      }),
    ).resolves.toMatchObject({
      entityType: 'club_prompt',
    });
  });
});
