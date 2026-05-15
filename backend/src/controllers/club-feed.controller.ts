import { Request, Response } from 'express';
import { ClubServiceError } from '../services/clubs.service';
import { getClubFeed } from '../services/club-feed.service';
import { getClubsAggregatedFeed } from '../services/clubs-aggregated-feed.service';

function getAuthenticatedUserId(req: Request) {
  return req.user?.sub ?? '';
}

function getClubId(req: Request) {
  return typeof req.params.id === 'string' ? req.params.id : '';
}

function handleClubFeedControllerError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
) {
  if (error instanceof ClubServiceError) {
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

export async function getClubFeedController(req: Request, res: Response) {
  try {
    const feed = await getClubFeed({
      clubId: getClubId(req),
      viewerId: getAuthenticatedUserId(req),
      order: req.query.order,
    });

    return res.status(200).json(feed);
  } catch (error) {
    return handleClubFeedControllerError(
      res,
      error,
      'Erro interno ao carregar feed do clube',
    );
  }
}

export async function getClubsAggregatedFeedController(
  req: Request,
  res: Response,
) {
  try {
    const feed = await getClubsAggregatedFeed({
      viewerId: getAuthenticatedUserId(req),
    });

    return res.status(200).json(feed);
  } catch (error) {
    return handleClubFeedControllerError(
      res,
      error,
      'Erro interno ao carregar feed dos clubes',
    );
  }
}
