import { Request, Response } from 'express';
import { toggleClubLike as toggleClubLikeService } from '../services/club-likes.service';
import { ClubServiceError } from '../services/clubs.service';

export async function toggleClubLike(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const targetId = typeof req.params.id === 'string' ? req.params.id : '';

    if (!userId) {
      return res.status(401).json({
        error: 'Não autorizado',
      });
    }

    if (!targetId) {
      return res.status(400).json({
        error: 'Dados inválidos',
      });
    }

    const result = await toggleClubLikeService({
      userId,
      clubId: targetId,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof ClubServiceError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
    }

    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Erro ao curtir club',
    });
  }
}
