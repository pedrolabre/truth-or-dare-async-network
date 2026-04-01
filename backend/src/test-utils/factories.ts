import bcrypt from 'bcrypt';
import { ClubPromptType } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';

type BaseDateInput = {
  createdAt?: Date;
};

type CreateTestUserInput = BaseDateInput & {
  name?: string;
  email?: string;
  password?: string;
};

type CreateTestTruthInput = BaseDateInput & {
  authorId: string;
  content?: string;
};

type CreateTestDareInput = BaseDateInput & {
  authorId: string;
  content?: string;
  maxAttempts?: number;
  expiresAt?: Date | null;
};

type CreateTestClubInput = BaseDateInput & {
  createdById: string;
  name?: string;
  description?: string;
};

type CreateTestClubPromptInput = BaseDateInput & {
  clubId: string;
  authorId: string;
  type?: ClubPromptType;
  content?: string;
  maxAttempts?: number | null;
  expiresAt?: Date | null;
};

type ResetFeedDataOptions = {
  deleteUsers?: boolean;
  preserveUserEmails?: string[];
};

type BuildFeedScenarioOptions = {
  resetFirst?: boolean;
  baseDate?: Date;
};

export type FeedScenario = {
  users: {
    owner: Awaited<ReturnType<typeof createTestUser>>;
    second: Awaited<ReturnType<typeof createTestUser>>;
    third: Awaited<ReturnType<typeof createTestUser>>;
  };
  truths: [
    Awaited<ReturnType<typeof createTestTruth>>,
    Awaited<ReturnType<typeof createTestTruth>>,
  ];
  dares: [
    Awaited<ReturnType<typeof createTestDare>>,
    Awaited<ReturnType<typeof createTestDare>>,
  ];
  clubs: {
    corajosos: Awaited<ReturnType<typeof createTestClub>>;
    verdade: Awaited<ReturnType<typeof createTestClub>>;
  };
  clubPrompts: [
    Awaited<ReturnType<typeof createTestClubPrompt>>,
    Awaited<ReturnType<typeof createTestClubPrompt>>,
    Awaited<ReturnType<typeof createTestClubPrompt>>,
  ];
};

const DEFAULT_TEST_PASSWORD = '123456';

function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function withOptionalCreatedAt<T extends Record<string, unknown>>(
  data: T,
  createdAt?: Date,
) {
  if (!createdAt) {
    return data;
  }

  return {
    ...data,
    createdAt,
  };
}

function minutesAfter(baseDate: Date, minutes: number) {
  return new Date(baseDate.getTime() + minutes * 60 * 1000);
}

export async function resetFeedData(options: ResetFeedDataOptions = {}) {
  const { deleteUsers = false, preserveUserEmails = [] } = options;

  await prisma.clubMember.deleteMany();
  await prisma.clubPrompt.deleteMany();
  await prisma.club.deleteMany();
  await prisma.dare.deleteMany();
  await prisma.truth.deleteMany();

  if (!deleteUsers) {
    return;
  }

  if (preserveUserEmails.length > 0) {
    await prisma.user.deleteMany({
      where: {
        email: {
          notIn: preserveUserEmails,
        },
      },
    });

    return;
  }

  await prisma.user.deleteMany();
}

export async function createTestUser(input: CreateTestUserInput = {}) {
  const suffix = uniqueSuffix();
  const password = input.password ?? DEFAULT_TEST_PASSWORD;
  const passwordHash = await bcrypt.hash(password, 10);

  const name = input.name ?? `Usuário Teste ${suffix}`;
  const email = input.email ?? `user-${suffix}@test.com`;

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    return prisma.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        name,
        passwordHash,
      },
    });
  }

  return prisma.user.create({
    data: withOptionalCreatedAt(
      {
        name,
        email,
        passwordHash,
      },
      input.createdAt,
    ),
  });
}

export async function createTestTruth(input: CreateTestTruthInput) {
  return prisma.truth.create({
    data: withOptionalCreatedAt(
      {
        authorId: input.authorId,
        content:
          input.content ??
          'Qual foi a situação mais constrangedora que você já viveu?',
      },
      input.createdAt,
    ),
  });
}

export async function createTestDare(input: CreateTestDareInput) {
  return prisma.dare.create({
    data: withOptionalCreatedAt(
      {
        authorId: input.authorId,
        content:
          input.content ??
          'Envie um áudio cantando o refrão da última música que ouviu.',
        maxAttempts: input.maxAttempts ?? 5,
        expiresAt:
          input.expiresAt === undefined
            ? new Date(Date.now() + 1000 * 60 * 60)
            : input.expiresAt,
      },
      input.createdAt,
    ),
  });
}

export async function createTestClub(input: CreateTestClubInput) {
  return prisma.club.create({
    data: withOptionalCreatedAt(
      {
        createdById: input.createdById,
        name: input.name ?? `Clube ${uniqueSuffix()}`,
        description:
          input.description ?? 'Clube criado para testes automatizados',
      },
      input.createdAt,
    ),
  });
}

