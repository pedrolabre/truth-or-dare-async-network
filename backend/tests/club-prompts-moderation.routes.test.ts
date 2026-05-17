import express from 'express';
import request from 'supertest';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptStatus,
  ClubPromptType,
  ClubStatus,
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

async function createModerationScenario({
  clubStatus = ClubStatus.active,
  promptStatus = ClubPromptStatus.published,
}: {
  clubStatus?: ClubStatus;
  promptStatus?: ClubPromptStatus;
} = {}) {
  const owner = await createTestUser();
  const admin = await createTestUser();
  const moderator = await createTestUser();
  const author = await createTestUser();
  const member = await createTestUser();
  const outsider = await createTestUser();
  const club = await createTestClub({
    createdById: owner.id,
    status: clubStatus,
    memberCount: 5,
  });

  await addUserToClub(club.id, owner.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, admin.id, {
    role: ClubMemberRole.admin,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, moderator.id, {
    role: ClubMemberRole.moderator,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, author.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(club.id, member.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
  });

  const prompt = await prisma.clubPrompt.create({
    data: {
      clubId: club.id,
      authorId: author.id,
      type: ClubPromptType.truth,
      status: promptStatus,
      content: 'Prompt moderavel do clube.',
      archivedAt:
        promptStatus === ClubPromptStatus.archived ? new Date() : undefined,
      removedAt:
        promptStatus === ClubPromptStatus.removed ? new Date() : undefined,
    },
  });

  if (promptStatus === ClubPromptStatus.published) {
    await prisma.club.update({
      where: {
        id: club.id,
      },
      data: {
        promptCount: 1,
      },
    });
  }

  return {
    owner,
    admin,
    moderator,
    author,
    member,
    outsider,
    club,
    prompt,
  };
}

describe('DELETE /clubs/:id/prompts/:promptId moderation', () => {
  const app = createTestApp();

  applyTestDatabaseHooks();

  beforeEach(async () => {
    await resetFeedData({ deleteUsers: true });
  });

  it('retorna 401 sem token', async () => {
    const response = await request(app).delete('/clubs/club-id/prompts/prompt-id');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      error: expect.any(String),
    });
  });

  it('permite autor arquivar o proprio prompt', async () => {
    const { author, club, prompt } = await createModerationScenario();

    const response = await request(app)
      .delete(`/clubs/${club.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(author)}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: prompt.id,
      status: ClubPromptStatus.archived,
      removedAt: null,
      removedById: null,
      removalReason: null,
      viewerState: {
        canAnswer: false,
        canEdit: false,
        canRemove: false,
      },
    });
    expect(response.body.archivedAt).toEqual(expect.any(String));

    const [persistedPrompt, updatedClub, auditLog] = await Promise.all([
      prisma.clubPrompt.findUniqueOrThrow({
        where: {
          id: prompt.id,
        },
      }),
      prisma.club.findUniqueOrThrow({
        where: {
          id: club.id,
        },
      }),
      prisma.clubAuditLog.findFirst({
        where: {
          clubId: club.id,
          actorId: author.id,
          action: 'club_prompt_archived',
          entityId: prompt.id,
        },
      }),
    ]);

    expect(persistedPrompt.status).toBe(ClubPromptStatus.archived);
    expect(persistedPrompt.archivedAt).not.toBeNull();
    expect(updatedClub.promptCount).toBe(0);
    expect(auditLog).toMatchObject({
      entityType: 'club_prompt',
    });
  });

  it.each([
    ['owner', ClubMemberRole.owner],
    ['admin', ClubMemberRole.admin],
    ['moderator', ClubMemberRole.moderator],
  ])('permite %s remover prompt de outro autor', async (_, role) => {
    const scenario = await createModerationScenario();
    const actor =
      role === ClubMemberRole.owner
        ? scenario.owner
        : role === ClubMemberRole.admin
          ? scenario.admin
          : scenario.moderator;

    const response = await request(app)
      .delete(`/clubs/${scenario.club.id}/prompts/${scenario.prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(actor)}`)
      .send({
        removalReason: `Remocao por ${role}`,
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: scenario.prompt.id,
      status: ClubPromptStatus.removed,
      archivedAt: null,
      removedById: actor.id,
      removalReason: `Remocao por ${role}`,
      viewerState: {
        canAnswer: false,
        canEdit: false,
        canRemove: false,
      },
    });
    expect(response.body.removedAt).toEqual(expect.any(String));

    const updatedClub = await prisma.club.findUniqueOrThrow({
      where: {
        id: scenario.club.id,
      },
    });

    expect(updatedClub.promptCount).toBe(0);
  });

  it('bloqueia membro comum nao autor e outsider', async () => {
    const { member, outsider, club, prompt } = await createModerationScenario();

    const memberResponse = await request(app)
      .delete(`/clubs/${club.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(member)}`);
    const outsiderResponse = await request(app)
      .delete(`/clubs/${club.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(outsider)}`);

    expect(memberResponse.status).toBe(403);
    expect(memberResponse.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
    expect(outsiderResponse.status).toBe(403);
    expect(outsiderResponse.body).toMatchObject({
      code: 'CLUB_FORBIDDEN',
    });
  });

  it('retorna 404 para prompt inexistente ou de outro clube', async () => {
    const { admin, club, prompt } = await createModerationScenario();
    const otherOwner = await createTestUser();
    const otherClub = await createTestClub({
      createdById: otherOwner.id,
      memberCount: 1,
    });

    await addUserToClub(otherClub.id, otherOwner.id, {
      role: ClubMemberRole.owner,
      status: ClubMemberStatus.active,
    });

    const missingResponse = await request(app)
      .delete(`/clubs/${club.id}/prompts/prompt-inexistente`)
      .set('Authorization', `Bearer ${authTokenFor(admin)}`);
    const wrongClubResponse = await request(app)
      .delete(`/clubs/${otherClub.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(admin)}`);

    expect(missingResponse.status).toBe(404);
    expect(wrongClubResponse.status).toBe(404);
  });

  it('bloqueia clube inativo e prompt ja arquivado ou removido', async () => {
    const archivedClubScenario = await createModerationScenario({
      clubStatus: ClubStatus.archived,
    });
    const archivedPromptScenario = await createModerationScenario({
      promptStatus: ClubPromptStatus.archived,
    });
    const removedPromptScenario = await createModerationScenario({
      promptStatus: ClubPromptStatus.removed,
    });

    const archivedClubResponse = await request(app)
      .delete(
        `/clubs/${archivedClubScenario.club.id}/prompts/${archivedClubScenario.prompt.id}`,
      )
      .set('Authorization', `Bearer ${authTokenFor(archivedClubScenario.admin)}`);
    const archivedPromptResponse = await request(app)
      .delete(
        `/clubs/${archivedPromptScenario.club.id}/prompts/${archivedPromptScenario.prompt.id}`,
      )
      .set('Authorization', `Bearer ${authTokenFor(archivedPromptScenario.admin)}`);
    const removedPromptResponse = await request(app)
      .delete(
        `/clubs/${removedPromptScenario.club.id}/prompts/${removedPromptScenario.prompt.id}`,
      )
      .set('Authorization', `Bearer ${authTokenFor(removedPromptScenario.admin)}`);

    expect(archivedClubResponse.status).toBe(403);
    expect(archivedPromptResponse.status).toBe(403);
    expect(removedPromptResponse.status).toBe(403);
  });

  it('registra audit log de remocao moderada', async () => {
    const { moderator, club, prompt } = await createModerationScenario();

    const response = await request(app)
      .delete(`/clubs/${club.id}/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${authTokenFor(moderator)}`)
      .send({
        removalReason: 'Conteudo fora das regras.',
      });

    expect(response.status).toBe(200);

    await expect(
      prisma.clubAuditLog.findFirst({
        where: {
          clubId: club.id,
          actorId: moderator.id,
          action: 'club_prompt_removed',
          entityType: 'club_prompt',
          entityId: prompt.id,
        },
      }),
    ).resolves.toMatchObject({
      action: 'club_prompt_removed',
    });
  });
});
