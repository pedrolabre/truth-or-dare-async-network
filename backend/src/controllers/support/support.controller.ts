import { Request, Response } from 'express';
import { reportAbuse } from '../../services/support/support.service';
import { SupportTicketServiceError } from '../../services/support/support.errors';

export async function reportAbuseController(req: Request, res: Response) {
  try {
    const userId = req.user?.sub ?? '';
    const body = req.body ?? {};
    const ticket = await reportAbuse({
      userId,
      category: body.category,
      description: body.description,
      referenceId: body.referenceId,
      referenceType: body.referenceType,
    });

    return res.status(201).json(ticket);
  } catch (error) {
    if (error instanceof SupportTicketServiceError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
    }

    return res.status(500).json({
      error: 'Erro interno ao registrar denuncia',
    });
  }
}
