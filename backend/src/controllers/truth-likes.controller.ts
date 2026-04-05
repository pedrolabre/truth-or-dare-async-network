import { Request, Response } from 'express';
import { toggleLike } from '../services/likes.service';

export async function toggleTruthLike(req: Request, res: Response) {
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

    const result = await toggleLike({
      userId,
      targetId,
      targetType: 'truth',
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Erro ao curtir truth',
    });
  }
}