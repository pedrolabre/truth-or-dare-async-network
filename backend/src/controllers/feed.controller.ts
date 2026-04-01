import { Request, Response } from 'express';
import { getFeed } from '../services/feed.service';

export async function getFeedController(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;

    const result = await getFeed(userId);

    return res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro interno ao carregar o feed';

    return res.status(500).json({
      error: message,
    });
  }
}