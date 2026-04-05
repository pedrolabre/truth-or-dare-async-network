import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

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

loadEnvFileIfExists('.env.test');
loadEnvFileIfExists('.env');
loadEnvFileIfExists('.env.test.local');

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL não definida para os testes. Configure TEST_DATABASE_URL em .env.test ou defina DATABASE_URL explicitamente.',
  );
}

process.env.NODE_ENV = 'test';