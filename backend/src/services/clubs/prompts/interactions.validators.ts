import { ProofMediaType } from '../../../generated/prisma/client';
import { validationError } from '../core/errors';

const CLUB_PROMPT_RESPONSE_TEXT_MAX_LENGTH = 1000;
const CLUB_PROMPT_COMMENT_TEXT_MAX_LENGTH = 500;

export function normalizePromptResponseText(
  value: unknown,
  required: boolean,
) {
  if (value === undefined || value === null) {
    if (required) {
      validationError('Resposta do prompt e obrigatoria');
    }

    return null;
  }

  if (typeof value !== 'string') {
    validationError('Resposta do prompt deve ser texto');
  }

  const text = value.trim();

  if (!text) {
    if (required) {
      validationError('Resposta do prompt e obrigatoria');
    }

    return null;
  }

  if (text.length > CLUB_PROMPT_RESPONSE_TEXT_MAX_LENGTH) {
    validationError(
      `Resposta do prompt deve ter no maximo ${CLUB_PROMPT_RESPONSE_TEXT_MAX_LENGTH} caracteres`,
    );
  }

  return text;
}

export function normalizePromptResponseMediaUrl(
  value: unknown,
  required: boolean,
) {
  if (value === undefined || value === null) {
    if (required) {
      validationError('Prova do desafio e obrigatoria');
    }

    return null;
  }

  if (typeof value !== 'string') {
    validationError('URL da prova do desafio deve ser texto');
  }

  const mediaUrl = value.trim();

  if (!mediaUrl) {
    if (required) {
      validationError('Prova do desafio e obrigatoria');
    }

    return null;
  }

  return mediaUrl;
}

export function normalizePromptResponseMediaType(
  value: unknown,
  required: boolean,
) {
  if (value === undefined || value === null) {
    if (required) {
      validationError('Tipo da prova do desafio e obrigatorio');
    }

    return null;
  }

  if (
    value !== ProofMediaType.video &&
    value !== ProofMediaType.audio &&
    value !== ProofMediaType.file
  ) {
    validationError('Tipo da prova do desafio invalido');
  }

  return value;
}

export function normalizePromptCommentText(value: unknown) {
  if (typeof value !== 'string') {
    validationError('Comentario do prompt e obrigatorio');
  }

  const text = value.trim();

  if (!text) {
    validationError('Comentario do prompt e obrigatorio');
  }

  if (text.length > CLUB_PROMPT_COMMENT_TEXT_MAX_LENGTH) {
    validationError(
      `Comentario do prompt deve ter no maximo ${CLUB_PROMPT_COMMENT_TEXT_MAX_LENGTH} caracteres`,
    );
  }

  return text;
}
