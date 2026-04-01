import { prisma } from '../lib/prisma';

export type FeedItem =
  | {
      id: string;
      type: 'truth';
      title: string;
      time: string;
      likes: number;
      comments: number;
      participants: string[];
      extraCount: number;
    }
  | {
      id: string;
      type: 'dare';
      challenger: string;
      title: string;
      attemptsLabel: string;
      expiresIn: string;
      progress: number;
    }
  | {
      id: string;
      type: 'club';
      clubName: string;
      badge: 'Verdade' | 'Desafio';
      quote: string;
      answersCount: number;
    };

function formatRelativePastDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 1000 / 60));

  if (diffMinutes < 60) {
    return `há ${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `há ${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `há ${diffDays}d`;
}

function formatRelativeFutureDate(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'Expirado';
  }

  const diffMinutes = Math.max(1, Math.floor(diffMs / 1000 / 60));

  if (diffMinutes < 60) {
    return `Expira em ${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Expira em ${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `Expira em ${diffDays}d`;
}

export async function getFeed(_userId?: string): Promise<FeedItem[]> {
  const [truths, dares, clubPrompts] = await Promise.all([
    prisma.truth.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        author: true,
      },
    }),
    prisma.dare.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        author: true,
      },
    }),
    prisma.clubPrompt.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        club: true,
        author: true,
      },
    }),
  ]);

  const truthItems: FeedItem[] = truths.map((truth) => ({
    id: truth.id,
    type: 'truth',
    title: truth.content,
    time: formatRelativePastDate(truth.createdAt),
    likes: 0,
    comments: 0,
    participants: [],
    extraCount: 0,
  }));

  const dareItems: FeedItem[] = dares.map((dare) => ({
    id: dare.id,
    type: 'dare',
    challenger: dare.author.name,
    title: dare.content,
    attemptsLabel: `Tentativas: 0/${dare.maxAttempts}`,
    expiresIn: dare.expiresAt ? formatRelativeFutureDate(dare.expiresAt) : '',
    progress: 0,
  }));

  const clubItems: FeedItem[] = clubPrompts.map((prompt) => ({
    id: prompt.id,
    type: 'club',
    clubName: prompt.club.name,
    badge: prompt.type === 'truth' ? 'Verdade' : 'Desafio',
    quote: prompt.content,
    answersCount: 0,
  }));

  return [...truthItems, ...dareItems, ...clubItems];
}