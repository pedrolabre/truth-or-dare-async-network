import { Request, Response } from 'express';
import { createDare, deleteDareService } from '../services/dares.service';

export async function createDareController(req: Request, res: Response) {
  try {
    const authorId = req.user?.sub;
    const { content, targetUserId, maxAttempts, expiresAt } = req.body;

    const dare = await createDare({
      authorId: authorId ?? '',
      targetUserId: typeof targetUserId === 'string' ? targetUserId : '',
      content: typeof content === 'string' ? content : '',
      maxAttempts: typeof maxAttempts === 'number' ? maxAttempts : undefined,
      expiresAt:
        typeof expiresAt === 'string' || expiresAt === null
          ? expiresAt
          : undefined,
    });

    return res.status(201).json(dare);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro interno ao criar dare';

    const status =
      message === 'authorId is required' ||
      message === 'targetUserId is required' ||
      message === 'content is required' ||
      message === 'maxAttempts must be a positive integer' ||
      message === 'expiresAt must be a valid date'
        ? 400
        : 500;

    return res.status(status).json({
      error: message,
    });
  }
}

export async function deleteDareController(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const id = typeof req.params.id === 'string' ? req.params.id : '';

    if (!userId) {
      return res.status(401).json({
        error: 'Não autorizado',
      });
    }

    await deleteDareService({
      dareId: id,
      userId,
    });

    return res.status(204).send();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro interno ao deletar dare';

    const status =
      message === 'Dare não encontrado' || message === 'Não autorizado'
        ? 400
        : 500;

    return res.status(status).json({
      error: message,
    });
  }
}