import dotenv from 'dotenv';
import path from 'path';

// Carrega o .env padrão
dotenv.config();

// Se houver NODE_ENV, carrega o arquivo correspondente e sobrescreve as variáveis
if (process.env.NODE_ENV) {
  dotenv.config({
    path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`),
    override: true,
  });
}

import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
});