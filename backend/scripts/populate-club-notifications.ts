import 'dotenv/config';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptType,
  ClubVisibility,
  NotificationType,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import {
  addUserToClub,
  createTestClub,
  createTestClubPrompt,
  createTestNotification,
  createTestUser,
} from '../src/test-utils/factories';

const DEFAULT_TEST_PASSWORD = '123456';

const SEED_USER_EMAILS = [
  'clubes-owner@test.com',
  'clubes-admin@test.com',
  'clubes-moderador@test.com',
  'clubes-membro@test.com',
  'clubes-mutado@test.com',
  'clubes-convidado@test.com',
  'clubes-solicitante@test.com',
];

const SEED_CLUB_SLUGS = [
  'seed-clubes-pulso-alto',
  'seed-clubes-silenciado',
];

type PopulateClubNotificationsOptions = {
  baseDate?: Date;
};

function minutesAfter(baseDate: Date, minutes: number) {
  return new Date(baseDate.getTime() + minutes * 60 * 1000);
}

async function cleanupPreviousScenario() {
  await prisma.notification.deleteMany({
    where: {
      OR: [
        {
          user: {
            email: {
              in: SEED_USER_EMAILS,
            },
          },
        },
        {
          club: {
            slug: {
              in: SEED_CLUB_SLUGS,
            },
          },
        },
      ],
    },
  });

  await prisma.club.deleteMany({
    where: {
      slug: {
        in: SEED_CLUB_SLUGS,
      },
    },
  });
}

export async function populateClubNotifications(
  options: PopulateClubNotificationsOptions = {},
) {
  const baseDate = options.baseDate ?? new Date();
  const mutedUntil = minutesAfter(baseDate, 24 * 60);

  await cleanupPreviousScenario();

  const owner = await createTestUser({
    name: 'Clara Owner Clubes',
    email: 'clubes-owner@test.com',
    password: DEFAULT_TEST_PASSWORD,
    username: 'clubes_owner',
    createdAt: minutesAfter(baseDate, -300),
  });
  const admin = await createTestUser({
    name: 'Bruno Admin Clubes',
    email: 'clubes-admin@test.com',
    password: DEFAULT_TEST_PASSWORD,
    username: 'clubes_admin',
    createdAt: minutesAfter(baseDate, -299),
  });
  const moderator = await createTestUser({
    name: 'Marta Moderadora Clubes',
    email: 'clubes-moderador@test.com',
    password: DEFAULT_TEST_PASSWORD,
    username: 'clubes_moderadora',
    createdAt: minutesAfter(baseDate, -298),
  });
  const member = await createTestUser({
    name: 'Lia Membro Clubes',
    email: 'clubes-membro@test.com',
    password: DEFAULT_TEST_PASSWORD,
    username: 'clubes_membro',
    createdAt: minutesAfter(baseDate, -297),
  });
  const mutedMember = await createTestUser({
    name: 'Nico Mutado Clubes',
    email: 'clubes-mutado@test.com',
    password: DEFAULT_TEST_PASSWORD,
    username: 'clubes_mutado',
    createdAt: minutesAfter(baseDate, -296),
  });
  const invitee = await createTestUser({
    name: 'Iris Convidada Clubes',
    email: 'clubes-convidado@test.com',
    password: DEFAULT_TEST_PASSWORD,
    username: 'clubes_convidada',
    createdAt: minutesAfter(baseDate, -295),
  });
  const requester = await createTestUser({
    name: 'Ravi Solicitante Clubes',
    email: 'clubes-solicitante@test.com',
    password: DEFAULT_TEST_PASSWORD,
    username: 'clubes_solicitante',
    createdAt: minutesAfter(baseDate, -294),
  });

  const activeClub = await createTestClub({
    createdById: owner.id,
    name: 'Seed Clubes Pulso Alto',
    slug: 'seed-clubes-pulso-alto',
    description: 'Cenario denso de atividade, convites e notificacoes.',
    iconName: 'notifications-active',
    visibility: ClubVisibility.private,
    memberCount: 5,
    tags: ['seed', 'notificacoes', 'atividade'],
    createdAt: minutesAfter(baseDate, -260),
  });
  const mutedClub = await createTestClub({
    createdById: owner.id,
    name: 'Seed Clubes Silenciado',
    slug: 'seed-clubes-silenciado',
    description: 'Cenario com clube mutado para validar badges e silencio.',
    iconName: 'notifications-off',
    visibility: ClubVisibility.public,
    memberCount: 3,
    tags: ['seed', 'mute'],
    createdAt: minutesAfter(baseDate, -250),
  });

  await addUserToClub(activeClub.id, owner.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
    lastSeenAt: minutesAfter(baseDate, -80),
  });
  await addUserToClub(activeClub.id, admin.id, {
    role: ClubMemberRole.admin,
    status: ClubMemberStatus.active,
    lastSeenAt: minutesAfter(baseDate, -70),
  });
  await addUserToClub(activeClub.id, moderator.id, {
    role: ClubMemberRole.moderator,
    status: ClubMemberStatus.active,
    lastSeenAt: minutesAfter(baseDate, -60),
  });
  await addUserToClub(activeClub.id, member.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
    lastSeenAt: minutesAfter(baseDate, -90),
  });
  await addUserToClub(activeClub.id, mutedMember.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
    lastSeenAt: minutesAfter(baseDate, -120),
    mutedUntil,
  });
  await addUserToClub(activeClub.id, invitee.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.invited,
    joinedAt: null,
  });
  await addUserToClub(activeClub.id, requester.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.requested,
    joinedAt: null,
  });

  await addUserToClub(mutedClub.id, owner.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
  });
  await addUserToClub(mutedClub.id, member.id, {
    role: ClubMemberRole.member,
    status: ClubMemberStatus.active,
    mutedUntil,
    lastSeenAt: minutesAfter(baseDate, -40),
  });
  await addUserToClub(mutedClub.id, admin.id, {
    role: ClubMemberRole.admin,
    status: ClubMemberStatus.active,
  });

  const invite = await prisma.clubInvite.create({
    data: {
      clubId: activeClub.id,
      inviteeId: invitee.id,
      inviterId: admin.id,
      message: 'Entre no cenario denso de notificacoes.',
      expiresAt: minutesAfter(baseDate, 7 * 24 * 60),
      createdAt: minutesAfter(baseDate, -50),
    },
  });

  const joinRequest = await prisma.clubJoinRequest.create({
    data: {
      clubId: activeClub.id,
      userId: requester.id,
      message: 'Quero testar o fluxo de solicitacao.',
      createdAt: minutesAfter(baseDate, -45),
    },
  });

  const truthPrompt = await createTestClubPrompt({
    clubId: activeClub.id,
    authorId: owner.id,
    type: ClubPromptType.truth,
    content: 'Qual notificacao voce nao quer perder neste clube?',
    createdAt: minutesAfter(baseDate, -35),
  });
  const darePrompt = await createTestClubPrompt({
    clubId: activeClub.id,
    authorId: moderator.id,
    type: ClubPromptType.dare,
    content: 'Responda um desafio e mencione @clubes_membro.',
    maxAttempts: 3,
    expiresAt: minutesAfter(baseDate, 180),
    createdAt: minutesAfter(baseDate, -25),
  });
  const mutedPrompt = await createTestClubPrompt({
    clubId: mutedClub.id,
    authorId: owner.id,
    type: ClubPromptType.truth,
    content: 'Este prompt valida um clube silenciado no mobile.',
    createdAt: minutesAfter(baseDate, -20),
  });

  const truthResponse = await prisma.clubPromptResponse.create({
    data: {
      clubId: activeClub.id,
      promptId: truthPrompt.id,
      userId: member.id,
      text: 'Eu quero ver comentarios e mencoes sem push real.',
      completedAt: minutesAfter(baseDate, -30),
      createdAt: minutesAfter(baseDate, -30),
    },
  });
  const dareResponse = await prisma.clubPromptResponse.create({
    data: {
      clubId: activeClub.id,
      promptId: darePrompt.id,
      userId: admin.id,
      text: 'Desafio cumprido com atividade densa.',
      attemptsUsed: 1,
      completedAt: minutesAfter(baseDate, -15),
      createdAt: minutesAfter(baseDate, -15),
    },
  });

  const promptComment = await prisma.clubPromptComment.create({
    data: {
      clubId: activeClub.id,
      promptId: truthPrompt.id,
      responseId: truthResponse.id,
      userId: admin.id,
      text: 'Comentario operacional com @clubes_membro e sem canal de push.',
      createdAt: minutesAfter(baseDate, -10),
    },
  });
  const mutedClubComment = await prisma.clubPromptComment.create({
    data: {
      clubId: mutedClub.id,
      promptId: mutedPrompt.id,
      userId: admin.id,
      text: 'Comentario em clube mutado para conferir ausencia de badge novo.',
      createdAt: minutesAfter(baseDate, -8),
    },
  });

  await prisma.clubPrompt.update({
    where: {
      id: truthPrompt.id,
    },
    data: {
      answersCount: 1,
      commentsCount: 1,
    },
  });
  await prisma.clubPrompt.update({
    where: {
      id: darePrompt.id,
    },
    data: {
      answersCount: 1,
    },
  });
  await prisma.clubPromptResponse.update({
    where: {
      id: truthResponse.id,
    },
    data: {
      commentsCount: 1,
    },
  });
  await prisma.club.update({
    where: {
      id: activeClub.id,
    },
    data: {
      promptCount: 2,
      lastActivityAt: minutesAfter(baseDate, -10),
    },
  });
  await prisma.club.update({
    where: {
      id: mutedClub.id,
    },
    data: {
      promptCount: 1,
      lastActivityAt: minutesAfter(baseDate, -8),
    },
  });

  const notifications = await Promise.all([
    createTestNotification({
      userId: invitee.id,
      actorId: admin.id,
      type: NotificationType.club_invite_received,
      title: 'Convite recebido',
      body: 'Voce recebeu um convite para Seed Clubes Pulso Alto.',
      deepLink: `/clubs/${activeClub.id}`,
      clubId: activeClub.id,
      referenceType: 'club_invite',
      referenceId: invite.id,
      dedupeKey: `seed:club_invite_received:${invitee.id}:${invite.id}`,
      createdAt: minutesAfter(baseDate, -50),
    }),
    createTestNotification({
      userId: owner.id,
      actorId: requester.id,
      type: NotificationType.club_join_request_received,
      title: 'Nova solicitacao de entrada',
      body: 'Ravi pediu para entrar no clube.',
      deepLink: `/clubs/${activeClub.id}`,
      clubId: activeClub.id,
      referenceType: 'club_join_request',
      referenceId: joinRequest.id,
      dedupeKey: `seed:club_join_request_received:${owner.id}:${joinRequest.id}`,
      createdAt: minutesAfter(baseDate, -45),
    }),
    createTestNotification({
      userId: member.id,
      actorId: owner.id,
      type: NotificationType.club_new_prompt,
      title: 'Novo prompt no clube',
      body: 'Seed Clubes Pulso Alto tem um novo prompt.',
      deepLink: `/clubs/${activeClub.id}/prompts/${truthPrompt.id}`,
      clubId: activeClub.id,
      referenceType: 'club_prompt',
      referenceId: truthPrompt.id,
      dedupeKey: `seed:club_new_prompt:${member.id}:${truthPrompt.id}`,
      createdAt: minutesAfter(baseDate, -35),
    }),
    createTestNotification({
      userId: owner.id,
      actorId: member.id,
      type: NotificationType.club_prompt_response,
      title: 'Nova resposta',
      body: 'Um prompt recebeu uma resposta.',
      deepLink: `/clubs/${activeClub.id}/prompts/${truthPrompt.id}`,
      clubId: activeClub.id,
      referenceType: 'club_prompt_response',
      referenceId: truthResponse.id,
      readAt: minutesAfter(baseDate, -20),
      dedupeKey: `seed:club_prompt_response:${owner.id}:${truthResponse.id}`,
      createdAt: minutesAfter(baseDate, -30),
    }),
    createTestNotification({
      userId: member.id,
      actorId: admin.id,
      type: NotificationType.club_prompt_comment,
      title: 'Novo comentario',
      body: 'Um prompt recebeu um comentario.',
      deepLink: `/clubs/${activeClub.id}/prompts/${truthPrompt.id}`,
      clubId: activeClub.id,
      referenceType: 'club_prompt_comment',
      referenceId: promptComment.id,
      dedupeKey: `seed:club_prompt_comment:${member.id}:${promptComment.id}`,
      createdAt: minutesAfter(baseDate, -10),
    }),
    createTestNotification({
      userId: member.id,
      actorId: moderator.id,
      type: NotificationType.club_mention,
      title: 'Voce foi mencionado',
      body: 'Voce foi mencionado em Seed Clubes Pulso Alto.',
      deepLink: `/clubs/${activeClub.id}/prompts/${darePrompt.id}`,
      clubId: activeClub.id,
      referenceType: 'club_prompt_comment',
      referenceId: promptComment.id,
      readAt: minutesAfter(baseDate, -5),
      dedupeKey: `seed:club_mention:${member.id}:${promptComment.id}`,
      createdAt: minutesAfter(baseDate, -9),
    }),
    createTestNotification({
      userId: mutedMember.id,
      actorId: owner.id,
      type: NotificationType.club_member_promoted,
      title: 'Papel atualizado',
      body: 'Seu papel no clube foi atualizado.',
      deepLink: `/clubs/${activeClub.id}`,
      clubId: activeClub.id,
      referenceType: 'club_member',
      referenceId: mutedMember.id,
      dedupeKey: `seed:club_member_promoted:${mutedMember.id}:${activeClub.id}`,
      createdAt: minutesAfter(baseDate, -6),
    }),
  ]);

  return {
    users: {
      owner,
      admin,
      moderator,
      member,
      mutedMember,
      invitee,
      requester,
    },
    clubs: {
      activeClub,
      mutedClub,
    },
    invites: [invite],
    joinRequests: [joinRequest],
    prompts: [truthPrompt, darePrompt, mutedPrompt],
    responses: [truthResponse, dareResponse],
    comments: [promptComment, mutedClubComment],
    notifications,
    mutedUntil,
  };
}

