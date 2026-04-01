import { prisma } from '../src/lib/prisma';
import { resetFeedData } from '../src/test-utils/factories';

type TestDatabaseHooksOptions = {
  resetBeforeEach?: boolean;
  resetAfterAll?: boolean;
  disconnectAfterAll?: boolean;
};

export function applyTestDatabaseHooks(
  options: TestDatabaseHooksOptions = {},
) {
  const {
    resetBeforeEach = true,
    resetAfterAll = true,
    disconnectAfterAll = true,
  } = options;

  if (resetBeforeEach) {
    beforeEach(async () => {
      await resetFeedData();
    });
  }

  afterAll(async () => {
    if (resetAfterAll) {
      await resetFeedData();
    }

    if (disconnectAfterAll) {
      await prisma.$disconnect();
    }
  });
}

export async function clearTestDatabase() {
  await resetFeedData();
}

export async function disconnectTestDatabase() {
  await prisma.$disconnect();
}