import { Request, Response } from 'express';
import {
  DareProofServiceError,
  getDareProofDetailsService,
} from '../../services/dares/proof.service';

export async function getDareProofDetailsController(
  req: Request,
  res: Response,
) {
  try {
    const proofId =
      typeof req.params.proofId === 'string' ? req.params.proofId : '';
    const userId = req.user?.sub ?? '';

    const proof = await getDareProofDetailsService({
      proofId,
      userId,
    });

    return res.status(200).json(proof);
  } catch (error) {
    if (error instanceof DareProofServiceError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
    }

    return res.status(500).json({
      error: 'Erro interno ao buscar prova',
    });
  }
}
