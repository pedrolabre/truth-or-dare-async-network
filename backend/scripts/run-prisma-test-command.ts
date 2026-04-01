import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { spawnSync } from 'child_process';

function loadEnvFileIfExists(filename: string) {
  const filePath = path.resolve(__dirname, '..', filename);

  if (!fs.existsSync(filePath)) {
    return;
  }

  dotenv.config({
    path: filePath,
    override: true,
    quiet: true,
  });
}

loadEnvFileIfExists('.env');
loadEnvFileIfExists('.env.test');
loadEnvFileIfExists('.env.test.local');

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL não definida para comandos de teste. Configure TEST_DATABASE_URL ou DATABASE_URL em .env.test.',
  );
}

const prismaArgs = process.argv.slice(2);

if (prismaArgs.length === 0) {
  throw new Error(
    'Nenhum comando Prisma foi informado. Exemplo: tsx scripts/run-prisma-test-command.ts migrate reset --force',
  );
}

const result = spawnSync('npx', ['prisma', ...prismaArgs], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 0);