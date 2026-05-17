import { Request, Response } from 'express';

import { toggleLike } from '../../services/likes/likes.service';

export async function toggleTruthCommentLike(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const commentId = typeof req.params.id === 'string' ? req.params.id : '';

    if (!userId) {
      return res.status(401).json({
        error: 'Não autorizado',
      });
    }

    const result = await toggleLike({
      userId,
      targetId: commentId,
      targetType: 'truth_comment',
    });

    return res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro interno ao curtir comentário';

    const status =
      message === 'Não autorizado'
        ? 401
        : message === 'Dados inválidos'
          ? 400
          : 500;

    return res.status(status).json({
      error: message,
    });
  }
}