async function main() {
  console.log('Iniciando population densa de Clubes e notificacoes...');
  console.log('O script atualiza apenas o cenario seed conhecido.');

  const scenario = await populateClubNotifications();

  console.log('Population densa de Clubes e notificacoes concluida.');
  console.log('');
  console.log('Resumo do cenario criado:');
  console.log(`- Usuarios de teste: ${Object.keys(scenario.users).length}`);
  console.log(`- Clubes: ${Object.keys(scenario.clubs).length}`);
  console.log(`- Convites: ${scenario.invites.length}`);
  console.log(`- Requests: ${scenario.joinRequests.length}`);
  console.log(`- Prompts: ${scenario.prompts.length}`);
  console.log(`- Respostas: ${scenario.responses.length}`);
  console.log(`- Comentarios: ${scenario.comments.length}`);
  console.log(`- Notificacoes persistentes: ${scenario.notifications.length}`);
  console.log('');
  console.log('Conta principal para conferir no mobile:');
  console.log(`- ${scenario.users.member.email} / ${DEFAULT_TEST_PASSWORD}`);
  console.log('Conta com clube mutado:');
  console.log(`- ${scenario.users.mutedMember.email} / ${DEFAULT_TEST_PASSWORD}`);
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error('Erro ao popular Clubes e notificacoes:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
