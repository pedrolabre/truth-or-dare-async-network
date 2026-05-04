import type { Request, Response } from 'express';
import { signUploadUrlService } from '../services/uploads.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub: string;
    email?: string;
    name?: string;
  };
};

type ServiceError = Error & {
  statusCode?: number;
};

export async function signUploadUrlController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const result = await signUploadUrlService(userId, {
      usage: req.body?.usage,
      entityId: req.body?.entityId ?? null,
      fileName: req.body?.fileName,
      contentType: req.body?.contentType,
    });

    return res.status(201).json(result);
  } catch (error) {
    const serviceError = error as ServiceError;

    return res.status(serviceError.statusCode ?? 500).json({
      error: serviceError.message || 'Erro ao assinar upload',
    });
  }
}