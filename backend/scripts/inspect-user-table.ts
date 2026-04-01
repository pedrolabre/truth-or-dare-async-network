import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const columns = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
    ORDER BY ordinal_position;
  `);

  console.log('COLUNAS DA TABELA User:');
  console.dir(columns, { depth: null });

  const users = await prisma.$queryRawUnsafe(`
    SELECT *
    FROM "User"
    LIMIT 5;
  `);

  console.log('EXEMPLOS DE LINHAS DA TABELA User:');
  console.dir(users, { depth: null });
}

main()
  .catch((error) => {
    console.error('Erro ao inspecionar tabela User:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });