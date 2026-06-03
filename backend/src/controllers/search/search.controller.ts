import { Request, Response } from 'express';
import {
  getRecommendedUsers,
  getTrendingClubs,
  searchContent,
  searchClubs,
  SearchServiceError,
  searchUsers,
} from '../../services/search/search.service';
import { recordDailyMetric } from '../../services/observability/metrics';
import { safeInfo } from '../../services/observability/safe-logger';

function getAuthenticatedUserId(req: Request) {
  return req.user?.sub ?? '';
}

function handleSearchControllerError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
) {
  if (error instanceof SearchServiceError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
  }

  const message = error instanceof Error ? error.message : fallbackMessage;

  return res.status(500).json({
    error: message,
  });
}

function getPaginationQuery(req: Request) {
  const limit =
    typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
  const cursor =
    typeof req.query.cursor === 'string' ? req.query.cursor : undefined;

  return {
    limit,
    cursor,
  };
}

function getSearchFiltersQuery(req: Request) {
  const minLevel =
    typeof req.query.minLevel === 'string'
      ? Number(req.query.minLevel)
      : undefined;
  const maxLevel =
    typeof req.query.maxLevel === 'string'
      ? Number(req.query.maxLevel)
      : undefined;
  const onlineOnly = req.query.onlineOnly;
  const clubVisibility =
    typeof req.query.clubVisibility === 'string'
      ? req.query.clubVisibility
      : undefined;
  const clubTag =
    typeof req.query.clubTag === 'string' ? req.query.clubTag : undefined;

  return {
    minLevel,
    maxLevel,
    onlineOnly,
    clubVisibility,
    clubTag,
  };
}

type SearchLogPayload = {
  searchType: 'users' | 'clubs' | 'content' | 'unified';
  userId: string;
  startedAt: number;
  query: unknown;
  limit?: number;
  cursor?: string;
  resultCount: number;
  nextCursorPresent: boolean;
  usersResultCount?: number;
  clubsResultCount?: number;
  contentResultCount?: number;
};

function getQueryLength(query: unknown) {
  return typeof query === 'string' ? query.trim().length : 0;
}

function logSearchQuery({
  searchType,
  userId,
  startedAt,
  query,
  limit,
  cursor,
  resultCount,
  nextCursorPresent,
  usersResultCount,
  clubsResultCount,
  contentResultCount,
}: SearchLogPayload) {
  const occurredAt = new Date();

  recordDailyMetric({
    domain: 'search',
    type: 'query_executed',
    result: searchType,
    occurredAt,
  });
  safeInfo({
    event: 'search.query_executed',
    timestamp: occurredAt.toISOString(),
    searchType,
    userId,
    queryLength: getQueryLength(query),
    limit: limit ?? null,
    cursorPresent: Boolean(cursor),
    resultCount,
    usersResultCount,
    clubsResultCount,
    contentResultCount,
    nextCursorPresent,
    durationMs: Date.now() - startedAt,
  });
}

export async function searchUsersController(req: Request, res: Response) {
  const startedAt = Date.now();

  try {
    const pagination = getPaginationQuery(req);
    const filters = getSearchFiltersQuery(req);
    const users = await searchUsers(req.query.query, {
      userId: getAuthenticatedUserId(req),
      ...pagination,
      minLevel: filters.minLevel,
      maxLevel: filters.maxLevel,
      onlineOnly: filters.onlineOnly === 'true' || filters.onlineOnly === '1',
    });

    logSearchQuery({
      searchType: 'users',
      userId: getAuthenticatedUserId(req),
      startedAt,
      query: req.query.query,
      ...pagination,
      resultCount: users.items.length,
      nextCursorPresent: Boolean(users.nextCursor),
    });

    return res.status(200).json(users);
  } catch (error) {
    return handleSearchControllerError(
      res,
      error,
      'Erro interno ao buscar usuarios',
    );
  }
}

export async function searchClubsController(req: Request, res: Response) {
  const startedAt = Date.now();

  try {
    const pagination = getPaginationQuery(req);
    const filters = getSearchFiltersQuery(req);
    const clubs = await searchClubs(req.query.query, {
      userId: getAuthenticatedUserId(req),
      ...pagination,
      clubVisibility:
        filters.clubVisibility === 'public' ? 'public' : undefined,
      clubTag: filters.clubTag,
    });

    logSearchQuery({
      searchType: 'clubs',
      userId: getAuthenticatedUserId(req),
      startedAt,
      query: req.query.query,
      ...pagination,
      resultCount: clubs.items.length,
      nextCursorPresent: Boolean(clubs.nextCursor),
    });

    return res.status(200).json(clubs);
  } catch (error) {
    return handleSearchControllerError(
      res,
      error,
      'Erro interno ao buscar clubes',
    );
  }
}

export async function searchAllController(req: Request, res: Response) {
  const startedAt = Date.now();

  try {
    const pagination = getPaginationQuery(req);
    const filters = getSearchFiltersQuery(req);
    const userId = getAuthenticatedUserId(req);
    const [users, clubs, content] = await Promise.all([
      searchUsers(req.query.query, {
        userId,
        ...pagination,
        minLevel: filters.minLevel,
        maxLevel: filters.maxLevel,
        onlineOnly:
          filters.onlineOnly === 'true' || filters.onlineOnly === '1',
      }),
      searchClubs(req.query.query, {
        userId,
        ...pagination,
        clubVisibility:
          filters.clubVisibility === 'public' ? 'public' : undefined,
        clubTag: filters.clubTag,
      }),
      searchContent(req.query.query, {
        userId,
        ...pagination,
      }),
    ]);

    logSearchQuery({
      searchType: 'unified',
      userId,
      startedAt,
      query: req.query.query,
      ...pagination,
      resultCount: users.items.length + clubs.items.length + content.items.length,
      usersResultCount: users.items.length,
      clubsResultCount: clubs.items.length,
      contentResultCount: content.items.length,
      nextCursorPresent: Boolean(
        users.nextCursor || clubs.nextCursor || content.nextCursor,
      ),
    });

    return res.status(200).json({
      users,
      clubs,
      content,
    });
  } catch (error) {
    return handleSearchControllerError(
      res,
      error,
      'Erro interno ao buscar resultados',
    );
  }
}

export async function searchContentController(req: Request, res: Response) {
  const startedAt = Date.now();

  try {
    const pagination = getPaginationQuery(req);
    const content = await searchContent(req.query.query, {
      userId: getAuthenticatedUserId(req),
      ...pagination,
    });

    logSearchQuery({
      searchType: 'content',
      userId: getAuthenticatedUserId(req),
      startedAt,
      query: req.query.query,
      ...pagination,
      resultCount: content.items.length,
      nextCursorPresent: Boolean(content.nextCursor),
    });

    return res.status(200).json(content);
  } catch (error) {
    return handleSearchControllerError(
      res,
      error,
      'Erro interno ao buscar conteudo',
    );
  }
}

export async function getRecommendedUsersController(
  req: Request,
  res: Response,
) {
  try {
    const limit =
      typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const users = await getRecommendedUsers({
      userId: getAuthenticatedUserId(req),
      limit,
    });

    return res.status(200).json(users);
  } catch (error) {
    return handleSearchControllerError(
      res,
      error,
      'Erro interno ao buscar usuarios recomendados',
    );
  }
}

export async function getTrendingClubsController(
  req: Request,
  res: Response,
) {
  try {
    const limit =
      typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const clubs = await getTrendingClubs({
      userId: getAuthenticatedUserId(req),
      limit,
    });

    return res.status(200).json(clubs);
  } catch (error) {
    return handleSearchControllerError(
      res,
      error,
      'Erro interno ao buscar clubes em alta',
    );
  }
}