export async function addUserToClub(clubId: string, userId: string) {
  return prisma.clubMember.upsert({
    where: {
      clubId_userId: {
        clubId,
        userId,
      },
    },
    update: {},
    create: {
      clubId,
      userId,
    },
  });
}

export async function createTestClubPrompt(input: CreateTestClubPromptInput) {
  return prisma.clubPrompt.create({
    data: withOptionalCreatedAt(
      {
        clubId: input.clubId,
        authorId: input.authorId,
        type: input.type ?? ClubPromptType.truth,
        content:
          input.content ??
          'Qual foi a decisão mais impulsiva que você já tomou?',
        maxAttempts: input.maxAttempts ?? null,
        expiresAt: input.expiresAt ?? null,
      },
      input.createdAt,
    ),
  });
}

export async function buildFeedScenario(
  options: BuildFeedScenarioOptions = {},
): Promise<FeedScenario> {
  const { resetFirst = false, baseDate = new Date() } = options;

  if (resetFirst) {
    await resetFeedData();
  }

  const owner = await createTestUser({
    name: 'Pedro Roberto',
    email: 'labre@test.com',
    password: DEFAULT_TEST_PASSWORD,
    createdAt: minutesAfter(baseDate, -120),
  });

  const second = await createTestUser({
    name: 'Marina Souza',
    email: 'marina-feed@test.com',
    password: DEFAULT_TEST_PASSWORD,
    createdAt: minutesAfter(baseDate, -119),
  });

  const third = await createTestUser({
    name: 'Lucas Mendes',
    email: 'lucas-feed@test.com',
    password: DEFAULT_TEST_PASSWORD,
    createdAt: minutesAfter(baseDate, -118),
  });

  const truth1 = await createTestTruth({
    authorId: owner.id,
    content:
      'Qual foi a mentira mais deslavada que você já contou para os seus pais?',
    createdAt: minutesAfter(baseDate, -40),
  });

  const truth2 = await createTestTruth({
    authorId: second.id,
    content:
      'Qual foi a situação mais constrangedora que você já viveu em público?',
    createdAt: minutesAfter(baseDate, -30),
  });

  const dare1 = await createTestDare({
    authorId: third.id,
    content:
      'Envie um áudio cantando o refrão da última música que você ouviu hoje.',
    maxAttempts: 8,
    expiresAt: minutesAfter(baseDate, 45),
    createdAt: minutesAfter(baseDate, -20),
  });

  const dare2 = await createTestDare({
    authorId: owner.id,
    content:
      'Ligue para um amigo e fale com sotaque por pelo menos 30 segundos.',
    maxAttempts: 5,
    expiresAt: minutesAfter(baseDate, 90),
    createdAt: minutesAfter(baseDate, -10),
  });

  const corajosos = await createTestClub({
    createdById: owner.id,
    name: 'Clube dos Corajosos',
    description: 'Clube inicial para testes do feed',
    createdAt: minutesAfter(baseDate, -80),
  });

  const verdade = await createTestClub({
    createdById: second.id,
    name: 'Noite da Verdade',
    description: 'Clube focado em perguntas difíceis',
    createdAt: minutesAfter(baseDate, -70),
  });

  await addUserToClub(corajosos.id, owner.id);
  await addUserToClub(corajosos.id, second.id);
  await addUserToClub(corajosos.id, third.id);

  await addUserToClub(verdade.id, owner.id);
  await addUserToClub(verdade.id, second.id);

  const clubPrompt1 = await createTestClubPrompt({
    clubId: corajosos.id,
    authorId: owner.id,
    type: ClubPromptType.truth,
    content: 'Qual o seu maior arrependimento amoroso que ninguém sabe?',
    createdAt: minutesAfter(baseDate, -15),
  });

  const clubPrompt2 = await createTestClubPrompt({
    clubId: corajosos.id,
    authorId: third.id,
    type: ClubPromptType.dare,
    content: 'Poste uma selfie fazendo a careta mais estranha que conseguir.',
    maxAttempts: 10,
    expiresAt: minutesAfter(baseDate, 120),
    createdAt: minutesAfter(baseDate, -8),
  });

  const clubPrompt3 = await createTestClubPrompt({
    clubId: verdade.id,
    authorId: second.id,
    type: ClubPromptType.truth,
    content: 'Qual foi a maior insegurança que você já escondeu de todo mundo?',
    createdAt: minutesAfter(baseDate, -5),
  });

  return {
    users: {
      owner,
      second,
      third,
    },
    truths: [truth1, truth2],
    dares: [dare1, dare2],
    clubs: {
      corajosos,
      verdade,
    },
    clubPrompts: [clubPrompt1, clubPrompt2, clubPrompt3],
  };
}