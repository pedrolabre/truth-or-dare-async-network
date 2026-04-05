import { prisma } from '../lib/prisma';
import { computeDareStatus } from './dares.service';
import { getLikesCount, isLikedByUser } from './likes.service';

export type FeedItem =
  | {
    id: string;
    type: 'truth';
    title: string;
    time: string;
    likes: number;
    likesCount: number;
    likedByMe: boolean;
    comments: number;
    participants: string[];
    extraCount: number;
    canDelete: boolean;
  }
  | {
    id: string;
    type: 'dare';
    challenger: string;
    title: string;
    attemptsLabel: string;
    expiresIn: string;
    progress: number;
    canDelete: boolean;
    status: 'active' | 'concluded' | 'expired' | 'failed';
    attemptsUsed: number;
    maxAttempts: number | null;
    completedAt: string | null;
    expiresAt: string | null;
    interactionDisabled: boolean;
    likesCount: number;
    likedByMe: boolean;
  }
  | {
      id: string;
      type: 'club';
      clubName: string;
      badge: 'Verdade' | 'Desafio';
      quote: string;
      answersCount: number;
      likesCount: number;
      likedByMe: boolean;
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

export async function getFeed(userId?: string): Promise<FeedItem[]> {
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

  const truthItems: FeedItem[] = await Promise.all(
    truths.map(async (truth) => {
      const likesCount = await getLikesCount(truth.id, 'truth');
      const likedByMe = userId
        ? await isLikedByUser(userId, truth.id, 'truth')
        : false;

      return {
        id: truth.id,
        type: 'truth',
        title: truth.content,
        time: formatRelativePastDate(truth.createdAt),
        likes: likesCount,
        likesCount,
        likedByMe,
        comments: 0,
        participants: [],
        extraCount: 0,
        canDelete: truth.authorId === userId,
      };
    }),
  );

  const dareItems: FeedItem[] = await Promise.all(
    dares.map(async (dare) => {
      const status = computeDareStatus(dare);
      const attemptsUsed = dare.attemptsUsed ?? 0;
      const maxAttempts = dare.maxAttempts ?? null;

      const progress =
        maxAttempts !== null && maxAttempts > 0
          ? Math.min(attemptsUsed / maxAttempts, 1)
          : 0;

      const interactionDisabled = status !== 'active';
      const likesCount = await getLikesCount(dare.id, 'dare');
      const likedByMe = userId
        ? await isLikedByUser(userId, dare.id, 'dare')
        : false;

      return {
        id: dare.id,
        type: 'dare',
        challenger: dare.author.name,
        title: dare.content,
        attemptsLabel: `Tentativas: ${attemptsUsed}/${dare.maxAttempts}`,
        expiresIn:
          status === 'concluded'
            ? 'Concluído'
            : status === 'failed'
              ? 'Falhou'
              : dare.expiresAt
                ? formatRelativeFutureDate(dare.expiresAt)
                : '',
        progress,
        canDelete: dare.authorId === userId,
        status,
        attemptsUsed,
        maxAttempts,
        completedAt: dare.completedAt ? dare.completedAt.toISOString() : null,
        expiresAt: dare.expiresAt ? dare.expiresAt.toISOString() : null,
        interactionDisabled,
        likesCount,
        likedByMe,
      };
    }),
  );

  const clubItems: FeedItem[] = await Promise.all(
  clubPrompts.map(async (prompt) => {
    const likesCount = await getLikesCount(prompt.id, 'club');
    const likedByMe = userId
      ? await isLikedByUser(userId, prompt.id, 'club')
      : false;

    return {
      id: prompt.id,
      type: 'club',
      clubName: prompt.club.name,
      badge: prompt.type === 'truth' ? 'Verdade' : 'Desafio',
      quote: prompt.content,
      answersCount: 0,
      likesCount,
      likedByMe,
    };
  }),
);

  return [...truthItems, ...dareItems, ...clubItems];
}