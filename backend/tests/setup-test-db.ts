import { execSync } from 'child_process';
import dotenv from 'dotenv';

export default async function setup() {
  dotenv.config({ path: '.env.test' });

  console.log('🔄 Resetando banco de testes...');

 execSync('npx prisma migrate reset --force', {
  stdio: 'inherit',
  env: {
    ...process.env,
    DATABASE_URL: process.env.TEST_DATABASE_URL,
    DIRECT_URL: process.env.TEST_DATABASE_URL,
  },
});

  console.log('✅ Banco de testes pronto');
}