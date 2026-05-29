import 'dotenv/config';
import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptType,
  ClubVisibility,
} from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import {
  addUserToClub,
  createTestClub,
  createTestClubPrompt,
  createTestDare,
  createTestTruth,
  createTestUser,
} from '../src/test-utils/factories';

const DEFAULT_TEST_PASSWORD = '123456';

const SEED_USER_EMAILS = [
  'busca-viewer@test.com',
  'busca-lia@test.com',
  'busca-rafa@test.com',
  'busca-nina@test.com',
  'busca-caio@test.com',
  'busca-bia@test.com',
];

const SEED_CLUB_SLUGS = [
  'seed-busca-noite-da-verdade',
  'seed-busca-desafios-relampago',
  'seed-busca-roda-criativa',
];

type PopulateSearchOptions = {
  baseDate?: Date;
};

function minutesAfter(baseDate: Date, minutes: number) {
  return new Date(baseDate.getTime() + minutes * 60 * 1000);
}

async function cleanupPreviousScenario() {
  await prisma.club.deleteMany({
    where: {
      slug: {
        in: SEED_CLUB_SLUGS,
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        in: SEED_USER_EMAILS,
      },
    },
  });
}

export async function populateSearch(options: PopulateSearchOptions = {}) {
  const baseDate = options.baseDate ?? new Date();

  await cleanupPreviousScenario();

  const viewer = await createTestUser({
    name: 'Viewer Busca',
    email: 'busca-viewer@test.com',
    password: DEFAULT_TEST_PASSWORD,
    username: 'busca_viewer',
    createdAt: minutesAfter(baseDate, -400),
  });
  const lia = await createTestUser({
    name: 'Lia Nivel Inicial',
    email: 'busca-lia@test.com',
    password: DEFAULT_TEST_PASSWORD,
    username: 'lia_busca',
    createdAt: minutesAfter(baseDate, -360),
  });
  const rafa = await createTestUser({
    name: 'Rafa Desafios Medios',
    email: 'busca-rafa@test.com',
    password: DEFAULT_TEST_PASSWORD,
    username: 'rafa_desafios',
    createdAt: minutesAfter(baseDate, -320),
  });
  const nina = await createTestUser({
    name: 'Nina Verdades Avancadas',
    email: 'busca-nina@test.com',
    password: DEFAULT_TEST_PASSWORD,
    username: 'nina_verdades',
    createdAt: minutesAfter(baseDate, -280),
  });
  const caio = await createTestUser({
    name: 'Caio Clubeiro Ativo',
    email: 'busca-caio@test.com',
    password: DEFAULT_TEST_PASSWORD,
    username: 'caio_clubes',
    createdAt: minutesAfter(baseDate, -240),
  });
  const bia = await createTestUser({
    name: 'Bia Prompts Rapidos',
    email: 'busca-bia@test.com',
    password: DEFAULT_TEST_PASSWORD,
    username: 'bia_prompts',
    createdAt: minutesAfter(baseDate, -200),
  });

  await prisma.user.updateMany({
    where: {
      email: {
        in: SEED_USER_EMAILS,
      },
    },
    data: {
      bio: 'Perfil publico de desenvolvimento para validar a busca.',
    },
  });

  const truthClub = await createTestClub({
    createdById: viewer.id,
    name: 'Seed Busca Noite da Verdade',
    slug: 'seed-busca-noite-da-verdade',
    description: 'Clube publico com verdades recentes para descoberta.',
    iconName: 'question-answer',
    visibility: ClubVisibility.public,
    memberCount: 4,
    tags: ['busca', 'verdade', 'popular'],
    createdAt: minutesAfter(baseDate, -180),
  });
  const dareClub = await createTestClub({
    createdById: rafa.id,
    name: 'Seed Busca Desafios Relampago',
    slug: 'seed-busca-desafios-relampago',
    description: 'Clube publico com crescimento recente de membros.',
    iconName: 'bolt',
    visibility: ClubVisibility.public,
    memberCount: 5,
    tags: ['busca', 'desafio', 'tendencia'],
    createdAt: minutesAfter(baseDate, -160),
  });
  const creativeClub = await createTestClub({
    createdById: nina.id,
    name: 'Seed Busca Roda Criativa',
    slug: 'seed-busca-roda-criativa',
    description: 'Clube publico variado para testar cards de descoberta.',
    iconName: 'palette',
    visibility: ClubVisibility.public,
    memberCount: 3,
    tags: ['busca', 'criativo'],
    createdAt: minutesAfter(baseDate, -140),
  });

  await addUserToClub(truthClub.id, viewer.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
    joinedAt: minutesAfter(baseDate, -170),
    lastSeenAt: minutesAfter(baseDate, -30),
  });
  await addUserToClub(truthClub.id, lia.id, {
    status: ClubMemberStatus.active,
    joinedAt: minutesAfter(baseDate, -120),
    lastSeenAt: minutesAfter(baseDate, -20),
  });
  await addUserToClub(truthClub.id, rafa.id, {
    status: ClubMemberStatus.active,
    joinedAt: minutesAfter(baseDate, -60),
    lastSeenAt: minutesAfter(baseDate, -15),
  });
  await addUserToClub(truthClub.id, bia.id, {
    status: ClubMemberStatus.active,
    joinedAt: minutesAfter(baseDate, -30),
    lastSeenAt: minutesAfter(baseDate, -8),
  });

  await addUserToClub(dareClub.id, rafa.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
    joinedAt: minutesAfter(baseDate, -150),
  });
  await addUserToClub(dareClub.id, viewer.id, {
    status: ClubMemberStatus.active,
    joinedAt: minutesAfter(baseDate, -90),
  });
  await addUserToClub(dareClub.id, caio.id, {
    status: ClubMemberStatus.active,
    joinedAt: minutesAfter(baseDate, -45),
  });
  await addUserToClub(dareClub.id, bia.id, {
    status: ClubMemberStatus.active,
    joinedAt: minutesAfter(baseDate, -25),
  });
  await addUserToClub(dareClub.id, nina.id, {
    status: ClubMemberStatus.active,
    joinedAt: minutesAfter(baseDate, -10),
  });

  await addUserToClub(creativeClub.id, nina.id, {
    role: ClubMemberRole.owner,
    status: ClubMemberStatus.active,
    joinedAt: minutesAfter(baseDate, -130),
  });
  await addUserToClub(creativeClub.id, caio.id, {
    status: ClubMemberStatus.active,
    joinedAt: minutesAfter(baseDate, -70),
  });
  await addUserToClub(creativeClub.id, lia.id, {
    status: ClubMemberStatus.active,
    joinedAt: minutesAfter(baseDate, -35),
  });

  const prompts = await Promise.all([
    createTestClubPrompt({
      clubId: truthClub.id,
      authorId: lia.id,
      type: ClubPromptType.truth,
      content: 'Qual verdade recente voce contaria para quebrar o gelo?',
      createdAt: minutesAfter(baseDate, -18),
    }),
    createTestClubPrompt({
      clubId: dareClub.id,
      authorId: rafa.id,
      type: ClubPromptType.dare,
      content: 'Grave um desafio relampago para o grupo responder hoje.',
      createdAt: minutesAfter(baseDate, -12),
    }),
    createTestClubPrompt({
      clubId: creativeClub.id,
      authorId: nina.id,
      type: ClubPromptType.truth,
      content: 'Que ideia criativa voce quer testar com amigos?',
      createdAt: minutesAfter(baseDate, -6),
    }),
  ]);

  await Promise.all([
    createTestTruth({
      authorId: lia.id,
      targetUserId: viewer.id,
      content: 'Qual segredo leve voce revelaria em uma busca visual?',
      createdAt: minutesAfter(baseDate, -50),
    }),
    createTestDare({
      authorId: rafa.id,
      targetUserId: viewer.id,
      content: 'Envie uma prova rapida para animar a descoberta.',
      createdAt: minutesAfter(baseDate, -40),
    }),
  ]);

  await prisma.club.update({
    where: {
      id: truthClub.id,
    },
    data: {
      promptCount: 1,
      lastActivityAt: minutesAfter(baseDate, -18),
    },
  });
  await prisma.club.update({
    where: {
      id: dareClub.id,
    },
    data: {
      promptCount: 1,
      lastActivityAt: minutesAfter(baseDate, -12),
    },
  });
  await prisma.club.update({
    where: {
      id: creativeClub.id,
    },
    data: {
      promptCount: 1,
      lastActivityAt: minutesAfter(baseDate, -6),
    },
  });

  return {
    users: {
      viewer,
      lia,
      rafa,
      nina,
      caio,
      bia,
    },
    clubs: {
      truthClub,
      dareClub,
      creativeClub,
    },
    prompts,
  };
}

async function main() {
  console.log('Iniciando population de descoberta da busca...');
  console.log('O script atualiza apenas o cenario seed conhecido.');

  const scenario = await populateSearch();

  console.log('Population de descoberta da busca concluida.');
  console.log('');
  console.log('Resumo do cenario criado:');
  console.log(`- Usuarios de teste: ${Object.keys(scenario.users).length}`);
  console.log(`- Clubes publicos: ${Object.keys(scenario.clubs).length}`);
  console.log(`- Prompts de clube: ${scenario.prompts.length}`);
  console.log('');
  console.log('Conta principal para conferir a busca no mobile futuro:');
  console.log(`- ${scenario.users.viewer.email} / ${DEFAULT_TEST_PASSWORD}`);
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error('Erro ao popular descoberta da busca:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
