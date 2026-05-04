import { Request, Response } from 'express';
import { submitDareProofService } from '../services/proof.service';

export async function submitDareProofController(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const dareIdParam = req.params.id;
    const dareId = Array.isArray(dareIdParam) ? dareIdParam[0] : dareIdParam;
    const { mediaType, fileUrl, durationSeconds, text } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    if (!dareId) {
      return res.status(404).json({ error: 'Dare não encontrado' });
    }

    const proof = await submitDareProofService({
      dareId,
      userId,
      mediaType,
      fileUrl,
      durationSeconds,
      text,
    });

    return res.status(201).json({
      message: 'Prova enviada com sucesso',
      proof,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Não autorizado') {
        return res.status(401).json({ error: error.message });
      }

      if (error.message === 'Dare não encontrado') {
        return res.status(404).json({ error: error.message });
      }

      if (
        error.message === 'Você não pode enviar prova para este dare' ||
        error.message === 'Dare já concluído' ||
        error.message === 'Dare sem tentativas disponíveis' ||
        error.message === 'Dare expirado'
      ) {
        return res.status(403).json({ error: error.message });
      }

      if (
        error.message === 'mediaType is required' ||
        error.message === 'mediaType must be video, audio or file' ||
        error.message === 'fileUrl is required' ||
        error.message === 'durationSeconds must be a non-negative integer' ||
        error.message === 'text must be a string'
      ) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Erro interno ao enviar prova' });
  }
}