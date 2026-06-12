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

import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL não configurada');
}

const shouldUseSsl =
  databaseUrl.includes('supabase.com') ||
  databaseUrl.includes('pooler.supabase.com') ||
  process.env.NODE_ENV === 'production';

const adapter = new PrismaPg({
  connectionString: databaseUrl,
  ...(shouldUseSsl
    ? {
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {}),
});

export const prisma = new PrismaClient({
  adapter,
});