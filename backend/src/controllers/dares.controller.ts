import { Request, Response } from 'express';
import { createDare } from '../services/dares.service';

export async function createDareController(req: Request, res: Response) {
  try {
    const authorId = req.user?.sub;
    const { content } = req.body;

    const dare = await createDare({
      authorId: authorId ?? '',
      content: typeof content === 'string' ? content : '',
    });

    return res.status(201).json(dare);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro interno ao criar dare';

    const status =
      message === 'authorId is required' || message === 'content is required'
        ? 400
        : 500;

    return res.status(status).json({
      error: message,
    });
  }
}