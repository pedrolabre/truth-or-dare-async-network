import { prisma } from '../../../lib/prisma';
import { duplicateSlugError } from './errors';

export function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'clube';
}

export async function resolveUniqueSlug(name: string) {
  const baseSlug = slugify(name);
  const existingClubs = await prisma.club.findMany({
    where: {
      slug: {
        startsWith: baseSlug,
      },
    },
    select: {
      slug: true,
    },
  });

  const existingSlugs = new Set(existingClubs.map((club) => club.slug));

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  for (let suffix = 2; suffix <= 1000; suffix += 1) {
    const candidate = `${baseSlug}-${suffix}`;

    if (!existingSlugs.has(candidate)) {
      return candidate;
    }
  }

  duplicateSlugError();
}
