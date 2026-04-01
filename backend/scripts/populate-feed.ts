import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import {
  buildFeedScenario,
  resetFeedData,
} from '../src/test-utils/factories';

export async function populateFeed() {
  await resetFeedData();

  return buildFeedScenario();
}

async function main() {
  console.log('Iniciando population do feed...');

  const scenario = await populateFeed();

  console.log('Population do feed concluída com sucesso.');
  console.log('');
  console.log('Resumo do cenário criado:');
  console.log(`- Usuários: 3`);
  console.log(`- Truths: ${scenario.truths.length}`);
  console.log(`- Dares: ${scenario.dares.length}`);
  console.log(`- Clubs: 2`);
  console.log(`- Club prompts: ${scenario.clubPrompts.length}`);
  console.log('');
  console.log('Contas de teste principais:');
  console.log(`- ${scenario.users.owner.email} / 123456`);
  console.log(`- ${scenario.users.second.email} / 123456`);
  console.log(`- ${scenario.users.third.email} / 123456`);
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error('Erro ao popular o feed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}