import {
  ClubMemberStatus,
  ClubStatus,
} from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { getPermissions } from '../clubs/core/permissions';
import { getClubWithMembers } from '../clubs/core/repository';
import {
  assertMemberCanPost,
  assertMemberCanUseClub,
} from '../clubs/moderation.service';
import {
  canAnswerPrompt,
  getActivePromptMembership,
} from '../clubs/prompts/permissions';
import {
  NormalizedUploadInput,
  UploadServiceError,
} from './upload-validators';

async function assertClubEditPermission(userId: string, clubId: string) {
  const club = await getClubWithMembers(clubId);
  const permissions = getPermissions(club, userId);

  if (!permissions.canEditClub) {
    throw new UploadServiceError(
      'Sem permissao para assinar upload de midia deste clube',
      403,
    );
  }
}

async function assertDareProofPermission(userId: string, dareId: string) {
  const dare = await prisma.dare.findUnique({
    where: {
      id: dareId,
    },
    select: {
      id: true,
      targetUserId: true,
      completedAt: true,
      expiresAt: true,
      attemptsUsed: true,
      maxAttempts: true,
    },
  });

  if (!dare) {
    throw new UploadServiceError('Dare nao encontrado', 404);
  }

  if (dare.targetUserId !== userId) {
    throw new UploadServiceError(
      'Apenas o usuario desafiado pode enviar prova para este dare',
      403,
    );
  }

  if (dare.completedAt) {
    throw new UploadServiceError('Este dare ja foi concluido', 409);
  }

  if (dare.expiresAt && dare.expiresAt.getTime() < Date.now()) {
    throw new UploadServiceError('Este dare esta expirado', 409);
  }

  if (dare.attemptsUsed >= dare.maxAttempts) {
    throw new UploadServiceError(
      'Este dare nao possui tentativas disponiveis',
      409,
    );
  }
}

async function truthExists(entityId: string) {
  const truth = await prisma.truth.findUnique({
    where: {
      id: entityId,
    },
    select: {
      id: true,
    },
  });

  return Boolean(truth);
}

async function getPromptForAttachment(promptId: string, userId: string) {
  const prompt = await prisma.clubPrompt.findUnique({
    where: {
      id: promptId,
    },
    include: {
      club: {
        include: {
          members: {
            where: {
              userId,
            },
          },
        },
      },
    },
  });

  if (
    !prompt ||
    prompt.club.status === ClubStatus.deleted ||
    prompt.club.deletedAt
  ) {
    return null;
  }

  return prompt;
}

async function assertClubPromptInteractionPermission(
  userId: string,
  promptId: string,
) {
  const prompt = await getPromptForAttachment(promptId, userId);

  if (!prompt) {
    throw new UploadServiceError('Entidade de upload nao encontrada', 404);
  }

  const membership = getActivePromptMembership(prompt.club.members, userId);

  if (!canAnswerPrompt({ club: prompt.club, prompt, membership })) {
    throw new UploadServiceError(
      'Sem permissao para anexar midia nesta entidade',
      403,
    );
  }

  try {
    assertMemberCanPost(membership);
  } catch {
    throw new UploadServiceError(
      'Sem permissao para anexar midia nesta entidade',
      403,
    );
  }

  if (prompt.expiresAt && prompt.expiresAt.getTime() <= Date.now()) {
    throw new UploadServiceError(
      'Sem permissao para anexar midia nesta entidade',
      403,
    );
  }
}

async function assertClubPromptCreationAttachmentPermission(
  userId: string,
  clubId: string,
) {
  const club = await prisma.club.findUnique({
    where: {
      id: clubId,
    },
    include: {
      members: {
        where: {
          userId,
        },
      },
    },
  });

  if (!club || club.status === ClubStatus.deleted || club.deletedAt) {
    throw new UploadServiceError('Clube nao encontrado', 404);
  }

  const membership = club.members.find((member) => member.userId === userId);
  const isActiveMember = membership?.status === ClubMemberStatus.active;

  if (!isActiveMember || club.status !== ClubStatus.active) {
    throw new UploadServiceError(
      'Sem permissao para anexar midia neste clube',
      403,
    );
  }

  try {
    assertMemberCanUseClub(membership);
    assertMemberCanPost(membership);
  } catch {
    throw new UploadServiceError(
      'Sem permissao para anexar midia neste clube',
      403,
    );
  }
}

async function assertCommentAttachmentPermission(
  userId: string,
  entityId: string,
) {
  if (await truthExists(entityId)) {
    return;
  }

  await assertClubPromptInteractionPermission(userId, entityId);
}

export async function assertUploadPermission(
  userId: string,
  input: NormalizedUploadInput,
) {
  if (input.canonicalUsage === 'profile-avatar') {
    if (input.entityId && input.entityId !== userId) {
      throw new UploadServiceError(
        'Apenas o proprio usuario pode assinar avatar de perfil',
        403,
      );
    }

    return;
  }

  if (!input.entityId) {
    throw new UploadServiceError(`entityId e obrigatorio para ${input.usage}`);
  }

  if (
    input.canonicalUsage === 'club-avatar' ||
    input.canonicalUsage === 'club-cover'
  ) {
    await assertClubEditPermission(userId, input.entityId);
    return;
  }

  if (input.canonicalUsage === 'dare-proof') {
    await assertDareProofPermission(userId, input.entityId);
    return;
  }

  if (input.canonicalUsage === 'comment-attachment') {
    await assertCommentAttachmentPermission(userId, input.entityId);
    return;
  }

  if (input.canonicalUsage === 'club-prompt-attachment') {
    await assertClubPromptCreationAttachmentPermission(userId, input.entityId);
    return;
  }

  if (input.canonicalUsage === 'club-response-attachment') {
    await assertClubPromptInteractionPermission(userId, input.entityId);
  }
}
